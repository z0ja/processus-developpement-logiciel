# Séance 1 — Réunion d'ouverture avec le PO

- **Date :** 05/10/2026
- **Présents :** Yanis LAFTIMI, Wanis GUERRAM, Evan HONORAT, Ayoub ACHOUCKI


## Objectifs de la réunion

- Présenter l'équipe, les rôles et les outils choisis.
- Recueillir le besoin réel du PO au-delà de l'intitulé du sujet.
- Valider (ou faire évoluer) le backlog produit proposé.
- Définir le sprint goal et le contenu du Sprint 1.

## Déroulé
| Durée indicative | Étape |
|---|---|
| 5 min | Présentation rapide de l'équipe, des rôles et des outils (repo GitHub, backlog Jira) |
| 10 min | Recueil du besoin : questions ouvertes au PO |
| 15 min | Présentation du backlog proposé (epics + user stories), ajustement avec le PO |
| 10 min | Sélection et priorisation des user stories pour le Sprint 1 |
| 10 min | Sprint Goal, estimation rapide, engagement de l'équipe |
| 5 min | Récap des décisions, prochaines étapes |

## Questions à poser au PO

À garder simples et non techniques — le PO peut ne pas avoir un profil technique.

1. Qui sont les utilisateurs typiques du service (une petite équipe, un usage grand public, un usage personnel) ?
2. Quel est le tout premier scénario que tu veux voir fonctionner à la fin du Sprint 1 ?
3. Le partage de fichiers doit-il être possible avec n'importe qui via un simple lien, uniquement entre utilisateurs inscrits, ou les deux ?
4. Y a-t-il des contraintes de confidentialité ou de sécurité particulières auxquelles tu tiens (ex. révocation d'un partage, traçabilité des accès) ?
5. Y a-t-il des contraintes de volumétrie à prévoir (taille max d'un fichier, nombre d'utilisateurs attendus) ?
6. Parmi les fonctionnalités proposées (voir backlog ci-joint), lesquelles sont indispensables et lesquelles sont "confort" ?
7. À quoi ressemble pour toi une bonne démo de sprint : un scénario utilisateur complet, ou un point technique suffit-il ?
8. As-tu des contraintes ou préférences sur l'interface (web uniquement, mobile, accessibilité) ?

## Backlog proposé (support de présentation)

Voir [PLANIFICATION.md](../../PLANIFICATION.md) section 6 (Epics A à F) et section 7 (répartition indicative par sprint) — à parcourir avec le PO et ajuster en direct.

## Décisions prises pendant la réunion

_(à compléter)_

- Besoins/contraintes exprimés par le PO :
- Ajustements apportés au backlog :
- User stories retenues pour le Sprint 1 :
- Sprint 1 Goal :

## Sprint 1 — Backlog engagé

| US | Estimation (heure) | Responsable(s) | Statut |
|---|---|---|---|
| US-A1 — Créer un compte | 1h30 | Wanis | Terminé (fusionné dans `main` le 13/10/2026) |
| US-A2 — Se connecter / se déconnecter | 1h30 | Yanis | En revue (fusionné dans `main` le 13/10/2026, relecture à faire) |
| US-B1 — Uploader un fichier | 1h30 | Yanis | Terminé ([PR #1](https://github.com/z0ja/processus-developpement-logiciel/pull/1) fusionnée le 05/10/2026) |
| US-B3 — Télécharger un fichier | 1h30 | Ayoub | Partiel : démo qui télécharge un fichier fixe (`partage/test.txt`), pas encore reliée aux fichiers uploadés |

## Suivi du sprint

### US-B1 — Uploader un fichier (2026-10-05)

- **Réalisé :** route `POST /api/files`, stockage des fichiers sur disque local (`UPLOAD_DIR`) avec métadonnées en base (table `File`), formulaire d'upload sur la page d'accueil, migration Prisma initiale (`User`, `File`).
- **Tests :** manuels (fichier texte, binaire de 3 Mo, fichier vide, champ absent, requête non multipart, upload depuis le navigateur) — détail dans la PR.
- **Documentation :** section API du README, [diagramme de séquence](../modelisation/sequence-us-b1-upload.md).
- **Décision technique :** le point ouvert « stockage des fichiers » de l'ADR-001 est tranché pour le Sprint 1 : disque local, fichiers nommés par un identifiant aléatoire (le nom d'origine est conservé en base).
- **Dépendance :** levée le 13/10/2026 — l'utilisateur de démo provisoire est remplacé par la session (US-A2) ; l'upload exige désormais d'être connecté.
- **Hors périmètre :** taille max et types autorisés (US-E2), tests automatisés (US-E1).

### US-A2 — Se connecter / se déconnecter (2026-10-13)

- **Réalisé :** routes `POST /api/auth/login` et `POST /api/auth/logout`, page `/login`, bouton « Se déconnecter », accueil adapté selon l'état de connexion, migration Prisma `add_session` (table `Session`). `getCurrentUser()` lit maintenant la session : les routes protégées répondent `401` sans connexion.
- **Tests :** manuels (identifiants incorrects, champs manquants, connexion, upload connecté / non connecté, cookie rejoué après déconnexion, parcours complet dans le navigateur) + non-régression sur US-A1, US-B1 et la démo US-B3 ; typecheck, lint et build de production passent.
- **Documentation :** section API du README, [diagramme de séquence](../modelisation/sequence-us-a2-login.md).
- **Décision technique :** le point ouvert « authentification » de l'ADR-001 est tranché : sessions stockées en base + cookie `HttpOnly` (7 jours), sans dépendance externe (ni NextAuth ni JWT). Seule l'empreinte SHA-256 du jeton est conservée en base.
- **Changement d'attribution :** US-A1 réalisée par Wanis et US-A2 par Yanis (prévu initialement : Evan et Wanis).
- **Limites connues :** pas de limitation du nombre de tentatives de connexion ; les sessions expirées sont refusées mais pas purgées ; `/api/download` reste accessible sans connexion.

## Actions et responsables

| Action | Responsable | Échéance | Statut |
|---|---|---|---|
| Relire et fusionner la PR #1 (US-B1) | Ayoub | — | Fait (fusionnée le 05/10/2026, sans relecture préalable) |
| Brancher `getCurrentUser()` sur la session une fois US-A2 livrée | Yanis | — | Fait (US-A2) |
| Se coordonner sur la migration Prisma initiale (une seule migration `init`) | Équipe | — | Fait (une seule migration `init` dans `main`) |
| Lancer `npm run db:migrate` après récupération de `main` (nouvelle table `Session`) | Équipe | Dès récupération de `main` | À faire |
| Relire US-A2 (déjà fusionnée dans `main`) | _(relecteur à désigner)_ | _(à compléter)_ | À faire |
| Terminer US-B3 : téléchargement d'un fichier uploadé, par `id`, réservé à son propriétaire (réutiliser `resolveStoragePath()` de `src/lib/storage.ts`) | Ayoub | Fin du Sprint 1 | À faire |
