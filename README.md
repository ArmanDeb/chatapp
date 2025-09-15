# 💬 ChatApp - Application de Messagerie B2B Temps Réel

Une application de messagerie d'équipe moderne et complète construite avec **Next.js 15** et **Supabase**, offrant une communication temps réel pour les équipes professionnelles.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)

## 🚀 Fonctionnalités

### ✅ **MVP Complet**
- **🔐 Authentification** - Inscription/connexion sécurisée avec Supabase Auth
- **👥 Gestion d'équipes** - Création, invitation, gestion des rôles (owner/admin/member)
- **📢 Canaux de discussion** - Canaux publics et privés avec gestion des membres
- **💬 Messagerie temps réel** - Messages instantanés avec Supabase Realtime
- **📩 Messages privés** - Conversations directes 1:1 entre utilisateurs
- **📎 Upload de fichiers** - Documents, images avec drag & drop (Supabase Storage)
- **👁️ Présence en ligne** - Statuts utilisateur (online/away/busy/offline)
- **🔔 Notifications** - Mentions, nouveaux messages avec notifications navigateur
- **⚡ Réactions** - Emojis sur les messages
- **🧵 Threads** - Réponses organisées (prêt à implémenter)
- **🔍 Recherche** - Interface de recherche dans les messages
- **🎨 Interface moderne** - Design professionnel avec thème dark/light

### 🛠️ **Architecture Technique**
- **Frontend** : Next.js 15 (App Router, Server Actions, RSC)
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI** : Tailwind CSS + shadcn/ui
- **Types** : TypeScript avec types générés Supabase
- **Sécurité** : Row Level Security (RLS) complet
- **Temps réel** : WebSocket via Supabase Realtime

## 📋 Prérequis

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Compte Supabase** (gratuit)

## 🏗️ Installation

### 1. **Cloner le projet**
   ```bash
git clone <your-repo-url>
cd chatapp
   ```

### 2. **Installer les dépendances**
   ```bash
npm install
```

### 3. **Configuration Supabase**

#### Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL** et **clé anon** (Settings > API)

#### Configurer les variables d'environnement
   ```bash
# Créer le fichier .env.local
cp env.example .env.local
```

Remplissez `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
```

### 4. **Exécuter les migrations SQL**

Dans votre dashboard Supabase → **SQL Editor**, exécutez dans l'ordre :

1. **Tables principales** : `supabase/migrations/001_initial_schema.sql`
2. **Sécurité RLS** : `supabase/migrations/002_security_policies.sql`  
3. **Fonctions** : `supabase/migrations/003_realtime_functions.sql`
4. **Realtime** : `supabase/migrations/004_enable_realtime.sql`

### 5. **Configurer le Storage**

Dans Supabase → **Storage** :
1. Créer un bucket `files`
2. Le rendre **Public**

### 6. **Configurer l'authentification**

Dans Supabase → **Authentication** → **Settings** :
1. **Site URL** : `http://localhost:3000`
2. **Redirect URLs** : `http://localhost:3000/auth/callback`

## 🚀 Lancer l'application

   ```bash
   npm run dev
   ```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
chatapp/
├── app/                          # Pages Next.js (App Router)
│   ├── app/                     # Application principale (protégée)
│   │   ├── layout.tsx          # Layout avec providers
│   │   ├── page.tsx            # Page d'accueil app
│   │   └── teams/              # Gestion équipes (à implémenter)
│   ├── auth/                   # Pages d'authentification
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── ...
│   ├── layout.tsx              # Layout racine
│   └── page.tsx                # Redirection vers app
├── components/                  # Composants React
│   ├── chat/                   # Composants messagerie
│   │   ├── chat-context.tsx   # Context temps réel
│   │   ├── message-list.tsx   # Liste des messages
│   │   ├── message-item.tsx   # Affichage message
│   │   ├── message-input.tsx  # Saisie message
│   │   └── file-upload.tsx    # Upload fichiers
│   ├── layout/                 # Layout application
│   │   ├── app-sidebar.tsx    # Sidebar navigation
│   │   └── app-header.tsx     # Header avec recherche
│   ├── notifications/          # Système notifications
│   ├── presence/              # Gestion présence
│   └── ui/                    # Composants UI base
├── lib/                        # Utilitaires et logique
│   ├── actions/               # Server Actions Next.js
│   │   ├── teams.ts          # Actions équipes
│   │   ├── channels.ts       # Actions canaux
│   │   ├── messages.ts       # Actions messages
│   │   ├── files.ts          # Actions fichiers
│   │   └── direct-messages.ts # Actions DM
│   ├── supabase/             # Configuration Supabase
│   │   ├── client.ts         # Client côté navigateur
│   │   ├── server.ts         # Client côté serveur
│   │   └── middleware.ts     # Middleware auth
│   └── types/                # Types TypeScript
│       ├── database.ts       # Types générés Supabase
│       └── app.ts           # Types application
├── supabase/                   # Migrations et config Supabase
│   └── migrations/            # Scripts SQL
└── README.md                  # Ce fichier
```

## 🎯 Utilisation

### **Premier démarrage**

1. **Créer un compte** sur la page d'inscription
2. **Créer votre première équipe**
3. **Inviter des membres** (optionnel)
4. **Commencer à chatter** dans le canal #general

### **Fonctionnalités principales**

- **📢 Canaux** : Créez des canaux publics ou privés
- **💬 Messages** : Envoyez des messages avec formatage
- **📎 Fichiers** : Glissez-déposez vos documents
- **😀 Réactions** : Réagissez avec des emojis
- **@Mentions** : Mentionnez des utilisateurs
- **🔍 Recherche** : Trouvez vos messages rapidement
- **📱 Temps réel** : Tout se synchronise instantanément

## 🔧 Développement

### **Commandes utiles**

```bash
# Développement
npm run dev

# Build de production
npm run build
npm start

# Linting
npm run lint

# Types Supabase (si configuré)
npm run types:generate
```

### **Structure de la base de données**

**Tables principales :**
- `profiles` - Profils utilisateurs
- `teams` - Équipes/organisations  
- `team_members` - Membres avec rôles
- `channels` - Canaux de discussion
- `messages` - Messages avec métadonnées
- `direct_messages` - Conversations privées
- `files` - Métadonnées fichiers
- `notifications` - Notifications système
- `user_presence` - Statuts de présence

### **API & Server Actions**

Toutes les opérations utilisent les **Server Actions** Next.js :
- `createTeam()`, `joinTeam()`, `leaveTeam()`
- `createChannel()`, `updateChannel()`, `deleteChannel()`
- `sendMessage()`, `updateMessage()`, `deleteMessage()`
- `uploadFile()`, `deleteFile()`
- `createOrGetDirectMessage()`

## 🚀 Déploiement

### **Vercel + Supabase (Recommandé)**

1. **Push sur GitHub**
2. **Connecter à Vercel**
3. **Configurer les variables d'environnement**
4. **Déployer !**

Voir [README-DEPLOYMENT.md](README-DEPLOYMENT.md) pour le guide détaillé.

### **Variables d'environnement production**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🔒 Sécurité

- **🛡️ Row Level Security** - Toutes les tables protégées
- **🔐 Authentification** - Gestion complète des sessions
- **👥 Permissions** - Rôles granulaires (owner/admin/member)
- **🔒 Validation** - Validation côté serveur et client
- **🚫 CORS** - Configuration sécurisée

## 🎨 Personnalisation

### **Thèmes**
- Support dark/light mode
- Personnalisation via CSS variables
- Composants shadcn/ui modifiables

### **Extensions futures**
- 📞 Appels audio/vidéo
- 🤖 Bots et intégrations
- 📊 Analytics d'équipe
- 🔍 Recherche full-text avancée
- 📚 Base de connaissances

## 🐛 Dépannage

### **Problèmes courants**

**❌ Application ne charge pas**
- Vérifiez les variables d'environnement
- Exécutez les migrations SQL
- Vérifiez la console navigateur (F12)

**❌ Messages temps réel ne fonctionnent pas**
- Vérifiez la configuration Realtime dans Supabase
- Exécutez `004_enable_realtime.sql`

**❌ Upload de fichiers échoue**
- Créez le bucket `files` dans Supabase Storage
- Vérifiez les politiques RLS du storage

**❌ Erreurs d'authentification**
- Vérifiez les URLs de redirection
- Configurez correctement la Site URL

### **Logs et debugging**

```bash
# Logs Next.js
npm run dev

# Logs Supabase (dashboard)
# Supabase → Logs → API/Database
```

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **[Next.js](https://nextjs.org/)** - Framework React
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Composants UI
- **[Lucide](https://lucide.dev/)** - Icônes

---

**🚀 Prêt à révolutionner la communication de votre équipe ?**

[Démarrer maintenant](#-installation) • [Documentation complète](README-DEPLOYMENT.md) • [Signaler un bug](issues)