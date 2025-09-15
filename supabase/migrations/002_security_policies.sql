-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Team members can view their teams" ON teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams" ON teams
    FOR UPDATE USING (
        id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Team members policies
CREATE POLICY "Team members can view team memberships" ON team_members
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners and admins can manage memberships" ON team_members
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can leave teams" ON team_members
    FOR DELETE USING (user_id = auth.uid());

-- Channels policies
CREATE POLICY "Team members can view team channels" ON channels
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
        AND (
            is_private = false OR
            id IN (
                SELECT channel_id FROM channel_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Team members can create channels" ON channels
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

CREATE POLICY "Channel creators and team admins can update channels" ON channels
    FOR UPDATE USING (
        created_by = auth.uid() OR
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Channel members policies
CREATE POLICY "Channel members can view memberships" ON channel_members
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM channels 
            WHERE team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Channel members and team admins can manage channel memberships" ON channel_members
    FOR ALL USING (
        channel_id IN (
            SELECT c.id FROM channels c
            JOIN team_members tm ON c.team_id = tm.team_id
            WHERE tm.user_id = auth.uid() 
            AND (tm.role IN ('owner', 'admin') OR c.created_by = auth.uid())
        )
    );

-- Direct messages policies
CREATE POLICY "Users can view their DM conversations" ON direct_messages
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create DM conversations" ON direct_messages
    FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their channels/DMs" ON messages
    FOR SELECT USING (
        (channel_id IS NOT NULL AND channel_id IN (
            SELECT c.id FROM channels c
            JOIN team_members tm ON c.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
            AND (
                c.is_private = false OR
                c.id IN (
                    SELECT channel_id FROM channel_members 
                    WHERE user_id = auth.uid()
                )
            )
        )) OR
        (dm_id IS NOT NULL AND dm_id IN (
            SELECT id FROM direct_messages 
            WHERE user1_id = auth.uid() OR user2_id = auth.uid()
        ))
    );

CREATE POLICY "Users can send messages to their channels/DMs" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND (
            (channel_id IS NOT NULL AND channel_id IN (
                SELECT c.id FROM channels c
                JOIN team_members tm ON c.team_id = tm.team_id
                WHERE tm.user_id = auth.uid()
                AND (
                    c.is_private = false OR
                    c.id IN (
                        SELECT channel_id FROM channel_members 
                        WHERE user_id = auth.uid()
                    )
                )
            )) OR
            (dm_id IS NOT NULL AND dm_id IN (
                SELECT id FROM direct_messages 
                WHERE user1_id = auth.uid() OR user2_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (author_id = auth.uid());

-- Message reactions policies
CREATE POLICY "Users can view reactions in accessible messages" ON message_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM messages 
            WHERE (channel_id IS NOT NULL AND channel_id IN (
                SELECT c.id FROM channels c
                JOIN team_members tm ON c.team_id = tm.team_id
                WHERE tm.user_id = auth.uid()
            )) OR
            (dm_id IS NOT NULL AND dm_id IN (
                SELECT id FROM direct_messages 
                WHERE user1_id = auth.uid() OR user2_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can manage their own reactions" ON message_reactions
    FOR ALL USING (user_id = auth.uid());

-- User presence policies
CREATE POLICY "Users can view all user presence" ON user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
    FOR UPDATE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Files policies
CREATE POLICY "Team members can view team files" ON files
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to their teams" ON files
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by AND
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "File uploaders can delete their files" ON files
    FOR DELETE USING (uploaded_by = auth.uid());
