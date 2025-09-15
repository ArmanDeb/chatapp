# Déploiement de l'Application de Messagerie B2B

Ce guide vous explique comment déployer votre application de messagerie temps réel sur Vercel avec Supabase.

## Prérequis

- Compte Vercel
- Projet Supabase configuré
- Repository Git (GitHub, GitLab, ou Bitbucket)

## 1. Configuration Supabase

### Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un nouveau projet
2. Notez votre URL du projet et votre clé anon (disponibles dans Settings > API)

### Exécuter les migrations

1. Installez la CLI Supabase :
```bash
npm install -g supabase
```

2. Connectez-vous à votre projet :
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

3. Exécutez les migrations :
```bash
supabase db push
```

### Configurer le Storage

1. Dans le dashboard Supabase, allez dans Storage
2. Créez un bucket nommé `files`
3. Configurez les politiques RLS :

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated access" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### Configurer l'authentification

1. Dans Authentication > Settings
2. Configurez votre Site URL : `https://your-app.vercel.app`
3. Ajoutez les Redirect URLs :
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (pour le développement)

## 2. Déploiement sur Vercel

### Via l'interface Vercel

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement :

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Déployez !

### Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod

# Configurer les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

## 3. Configuration du domaine personnalisé

1. Dans Vercel Dashboard > Settings > Domains
2. Ajoutez votre domaine personnalisé
3. Mettez à jour la Site URL dans Supabase

## 4. Monitoring et Analytics

### Vercel Analytics
```bash
npm install @vercel/analytics
```

Ajoutez dans `app/layout.tsx` :
```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Supabase Monitoring
- Surveillez l'usage de la base de données
- Configurez des alertes pour les limites de taux
- Monitorer les performances des requêtes

## 5. Pipeline CI/CD

### GitHub Actions (optionnel)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 6. Bonnes pratiques de sécurité

### Variables d'environnement
- Utilisez des secrets Vercel pour les clés sensibles
- Ne commitez jamais les fichiers `.env`
- Utilisez différentes clés pour développement/production

### Supabase RLS
- Toutes les tables ont Row Level Security activé
- Testez vos politiques RLS soigneusement
- Utilisez des rôles appropriés

### HTTPS
- Forcez HTTPS en production
- Configurez les headers de sécurité appropriés

## 7. Optimisations de performance

### Next.js
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-project.supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}
```

### Supabase
- Utilisez des index appropriés
- Optimisez vos requêtes
- Utilisez la mise en cache côté client

## 8. Maintenance

### Sauvegardes
- Configurez des sauvegardes automatiques dans Supabase
- Testez la restauration régulièrement

### Mises à jour
- Gardez les dépendances à jour
- Surveillez les versions de Supabase
- Testez en staging avant production

### Monitoring
- Configurez des alertes pour les erreurs
- Surveillez les performances
- Analysez les métriques d'usage

## Commandes utiles

```bash
# Développement local
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint

# Tests (si configurés)
npm test

# Supabase
supabase start      # Démarrer localement
supabase stop       # Arrêter
supabase status     # Vérifier le statut
supabase db reset   # Reset de la DB locale
```

## Support

En cas de problème :
1. Vérifiez les logs Vercel
2. Consultez les métriques Supabase
3. Testez localement d'abord
4. Vérifiez la configuration des variables d'environnement
