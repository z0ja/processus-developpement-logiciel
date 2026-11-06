# Compte-rendu — Réunion de sprint

- **Date :** _(à compléter)_
- **Présents :** _(équipe + PO)_
- **Scrum Master :** _(toi)_

> Ce document sert de compte-rendu de la réunion de sprint : bilan du sprint précédent, point d'avancement sur le sprint en cours, et annonce du nouveau budget et de la réorganisation associée.

## Bilan du sprint précédent

Le sprint précédent est **terminé**. L'équipe a rempli l'ensemble des engagements pris lors de la réunion d'ouverture, avec l'aboutissement complet de l'**Epic A — Comptes utilisateurs**. Cela signifie que l'inscription, la connexion et la déconnexion sont fonctionnelles de bout en bout, et que le socle d'authentification est désormais stable et utilisable comme base pour les fonctionnalités suivantes.

Deux user stories supplémentaires ont également été livrées et validées :

- **US-B2 — Voir la liste de mes fichiers** : l'utilisateur peut consulter la liste des fichiers qui lui sont associés. C'est une brique importante puisqu'elle rend le service réellement utilisable au quotidien, au-delà du simple upload.
- **US-C1 — Générer un lien de partage** : l'utilisateur peut désormais créer un lien de partage pour un de ses fichiers. C'est la première fonctionnalité de l'Epic C à voir le jour, et elle ouvre la voie aux stories suivantes du partage (accès au fichier partagé, partage direct entre utilisateurs).

L'équipe considère donc ce sprint comme un succès : l'Epic A est clos, et le socle « gestion de fichiers » avance conformément au backlog. Les points techniques notables à retenir sont la mise en place de la persistance côté serveur pour les fichiers et la génération d'identifiants uniques pour les liens de partage. Le PO a confirmé que la démo correspondait bien à ses attentes.

## Sprint en cours (Sprint 2)

Le **Sprint 2 est en cours**. Il s'appuie sur les acquis du sprint précédent et poursuit la construction du service autour de deux axes : finaliser la gestion des fichiers côté utilisateur, et faire vivre le partage de bout en bout.

Le sprint actuel couvre la suite logique des stories :

- **US-B4 — Supprimer un fichier** : compléter la gestion du cycle de vie des fichiers, en cohérence avec la liste déjà en place (US-B2).
- **US-C3 — Accéder à un fichier partagé** : rendre effective la promesse de l'US-C1 livrée au sprint précédent — un lien généré doit permettre à un destinataire d'accéder réellement au fichier.
- Les éléments de contrôle d'accès et de qualité associés au partage commencent à être préparés en parallèle, afin d'anticiper les stories des Epics D et E prévues pour la suite.

Le sprint est en bonne voie. L'équipe suit l'avancement au quotidien et ajustera si nécessaire le périmètre du sprint avec le PO en cours de route, sans remettre en cause l'objectif principal : livrer une chaîne de partage simple mais complète (génération du lien → accès au fichier → gestion du fichier).

## Nouveau budget et réorganisation

Le PO a annoncé un **changement de budget** pour la suite du projet. Ce nouveau budget implique une **réorganisation de l'équipe et de la planification**, qu'il faut acter dès maintenant.

Concrètement, cela se traduit par :

- **Une revue du rythme de livraison** : le nombre de sprints restants et leur contenu sont réévalués en fonction des moyens désormais disponibles, ce qui peut conduire à décaler certaines stories non indispensables (labels `stretch`, comme l'Epic F — organisation en dossiers, recherche de fichiers) ou à les maintenir en backlog sans engagement de date.
- **Un recentrage sur le périmètre MVP** : les Epics A à E restent la priorité. Les fonctionnalités de confort sont explicitement laissées de côté tant que le MVP n'est pas stabilisé.
- **Un ajustement de la répartition des responsabilités** au sein de l'équipe, afin de tenir compte de cette nouvelle enveloppe. Les rôles et les points de contact évoluent en conséquence, et le suivi se fera plus étroitement avec le PO sur les stories à forte valeur.
- **Une vigilance accrue sur les dépendances entre stories** : le contrôle d'accès (Epic D) et la qualité (Epic E) dépendent fortement des briques de partage (Epic C). La nouvelle organisation vise à sécuriser cet enchaînement pour éviter les blocages.

Ce changement n'affecte pas les acquis des sprints précédents (Epic A terminé, US-B2 et US-C1 livrées) : il redéfinit la trajectoire pour la suite, pas le point de départ.

## Prochaines étapes

- Poursuivre et clôturer le Sprint 2 conformément au périmètre annoncé (US-B4, US-C3).
- Communiquer à l'équipe le détail de la réorganisation liée au nouveau budget.
- Reprioriser avec le PO, si nécessaire, les stories des Epics D, E et F à la lumière des moyens disponibles.
- Préparer la revue de fin de Sprint 2 et la démo correspondante.
