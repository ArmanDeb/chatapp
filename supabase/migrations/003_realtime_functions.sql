-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;

-- Function to create a direct message conversation
CREATE OR REPLACE FUNCTION create_or_get_dm(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    dm_id UUID;
    user1 UUID;
    user2 UUID;
BEGIN
    -- Ensure consistent ordering of user IDs
    IF auth.uid() < other_user_id THEN
        user1 := auth.uid();
        user2 := other_user_id;
    ELSE
        user1 := other_user_id;
        user2 := auth.uid();
    END IF;
    
    -- Try to find existing DM
    SELECT id INTO dm_id
    FROM direct_messages
    WHERE user1_id = user1 AND user2_id = user2;
    
    -- Create new DM if it doesn't exist
    IF dm_id IS NULL THEN
        INSERT INTO direct_messages (user1_id, user2_id)
        VALUES (user1, user2)
        RETURNING id INTO dm_id;
    END IF;
    
    RETURN dm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(new_status user_status DEFAULT 'online')
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (auth.uid(), new_status, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        status = EXCLUDED.status,
        last_seen = EXCLUDED.last_seen,
        updated_at = EXCLUDED.updated_at;
    
    -- Also update the profiles table
    UPDATE profiles
    SET status = new_status, last_seen = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for mentions
CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user_id UUID;
    mention_pattern TEXT := '@[a-zA-Z0-9_-]+';
    mentions TEXT[];
    mention TEXT;
    user_name TEXT;
BEGIN
    -- Extract mentions from message content
    IF NEW.content IS NOT NULL THEN
        mentions := regexp_split_to_array(NEW.content, '\s+');
        
        FOREACH mention IN ARRAY mentions LOOP
            IF mention ~ '^@[a-zA-Z0-9_-]+$' THEN
                -- Remove @ symbol and find user
                user_name := substring(mention from 2);
                
                SELECT id INTO mentioned_user_id
                FROM profiles
                WHERE display_name ILIKE user_name
                   OR email ILIKE user_name || '%';
                
                -- Create notification if user found and not self-mention
                IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
                    INSERT INTO notifications (
                        user_id,
                        type,
                        title,
                        content,
                        data
                    ) VALUES (
                        mentioned_user_id,
                        'mention',
                        'You were mentioned',
                        NEW.content,
                        jsonb_build_object(
                            'message_id', NEW.id,
                            'author_id', NEW.author_id,
                            'channel_id', NEW.channel_id,
                            'dm_id', NEW.dm_id
                        )
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mention notifications
CREATE TRIGGER create_mention_notifications_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION create_mention_notifications();

-- Function to create notifications for new messages
CREATE OR REPLACE FUNCTION create_message_notifications()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    channel_name TEXT;
    author_name TEXT;
BEGIN
    -- Get author name
    SELECT display_name INTO author_name
    FROM profiles
    WHERE id = NEW.author_id;
    
    -- Handle DM notifications
    IF NEW.dm_id IS NOT NULL THEN
        -- Notify the other user in the DM
        SELECT CASE 
            WHEN user1_id = NEW.author_id THEN user2_id
            ELSE user1_id
        END INTO recipient_id
        FROM direct_messages
        WHERE id = NEW.dm_id;
        
        IF recipient_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                content,
                data
            ) VALUES (
                recipient_id,
                'dm',
                'New message from ' || COALESCE(author_name, 'Unknown'),
                NEW.content,
                jsonb_build_object(
                    'message_id', NEW.id,
                    'author_id', NEW.author_id,
                    'dm_id', NEW.dm_id
                )
            );
        END IF;
    END IF;
    
    -- Handle channel notifications (for now, just notify channel members)
    -- In a real app, you might want more sophisticated notification logic
    IF NEW.channel_id IS NOT NULL THEN
        SELECT name INTO channel_name
        FROM channels
        WHERE id = NEW.channel_id;
        
        -- Notify all channel members except the author
        INSERT INTO notifications (user_id, type, title, content, data)
        SELECT 
            tm.user_id,
            'message',
            'New message in #' || COALESCE(channel_name, 'unknown'),
            NEW.content,
            jsonb_build_object(
                'message_id', NEW.id,
                'author_id', NEW.author_id,
                'channel_id', NEW.channel_id
            )
        FROM team_members tm
        JOIN channels c ON tm.team_id = c.team_id
        WHERE c.id = NEW.channel_id 
          AND tm.user_id != NEW.author_id
          AND (
              c.is_private = false OR
              tm.user_id IN (
                  SELECT user_id FROM channel_members 
                  WHERE channel_id = NEW.channel_id
              )
          );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message notifications
CREATE TRIGGER create_message_notifications_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION create_message_notifications();

-- Function to automatically set user offline after period of inactivity
CREATE OR REPLACE FUNCTION auto_set_offline()
RETURNS VOID AS $$
BEGIN
    UPDATE user_presence
    SET status = 'offline'
    WHERE status != 'offline'
      AND last_seen < NOW() - INTERVAL '5 minutes';
      
    UPDATE profiles
    SET status = 'offline'
    WHERE status != 'offline'
      AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats(team_uuid UUID)
RETURNS TABLE (
    member_count BIGINT,
    channel_count BIGINT,
    message_count BIGINT,
    online_members BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM team_members WHERE team_id = team_uuid) as member_count,
        (SELECT COUNT(*) FROM channels WHERE team_id = team_uuid) as channel_count,
        (SELECT COUNT(*) FROM messages m 
         JOIN channels c ON m.channel_id = c.id 
         WHERE c.team_id = team_uuid) as message_count,
        (SELECT COUNT(*) FROM team_members tm 
         JOIN profiles p ON tm.user_id = p.id 
         WHERE tm.team_id = team_uuid AND p.status = 'online') as online_members;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search messages
CREATE OR REPLACE FUNCTION search_messages(
    search_query TEXT,
    team_uuid UUID DEFAULT NULL,
    channel_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    author_id UUID,
    channel_id UUID,
    dm_id UUID,
    created_at TIMESTAMPTZ,
    author_name TEXT,
    channel_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.author_id,
        m.channel_id,
        m.dm_id,
        m.created_at,
        p.display_name as author_name,
        c.name as channel_name
    FROM messages m
    JOIN profiles p ON m.author_id = p.id
    LEFT JOIN channels c ON m.channel_id = c.id
    WHERE m.content ILIKE '%' || search_query || '%'
      AND (team_uuid IS NULL OR c.team_id = team_uuid)
      AND (channel_uuid IS NULL OR m.channel_id = channel_uuid)
      AND (
          -- User can see channel messages if they're team members
          (m.channel_id IS NOT NULL AND c.team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid()
          )) OR
          -- User can see DM messages if they're participants
          (m.dm_id IS NOT NULL AND m.dm_id IN (
              SELECT id FROM direct_messages 
              WHERE user1_id = auth.uid() OR user2_id = auth.uid()
          ))
      )
    ORDER BY m.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
