# Sprint 2 — Compte rendu

- **Scrum Master :** Yanis LAFTIMI
- **Sprint Goal** (cf. [PLANIFICATION.md](../../PLANIFICATION.md) §7) : un utilisateur gère ses fichiers et peut les partager via un lien simple.

## Ouverture du sprint (séance 2 avec le PO)

- **Présents :** Yanis LAFTIMI, Wanis GUERRAM, Evan HONORAT, Ayoub ACHOUCKI (4 membres de l'équipe) + PO
- **Revue du Sprint 1 :** US-B1 livrée ; US-A1, US-A2 et US-B3 reportées au Sprint 2. Détail et rétrospective : voir [sprint-1.md](sprint-1.md).
- **Retours du PO :** satisfait du Sprint 1, aucune remarque sur les tâches du Sprint 2, aucune nouvelle demande ni contrainte.
- **Décisions :** Sprint Goal et contenu du Sprint 2 validés tels que présentés, sans ajustement du backlog.

## Planning prévisionnel

Séance 2 : 8h30 – 11h30 (3h par personne). Les tâches non terminées au Sprint 1 sont reportées avec leur estimation d'origine.

| Ticket | Tâche | Responsable | Temps alloué |
|---|---|---|---|
| SCRUM-11 | US-A1 — Créer un compte (reportée du Sprint 1) | Wanis | 1h30 |
| SCRUM-12 | US-A2 — Se connecter / se déconnecter (reportée du Sprint 1) | Yanis | 2h |
| SCRUM-14 | US-B3 — Télécharger un fichier (reportée du Sprint 1) | Ayoub | 1h30 |
| SCRUM-15 | US-B2 — Voir la liste de mes fichiers | Evan | 2h |
| SCRUM-16 | US-B4 — Supprimer un fichier | Evan | 2h |
| SCRUM-17 | US-C1 — Générer un lien de partage | Ayoub | 2h |
| SCRUM-18 | US-C3 — Accéder à un fichier partagé | Wanis | 2h |
| SCRUM-35 | Déploiement sur le serveur pedago (application + base commune) | Yanis | 2h |
| | **Total** | | **15h** |

## Déroulement du sprint

- **Authentification :** connexion et déconnexion par session (cookie `HttpOnly`, sessions en base). L'upload, le téléchargement et le partage exigent d'être connecté.
- **Liste des fichiers :** l'accueil affiche les fichiers de l'utilisateur connecté, avec téléchargement et partage. Une page `/myfiles` existe en parallèle.
- **Partage :** génération d'un lien de partage pour un fichier et page publique d'accès par lien (`/share/[token]`), avec téléchargement du fichier partagé.
- **Déploiement :** l'application tourne sur le serveur de l'université (`pedago.univ-avignon.fr`), avec la base PostgreSQL du serveur (schéma dédié). Accès par tunnel SSH, testé avec succès par les 4 membres.
- **Documentation :** diagrammes de séquence pour US-A1, US-A2, US-B1 et US-C1 dans [docs/modelisation/](../modelisation/).

## Planning réel

Temps reconstitué à partir de l'heure des commits pendant la séance : le travail sans commit n'y apparaît pas. Aucun commit n'a été fait entre la séance 2 et la séance 3.

| Ticket | Tâche | Responsable | Temps réel | Fin de sprint | Report |
|---|---|---|---|---|---|
| SCRUM-11 | US-A1 — Créer un compte | Wanis | 0h30 | Terminée | — |
| SCRUM-12 | US-A2 — Se connecter / se déconnecter | Yanis | 0h45 | Terminée | — |
| SCRUM-35 | Déploiement sur le serveur pedago | Yanis | 1h15 | Terminé | — |
| SCRUM-14, 17, 18 | US-B3 (fin), US-C1 et page d'accès par lien de US-C3 (un seul commit) | Ayoub | 1h15 | Terminées | — |
| SCRUM-15 | US-B2 — Voir la liste de mes fichiers | Evan | 1h30 | Terminée | — |
| SCRUM-16 | US-B4 — Supprimer un fichier | Evan | Aucun commit | Non commencée | Sprint 3 |
| | **Total visible** | | **5h15** | | |

**Bilan :** Sprint Goal atteint pour le partage par lien ; la suppression d'un fichier (US-B4) est reportée au Sprint 3.

## Points d'attention de l'équipe

- **Accès à l'application déployée :** uniquement par tunnel SSH, pas d'URL directe.
- **Liste des fichiers (US-B2) :** deux listes coexistent. Celle de l'accueil affiche bien les fichiers de l'utilisateur connecté. La page `/myfiles` liste le contenu du dossier `partage/` du projet (fichiers de test), sans connexion requise. À unifier.
- **Relectures :** plusieurs fusions dans `main` ont été faites sans pull request relue, contrairement à la Definition of Done.
- **Migrations :** après récupération de `main`, chacun doit lancer `npm run db:migrate` (nouvelles tables `Session` et `ShareLink`).

## Actions et responsables

| Action | Responsable | Statut en fin de sprint |
|---|---|---|
| Terminer US-B4 (suppression d'un fichier) | Evan | Non fait, reporté au Sprint 3 |
| Terminer US-C3 (accès à un fichier partagé) | Wanis | Fait pendant la séance 2 (commit d'Ayoub), retouché au Sprint 3 |
| Unifier les deux listes de fichiers (accueil et `/myfiles`) sur les fichiers de l'utilisateur connecté | Evan + Ayoub | Non fait, reporté au Sprint 3 |
| Faire tester l'accès par tunnel SSH à toute l'équipe | Yanis | Fait (fonctionne pour les 4 membres) |
| Mettre à jour le serveur depuis `main` avant la prochaine revue | Yanis | Remplacé au Sprint 3 par un script de mise à jour du serveur |

## Rétrospective du Sprint 2 (équipe)

Bilan global : l'objectif du sprint est atteint pour le partage par lien, mais la suppression d'un fichier est reportée.

**Ce qui a bien marché**

- Les tâches reportées du Sprint 1 ont été terminées dès le début de la séance.
- Un utilisateur peut lister ses fichiers et les partager par lien.
- L'application est déployée sur le serveur de l'université et accessible à toute l'équipe.
- Jira est tenu à jour (responsables, statuts, nouvelles US).

**Ce qui peut être amélioré**

- Tout le travail se fait pendant les séances : aucun commit entre la séance 2 et la séance 3.
- Le planning prévu (15h) dépasse le temps disponible dans une séance de 3h à 4 personnes (12h).
- US-B4 est marquée terminée dans le Sprint 2 sur Jira alors qu'elle a été réalisée plus tard.
- Les relectures par un autre membre restent rares, malgré l'action retenue au Sprint 1.

**Actions d'amélioration retenues pour le Sprint 3**

- Avancer régulièrement pendant le sprint, avec un point d'avancement sur Discord en milieu de sprint.
- Passer par une pull request relue par un autre membre pour chaque US.
- Quand plusieurs US touchent les mêmes fichiers, se coordonner avant de commencer et fusionner au plus tôt.
- Ne passer une US à « Terminé » dans Jira qu'une fois fusionnée dans `main`.

---

## Annexe — Compte-rendu de la réunion de sprint (version de z0ja)

> Version rédigée en parallèle (commit `11bc0cf`, 06/11/2026), conservée telle quelle lors de la fusion de `main`. Elle mentionne un nouveau budget et une réorganisation annoncés par le PO, qui ne figurent pas dans le compte-rendu ci-dessus : à harmoniser en équipe.

- **Date :** _(à compléter)_
- **Présents :** _(équipe + PO)_
- **Scrum Master :** _(toi)_

> Ce document sert de compte-rendu de la réunion de sprint : bilan du sprint précédent, point d'avancement sur le sprint en cours, et annonce du nouveau budget et de la réorganisation associée.

### Bilan du sprint précédent

Le sprint précédent est **terminé**. L'équipe a rempli l'ensemble des engagements pris lors de la réunion d'ouverture, avec l'aboutissement complet de l'**Epic A — Comptes utilisateurs**. Cela signifie que l'inscription, la connexion et la déconnexion sont fonctionnelles de bout en bout, et que le socle d'authentification est désormais stable et utilisable comme base pour les fonctionnalités suivantes.

Deux user stories supplémentaires ont également été livrées et validées :

- **US-B2 — Voir la liste de mes fichiers** : l'utilisateur peut consulter la liste des fichiers qui lui sont associés. C'est une brique importante puisqu'elle rend le service réellement utilisable au quotidien, au-delà du simple upload.
- **US-C1 — Générer un lien de partage** : l'utilisateur peut désormais créer un lien de partage pour un de ses fichiers. C'est la première fonctionnalité de l'Epic C à voir le jour, et elle ouvre la voie aux stories suivantes du partage (accès au fichier partagé, partage direct entre utilisateurs).

L'équipe considère donc ce sprint comme un succès : l'Epic A est clos, et le socle « gestion de fichiers » avance conformément au backlog. Les points techniques notables à retenir sont la mise en place de la persistance côté serveur pour les fichiers et la génération d'identifiants uniques pour les liens de partage. Le PO a confirmé que la démo correspondait bien à ses attentes.

### Sprint en cours (Sprint 2)

Le **Sprint 2 est en cours**. Il s'appuie sur les acquis du sprint précédent et poursuit la construction du service autour de deux axes : finaliser la gestion des fichiers côté utilisateur, et faire vivre le partage de bout en bout.

Le sprint actuel couvre la suite logique des stories :

- **US-B4 — Supprimer un fichier** : compléter la gestion du cycle de vie des fichiers, en cohérence avec la liste déjà en place (US-B2).
- **US-C3 — Accéder à un fichier partagé** : rendre effective la promesse de l'US-C1 livrée au sprint précédent — un lien généré doit permettre à un destinataire d'accéder réellement au fichier.
- Les éléments de contrôle d'accès et de qualité associés au partage commencent à être préparés en parallèle, afin d'anticiper les stories des Epics D et E prévues pour la suite.

Le sprint est en bonne voie. L'équipe suit l'avancement au quotidien et ajustera si nécessaire le périmètre du sprint avec le PO en cours de route, sans remettre en cause l'objectif principal : livrer une chaîne de partage simple mais complète (génération du lien → accès au fichier → gestion du fichier).

### Nouveau budget et réorganisation

Le PO a annoncé un **changement de budget** pour la suite du projet. Ce nouveau budget implique une **réorganisation de l'équipe et de la planification**, qu'il faut acter dès maintenant.

Concrètement, cela se traduit par :

- **Une revue du rythme de livraison** : le nombre de sprints restants et leur contenu sont réévalués en fonction des moyens désormais disponibles, ce qui peut conduire à décaler certaines stories non indispensables (labels `stretch`, comme l'Epic F — organisation en dossiers, recherche de fichiers) ou à les maintenir en backlog sans engagement de date.
- **Un recentrage sur le périmètre MVP** : les Epics A à E restent la priorité. Les fonctionnalités de confort sont explicitement laissées de côté tant que le MVP n'est pas stabilisé.
- **Un ajustement de la répartition des responsabilités** au sein de l'équipe, afin de tenir compte de cette nouvelle enveloppe. Les rôles et les points de contact évoluent en conséquence, et le suivi se fera plus étroitement avec le PO sur les stories à forte valeur.
- **Une vigilance accrue sur les dépendances entre stories** : le contrôle d'accès (Epic D) et la qualité (Epic E) dépendent fortement des briques de partage (Epic C). La nouvelle organisation vise à sécuriser cet enchaînement pour éviter les blocages.

Ce changement n'affecte pas les acquis des sprints précédents (Epic A terminé, US-B2 et US-C1 livrées) : il redéfinit la trajectoire pour la suite, pas le point de départ.

### Prochaines étapes

- Poursuivre et clôturer le Sprint 2 conformément au périmètre annoncé (US-B4, US-C3).
- Communiquer à l'équipe le détail de la réorganisation liée au nouveau budget.
- Reprioriser avec le PO, si nécessaire, les stories des Epics D, E et F à la lumière des moyens disponibles.
- Préparer la revue de fin de Sprint 2 et la démo correspondante.
