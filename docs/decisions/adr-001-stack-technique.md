# ADR-001 : Choix de la stack technique

- **Statut :** Accepté
- **Date :** 2026-09-17
- **Décideurs :** Équipe projet (4 membres), pour le TP Processus du développement logiciel
- **Contexte du sprint :** Sprint 1

## Contexte

Le projet consiste à développer un service de partage de fichiers, à réaliser from scratch (pas de wrapper autour d'un outil existant), pour un cours de Processus du développement logiciel conduit en Scrum. Contraintes structurantes :

- Équipe de 4 personnes, calendrier de 5 séances (4 sprints + 1 séance de clôture), donc peu de temps pour absorber une courbe d'apprentissage technique.
- Le Product Owner (l'enseignant) n'est pas nécessairement technique : les démos de sprint doivent être simples à montrer.
- Complexité technique volontairement modeste — le projet est évalué avant tout sur la conduite du processus (backlog, sprints, CR, tests), pas sur la sophistication technique.
- Le service doit couvrir : comptes utilisateurs, upload/download de fichiers, partage (lien, utilisateur ciblé), contrôle d'accès (expiration, mot de passe, droits), quotas et validation des fichiers.

## Options considérées

| Option | Avantages | Inconvénients |
|---|---|---|
| Python (FastAPI) + SQLite/Postgres | Démarrage rapide, doc Swagger auto-générée (démo facile), validation intégrée | Nouveau langage pour une partie de l'équipe |
| Node.js/Express + Postgres | JS/TS de bout en bout, écosystème large | Plus de code de base à écrire à la main (auth, validation, ORM) qu'avec un framework plus complet |
| Laravel + Postgres | Auth, stockage de fichiers et gestion de droits déjà outillés nativement (Storage disks, policies, signed URLs) | PHP, moins connu de l'équipe |
| Next.js + Laravel + Postgres (split frontend/backend) | Sépare clairement frontend et API | Deux écosystèmes (JS/TS + PHP) à faire cohabiter : CORS, auth cross-service, double déploiement — coût d'intégration trop élevé pour 4 sprints |
| **Next.js (frontend + API routes) + PostgreSQL via Prisma** | Un seul langage/runtime (TypeScript de bout en bout), ORM type-safe avec migrations, un seul déploiement, équipe à l'aise avec l'écosystème JS | Moins d'outillage "batteries incluses" que Laravel pour l'auth/stockage — à combler avec des libs dédiées |

## Décision

L'équipe retient **Next.js (frontend + API routes) + PostgreSQL via Prisma**.

Raisons principales :
- Un seul langage (TypeScript) sur tout le projet, ce qui limite le temps perdu en intégration entre deux écosystèmes et laisse plus de place au respect du process Scrum.
- Prisma apporte un schéma de données versionné et des migrations, utile pour tracer l'évolution du modèle au fil des sprints.
- Un déploiement unique (ex. Vercel) simplifie la démo au PO à chaque revue de sprint.

## Conséquences

- Base de données : PostgreSQL, schéma géré par Prisma (migrations versionnées dans le repo).
- Le stockage des fichiers, l'authentification et l'hébergement de démo ne sont pas couverts nativement par ce choix et restent à trancher séparément (voir points ouverts).
- L'équipe s'engage à documenter toute évolution de ce choix par un nouvel ADR plutôt que par une modification silencieuse.

## Points ouverts à trancher au Sprint 1

- **Stockage des fichiers :** disque local en développement, avec possibilité de migrer vers un stockage S3-compatible (ex. MinIO) si le besoin apparaît.
- **Authentification :** NextAuth.js ou implémentation JWT maison, à trancher selon les besoins des US de l'Epic A (comptes utilisateurs).
- **Hébergement de démo :** Vercel (déploiement simple pour Next.js) ou exécution locale/Docker, à valider avec le PO selon ses contraintes d'accès.
