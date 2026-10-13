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
| `npm run db:studio` | Interface d'exploration de la base |

## API

| Méthode | Route | US | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | US-A1 | Création de compte (`application/json`, champs `email`, `password`, optionnel `confirmPassword`). Réponses : `201` + utilisateur créé, `400` si champs invalides, `409` si email déjà existant. |
| `POST` | `/api/files` | US-B1 | Upload d'un fichier (`multipart/form-data`, champ `file`). Réponses : `201` + métadonnées du fichier, `400` si fichier absent ou vide, `401` si non authentifié. |

```bash
# Inscription (US-A1)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@exemple.fr","password":"MotDePasseSecret123"}'

# Upload d'un fichier (US-B1)
curl -F "file=@mon-fichier.pdf" http://localhost:3000/api/files
```

Les fichiers sont stockés dans `UPLOAD_DIR` sous un nom aléatoire ; le nom d'origine, le type MIME et la taille sont enregistrés en base (table `File`).

> En attendant l'authentification (US-A2), les fichiers sont rattachés à un utilisateur de démo (`demo@partage.local`) — voir `src/lib/current-user.ts`.

## Structure

```
prisma/schema.prisma      # modèle de données (User, File)
src/app/                  # pages et routes API (Next.js App Router)
src/lib/prisma.ts         # client Prisma partagé
src/lib/storage.ts        # stockage des fichiers sur disque
src/lib/current-user.ts   # utilisateur courant (provisoire, cf. US-A2)
docs/                     # ADR, comptes-rendus, backlog
```

## Contribution

- Une branche par user story (`feat/US-B1-upload`, `fix/...`), fusion via **pull request relue par au moins un autre membre** (cf. Definition of Done).
- Référencer l'US dans le titre de PR et les commits (ex. `US-A1: formulaire d'inscription`).
- Toute évolution du schéma passe par une migration Prisma versionnée ; toute décision technique structurante par un nouvel ADR.
