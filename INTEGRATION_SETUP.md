# 🚀 Frontend-Backend Integration Setup

## 📁 Fichiers créés

### 1. Client API Centralisé

- **`src/lib/apiClient.ts`** - Configuration Axios avec intercepteurs
  - Gestion automatique du token JWT
  - Redirection auth si 401
  - URL dynamique via `VITE_API_URL`

### 2. Services API

- **`src/lib/services/userService.ts`** - Authentification et gestion des utilisateurs
  - `register()`, `login()`, `getCurrentUser()`, `getUser()`
  - `createClass()`, `addClassMember()`

- **`src/lib/services/sessionService.ts`** - Gestion des sessions d'évaluation
  - `createSession()`, `createSessionWithFile()`
  - `sendMessage()`, `endSession()`
  - Support fichiers et GitHub URLs

- **`src/lib/services/uploadService.ts`** - Configuration des uploads
  - `getLimits()` - Récupère les restrictions

- **`src/lib/services/reportService.ts`** - Rapports et analytics
  - `getTeacherReport()` - Stats par classe
  - `getStudentReport()` - Progression étudiante

### 3. Hooks React Query

- **`src/hooks/useApi.ts`** - Hooks personnalisés pré-configurés
  - Authentication: `useLogin()`, `useRegister()`, `useCurrentUser()`
  - Sessions: `useCreateSession()`, `useSendMessage()`, `useEndSession()`
  - Reports: `useTeacherReport()`, `useStudentReport()`
  - Et plus...

### 4. Documentation & Exemples

- **`src/lib/API_USAGE_GUIDE.ts`** - Guide complet d'utilisation avec exemples
- **`.env.example`** - Variables d'environnement frontend
- **`Backend/.env.example`** - Variables d'environnement backend

---

## 📦 Installation requise

### Frontend

```bash
cd "d:\Dossiers\GaAlBRAIN AI\deep-learn-insight"
npm install axios
```

### Backend (si pas déjà fait)

```bash
cd "d:\Dossiers\GaAlBRAIN AI\Backend"
npm install
```

---

## ⚙️ Configuration

### 1. Créer `.env` Frontend

Copier `.env.example` en `.env`:

```
VITE_API_URL=http://localhost:3001
VITE_DEBUG=false
```

### 2. Créer `.env` Backend

Configurer avec vos clés API:

```
PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-key
GEMINI_API_KEY=your-key
```

---

## 🚀 Démarrage

### Terminal 1: Backend

```bash
cd Backend
npm run dev
# Écoute sur http://localhost:3001
```

### Terminal 2: Frontend

```bash
cd deep-learn-insight
npm run dev
# Écoute sur http://localhost:3000 (ou différent)
```

### Vérifier la connexion

```bash
curl http://localhost:3001/api/health
```

---

## 💡 Utilisation dans les composants

### Avec Hooks (Recommandé)

```tsx
import { useLogin, useCreateSession } from "@/hooks/useApi";

export function MyComponent() {
  const loginMutation = useLogin();

  const handleLogin = async () => {
    const response = await loginMutation.mutateAsync({
      email: "user@example.com",
      password: "password123",
    });
    localStorage.setItem("authToken", response.data.token);
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### Directement les Services

```tsx
import userService from "@/lib/services/userService";

const response = await userService.login({
  email: "user@example.com",
  password: "password123",
});
```

---

## 🔐 Flux d'authentification

1. User fait login/register
2. Backend retourne JWT token
3. Frontend stocke dans `localStorage.authToken`
4. `apiClient.ts` ajoute automatiquement le token à chaque requête
5. Token envoyé dans header `Authorization: Bearer <token>`
6. Si 401 (token expiré), redirection vers `/auth/login`

---

## 📝 Architecture API

```
Frontend (React + TanStack Start)
    ↓
apiClient.ts (Axios interceptors)
    ↓
Services (userService, sessionService, etc.)
    ↓
Hooks (useLogin, useCreateSession, etc.)
    ↓
Composants React
    ↓
HTTP Requests
    ↓
Backend (Express)
```

---

## ✅ Checklist

- [x] Services API créés
- [x] Hooks React Query créés
- [x] Client API centralisé configuré
- [x] Documentation créée
- [ ] `npm install axios` dans frontend
- [ ] Créer `.env` frontend
- [ ] Créer `.env` backend avec clés API
- [ ] Démarrer backend sur 3001
- [ ] Démarrer frontend sur 3000
- [ ] Tester connexion API

---

## 🔗 Endpoints disponibles

### Users

- `POST /api/users/register` - Créer compte
- `POST /api/users/login` - Se connecter
- `GET /api/users/me` - Utilisateur actuel
- `GET /api/users/:id` - Profil utilisateur

### Sessions

- `POST /api/sessions` - Créer évaluation
- `GET /api/sessions/:id` - Détails session
- `POST /api/sessions/:id/message` - Envoyer réponse
- `POST /api/sessions/:id/end` - Terminer évaluation

### Reports

- `GET /api/reports/teacher/:teacherId` - Stats classe
- `GET /api/reports/student/:studentId` - Progression

### Health

- `GET /api/health` - État du serveur
