# Séance 2 — Revue du Sprint 1 et présentation du Sprint 2 au PO

- **Date :** 13/10/2026
- **Présents :** Yanis LAFTIMI, Wanis GUERRAM, Evan HONORAT, Ayoub ACHOUCKI (4 membres de l'équipe) + PO
- **Scrum Master :** Yanis LAFTIMI
- **Sprint 2 :** du 13/10/2026 au 20/10/2026

## Objectifs de la réunion

- Présenter au PO ce qui a été livré pendant le Sprint 1.
- Présenter les tâches retenues pour le Sprint 2 et les faire valider.
- Recueillir les retours du PO et ses nouvelles demandes.

## Bilan du Sprint 1 (du 05/10 au 12/10/2026)

| US | Responsable | Résultat |
|---|---|---|
| US-A1 — Créer un compte | Wanis | Livrée |
| US-B1 — Uploader un fichier | Yanis | Livrée |
| US-B3 — Télécharger un fichier | Ayoub | Livrée : téléchargement d'un fichier uploadé, réservé à son propriétaire (`GET /api/files/[id]/download`) |
| US-A2 — Se connecter / se déconnecter | Yanis | Non terminée à la clôture du sprint, reportée au Sprint 2 (livrée le 13/10) |

- **Sprint Goal du Sprint 1** (« créer un compte, se connecter, uploader et télécharger un fichier ») : atteint le 13/10, avec un jour de retard sur la connexion.
- Détail du sprint : voir [sprint-1.md](sprint-1.md).

## Sprint 2 — Tâches présentées au PO

**Sprint Goal** (cf. [PLANIFICATION.md](../../PLANIFICATION.md) §7) : un utilisateur gère ses fichiers et peut les partager via un lien simple.

| Ticket | Tâche | Responsable | Estimation | Statut au 13/10 |
|---|---|---|---|---|
| SCRUM-12 | US-A2 — Se connecter / se déconnecter (reportée du Sprint 1) | Yanis | 2h | Terminé |
| SCRUM-15 | US-B2 — Voir la liste de mes fichiers | Evan | 2h | Terminé |
| SCRUM-16 | US-B4 — Supprimer un fichier | Evan | 2h | En cours |
| SCRUM-17 | US-C1 — Générer un lien de partage | Ayoub | 2h | Terminé |
| SCRUM-18 | US-C3 — Accéder à un fichier partagé | Wanis | 2h | En cours |
| SCRUM-35 | Déploiement sur le serveur pedago (application + base commune) | Yanis | 2h | En cours |

### Avancement technique au jour de la réunion

- **Authentification :** connexion et déconnexion par session (cookie `HttpOnly`, sessions en base). L'upload, le téléchargement et le partage exigent d'être connecté.
- **Partage :** génération d'un lien de partage pour un fichier et page publique d'accès par lien (`/share/[token]`).
- **Liste des fichiers :** l'accueil affiche les fichiers de l'utilisateur connecté (avec téléchargement et partage) ; une page `/myfiles` existe en parallèle.
- **Déploiement :** l'application tourne sur le serveur de l'université (`pedago.univ-avignon.fr`), avec la base PostgreSQL du serveur (schéma dédié). Accès par tunnel SSH pour l'instant.
- **Documentation :** diagrammes de séquence pour US-A1, US-A2, US-B1 et US-C1 dans [docs/modelisation/](../modelisation/).

## Retours du PO

- Le PO est satisfait du travail effectué pendant le Sprint 1.
- Aucune remarque sur les tâches présentées pour le Sprint 2.
- Aucune nouvelle demande ni nouvelle contrainte.

## Décisions prises pendant la réunion

- **Sprint 2 Goal validé :** un utilisateur gère ses fichiers et peut les partager via un lien simple.
- Le contenu du Sprint 2 est validé tel que présenté, sans ajustement du backlog.

## Points d'attention de l'équipe

- **Accès à l'application déployée :** elle est accessible par tunnel SSH, testé avec succès par les 4 membres de l'équipe. Elle n'est pas exposée par une URL directe.
- **Liste des fichiers (US-B2) :** deux listes coexistent. Celle de l'accueil affiche bien les fichiers de l'utilisateur connecté. La page `/myfiles` liste le contenu du dossier `partage/` du projet (fichiers de test), sans connexion requise. À unifier.
- **Relectures :** plusieurs fusions dans `main` ont été faites sans pull request relue, contrairement à la Definition of Done.
- **Migrations :** après récupération de `main`, chacun doit lancer `npm run db:migrate` (nouvelles tables `Session` et `ShareLink`).

## Actions et responsables

| Action | Responsable | Échéance | Statut |
|---|---|---|---|
| Terminer US-B4 (suppression d'un fichier) | Evan | 20/10/2026 | En cours |
| Terminer US-C3 (accès à un fichier partagé) | Wanis | 20/10/2026 | En cours |
| Unifier les deux listes de fichiers (accueil et `/myfiles`) sur les fichiers de l'utilisateur connecté | Evan + Ayoub | 20/10/2026 | À faire |
| Faire tester l'accès par tunnel SSH à toute l'équipe | Yanis | 13/10/2026 | Fait (fonctionne pour les 4 membres) |
| Mettre à jour le serveur depuis `main` avant la prochaine revue | Yanis | 20/10/2026 | À faire |

## Rétrospective du Sprint 1 (équipe)

Bilan global : le sprint s'est bien passé, l'objectif est atteint et le PO est satisfait.

**Ce qui a bien marché**

- Les quatre US engagées ont été livrées et s'enchaînent de bout en bout : création de compte, connexion, upload, téléchargement.
- Le découpage par personne a permis d'avancer en parallèle sans se bloquer : l'upload a été développé avant la connexion grâce à un utilisateur provisoire, remplacé ensuite sans toucher au reste du code.
- La stack choisie (Next.js + Prisma, cf. ADR-001) n'a posé aucun blocage technique.
- Chaque US livrée est documentée : section API du README et diagramme de séquence.
- Les fusions dans `main` se sont faites sans conflit.

**Ce qui peut être amélioré**

- US-A2 a été livrée le lendemain de la clôture du sprint : les US dont d'autres dépendent sont à démarrer en premier.
- La répartition des US a changé en cours de sprint (US-A1 et US-A2) sans être reportée tout de suite dans le backlog.
- Plusieurs fusions dans `main` ont été faites sans relecture par un autre membre, contrairement à la Definition of Done.

**Actions d'amélioration retenues pour le Sprint 2**

- Fusionner dans `main` dès qu'une US est terminée, après mise à jour de sa branche depuis `main`.
- Faire relire chaque US par un autre membre avant de la passer à « Terminé ».
- Mettre à jour Jira dès qu'une US change de responsable ou de statut.
- Prévenir l'équipe à chaque nouvelle migration Prisma.
