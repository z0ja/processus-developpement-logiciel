# Service de partage de fichiers — Processus de développement logiciel

Projet de TP (M1, 2026-2027) mené en **Scrum** sur 4 sprints : un service web de partage de fichiers développé from scratch (comptes, upload/download, partage par lien ou entre utilisateurs, contrôle d'accès).

- **Planification, backlog, rôles, DoR/DoD :** [PLANIFICATION.md](PLANIFICATION.md)
- **Décisions d'architecture (ADR) :** [docs/decisions/](docs/decisions/)
- **Comptes-rendus de sprint :** [docs/comptes-rendus/](docs/comptes-rendus/)
- **Export du backlog (import Jira) :** [docs/backlog/jira-import.csv](docs/backlog/jira-import.csv)

## Stack

Next.js (App Router, frontend + API routes) · TypeScript · PostgreSQL via Prisma · Tailwind CSS — voir [ADR-001](docs/decisions/adr-001-stack-technique.md).

## Démarrage

Prérequis : Node.js ≥ 20, PostgreSQL (local ou via Docker).

```bash
npm install                 # installe les dépendances et génère le client Prisma
cp .env.example .env        # puis adapter DATABASE_URL si besoin
docker compose up -d db     # (optionnel) lance PostgreSQL en local
npm run db:migrate          # applique les migrations
npm run dev                 # http://localhost:3000
```

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et lancement en production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crée/applique une migration Prisma (`-- --name <nom>`) |
| `npm run db:deploy` | Applique les migrations existantes sans en créer (serveur de déploiement) |
| `npm run db:studio` | Interface d'exploration de la base |

## API

| Méthode | Route | US | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | US-A1 | Création de compte (`application/json`, champs `email`, `password`, optionnel `confirmPassword`). Réponses : `201` + utilisateur créé, `400` si champs invalides, `409` si email déjà existant. |
| `POST` | `/api/auth/login` | US-A2 | Connexion (`application/json`, champs `email`, `password`). Réponses : `200` + utilisateur et cookie de session `session` (`HttpOnly`, 7 jours), `400` si champs manquants, `401` si identifiants incorrects. |
| `POST` | `/api/auth/logout` | US-A2 | Déconnexion : supprime la session en base et le cookie. Réponse : `200` (même sans session ouverte). |
| `POST` | `/api/files` | US-B1 | Upload d'un fichier (`multipart/form-data`, champ `file`). Réponses : `201` + métadonnées du fichier, `400` si fichier absent ou vide, `401` si non authentifié. |

```bash
# Inscription (US-A1)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@exemple.fr","password":"MotDePasseSecret123"}'

# Connexion (US-A2) — le cookie de session est enregistré dans cookies.txt
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@exemple.fr","password":"MotDePasseSecret123"}'

# Upload d'un fichier (US-B1) — nécessite d'être connecté
curl -b cookies.txt -F "file=@mon-fichier.pdf" http://localhost:3000/api/files

# Déconnexion (US-A2)
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

Les fichiers sont stockés dans `UPLOAD_DIR` sous un nom aléatoire ; le nom d'origine, le type MIME et la taille sont enregistrés en base (table `File`).

Les sessions sont stockées en base (table `Session`) : le cookie contient un jeton aléatoire, la base n'en conserve que l'empreinte SHA-256. Les routes protégées récupèrent l'utilisateur connecté via `getCurrentUser()` (`src/lib/current-user.ts`) et répondent `401` s'il n'y en a pas.

## Déploiement sur le serveur pedago

L'instance déployée sur `pedago.univ-avignon.fr` est l'environnement commun de l'équipe et du PO : une seule base et un seul dossier de fichiers. Chacun garde sa base locale pour développer.

- **Base :** PostgreSQL du serveur, base commune `etd`. Les tables sont créées dans le **schéma personnel** du compte qui déploie (`uapv…`), pas dans `public` (partagé entre tous les étudiants). La connexion passe par le socket local, sans mot de passe : elle ne fonctionne que depuis le serveur.
- **Fichiers :** dossier `UPLOAD_DIR` sur le serveur.

Sur le serveur (Node.js ≥ 20), dans le dossier du projet :

```bash
cp .env.example .env    # puis activer la ligne DATABASE_URL « serveur pedago » en remplaçant <login>
npm ci
npm run db:deploy       # applique les migrations dans le schéma personnel
npm run build
npm start -- -p <port>
```

Après chaque mise à jour de `main` : `git pull && npm ci && npm run db:deploy && npm run build`, puis relancer `npm start`.

> `npm run db:migrate` (création de migrations) reste réservé au développement local : il a besoin de créer une base temporaire, ce que le serveur n'autorise pas.

## Structure

```
prisma/schema.prisma      # modèle de données (User, Session, File)
src/app/                  # pages et routes API (Next.js App Router)
src/lib/prisma.ts         # client Prisma partagé
src/lib/storage.ts        # stockage des fichiers sur disque
src/lib/session.ts        # sessions de connexion (cookie + table Session)
src/lib/current-user.ts   # utilisateur connecté (lu depuis la session)
docs/                     # ADR, comptes-rendus, backlog
```

## Contribution

- Une branche par user story (`feat/US-B1-upload`, `fix/...`), fusion via **pull request relue par au moins un autre membre** (cf. Definition of Done).
- Référencer l'US dans le titre de PR et les commits (ex. `US-A1: formulaire d'inscription`).
- Toute évolution du schéma passe par une migration Prisma versionnée ; toute décision technique structurante par un nouvel ADR.
