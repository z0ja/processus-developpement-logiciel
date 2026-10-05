# Planification du projet — Service de partage de fichiers

**Cours :** Processus du développement logiciel — TP 2026-2027
**Sujet retenu :** 3. Service de partage de fichiers
**Framework :** Scrum
**Équipe :** 4 personnes — **Product Owner : l'enseignant**
**Calendrier :** 5 séances de TP = **4 sprints** + **1 séance d'évaluation finale**

> Ce document est à ajuster en équipe. Tout ce qui touche au contenu fonctionnel (backlog, priorités) doit être validé/amendé par le PO (l'enseignant) lors des réunions de sprint — il peut changer d'avis ou ajouter des contraintes, c'est prévu par le processus.

---

## 1. Cadrage

- Projet à développer **de A à Z** (pas de wrapper autour d'un outil existant).
- On représente des membres de la DOSI de l'université et l'application sera déployée sur [le serveur pedago de l'université](https://pedago.univ-avignon.fr/)

---

## 2. Adaptation du processus Scrum aux 5 séances

Chaque séance = un point de rencontre avec le PO. Comme il y a 4 sprints pour 5 séances, la dernière séance est dédiée à la démo finale + rétrospective globale plutôt qu'à une nouvelle planification.

| Séance | Sprint | Contenu de la réunion avec le PO | Focus du sprint |
|---|---|---|---|
| 1 | Sprint 1 (lancement) | Recueil du besoin initial, présentation du backlog proposé, validation du périmètre | Cadrage technique + socle fonctionnel minimal (walking skeleton) |
| 2 | Sprint 2 | Revue/démo Sprint 1 + rétro équipe + planning Sprint 2 | Gestion des fichiers (liste, suppression) + partage simple |
| 3 | Sprint 3 | Revue/démo Sprint 2 + rétro équipe + planning Sprint 3 | Contrôle d'accès sur le partage (expiration, permissions) |
| 4 | Sprint 4 | Revue/démo Sprint 3 + rétro équipe + planning Sprint 4 | Robustesse, sécurité, quotas, finitions |
| 5 | — (clôture) | **Démo finale** (résultat Sprint 4) + **rétrospective globale** + perspectives | Corrections mineures uniquement, préparation de la présentation |

### Cérémonies à tenir à chaque sprint
- **Sprint Review** (avec le PO, en séance) : démo de l'incrément, recueil de feedback.
- **Sprint Retrospective** (équipe seule, courte, juste après la review) : ce qui a marché / pas marché / actions d'amélioration.
- **Sprint Planning** (avec ou juste après le PO, en séance) : sélection des éléments du backlog, définition du sprint goal, estimation.
- **Daily / point d'avancement** : vu le rythme hebdomadaire, un point async court (chat) 1-2 fois entre les séances suffit à la place d'un vrai daily.

---

## 3. Rôles de l'équipe

Scrum ne prévoit pas de rôles techniques figés, mais avec 4 personnes il est utile de clarifier :

| Rôle | Responsabilité | Portage |
|---|---|---|
| Product Owner | Apporte le besoin, priorise, valide les incréments | L'enseignant (externe à l'équipe) |
| Scrum Master | Anime les cérémonies, garde le focus sur le process, lève les blocages | Sprint 1 : désigné (voir CR de sprint 1). Rotatif ensuite entre les 4 membres (permet à chacun de vivre le rôle, valorisable en rétrospective/présentation finale) |
| Dev Team | Conception, développement, tests | Les 4 membres, collectivement responsables ; on peut définir des zones de confort (backend, frontend, tests/qualité, doc/sécurité) sans figer des silos |

---

## 4. Outillage

Décidé en équipe pour le Sprint 1 :

- **Dépôt de code** : GitHub — [z0ja/processus-developpement-logiciel](https://github.com/z0ja/processus-developpement-logiciel.git).
- **Backlog / suivi** : Jira (backlog créé — export CSV/JSON à prévoir pour le rendu si l'enseignant n'a pas d'accès direct).
- **Documentation** : dossier `docs/` versionné dans le repo (ADR dans `docs/decisions/`, CR dans `docs/comptes-rendus/`).
- **Communication d'équipe** : Discord — sert aussi de trace pour les CR informels.
- **CR de réunions** : un fichier par séance (`docs/comptes-rendus/sprint-N.md`), rempli pendant/juste après chaque réunion PO.

---

## 5. Choix technique

**Décision (validée par l'équipe) : Next.js (frontend + API routes) + PostgreSQL via Prisma.** Un seul langage/runtime (TypeScript de bout en bout), ORM type-safe avec migrations, déploiement unique — ce choix minimise la plomberie d'intégration pour se concentrer sur les fonctionnalités et le process Scrum.

Documenter ce choix (et sa justification) dans `docs/decisions/adr-001-stack-technique.md` (format ADR — Architecture Decision Record).

---

## 6. Backlog produit initial (proposition à valider avec le PO)

Ce backlog est une **base de discussion** pour la première réunion — le PO peut le faire évoluer, le prioriser autrement ou ajouter des contraintes.

### Epic A — Comptes utilisateurs
- US-A1 : En tant qu'utilisateur, je peux créer un compte pour accéder au service.
- US-A2 : En tant qu'utilisateur, je peux me connecter/déconnecter.

### Epic B — Gestion des fichiers
- US-B1 : En tant qu'utilisateur, je peux uploader un fichier.
- US-B2 : En tant qu'utilisateur, je peux voir la liste de mes fichiers.
- US-B3 : En tant qu'utilisateur, je peux télécharger un de mes fichiers.
- US-B4 : En tant qu'utilisateur, je peux supprimer un de mes fichiers.

### Epic C — Partage
- US-C1 : En tant qu'utilisateur, je peux générer un lien de partage pour un fichier.
- US-C2 : En tant qu'utilisateur, je peux partager un fichier directement avec un autre utilisateur du service.
- US-C3 : En tant que destinataire, je peux accéder à un fichier partagé via le lien ou via mon compte.

### Epic D — Contrôle d'accès et sécurité
- US-D1 : En tant qu'utilisateur, je peux définir une date d'expiration sur un lien de partage.
- US-D2 : En tant qu'utilisateur, je peux protéger un lien de partage par mot de passe.
- US-D3 : En tant qu'utilisateur, je peux limiter le nombre de téléchargements autorisés sur un lien.

### Epic E — Non-fonctionnel / qualité
- US-E1 : Mise en place de tests automatisés sur les fonctionnalités critiques (upload, download, contrôle d'accès).
- US-E2 : Validation des fichiers uploadés (taille max, types autorisés) pour éviter les abus.
- US-E3 : Quota de stockage par utilisateur.

### Epic F — Confort (stretch goals, si le temps le permet)
- US-F1 : Organisation en dossiers.
- US-F2 : Recherche de fichiers par nom.

---

## 7. Répartition indicative par sprint

| Sprint | User stories visées | Objectif de sprint (sprint goal) |
|---|---|---|
| Sprint 1 | Setup projet + ADR stack + US-A1, US-A2, US-B1, US-B3 | Un utilisateur peut créer un compte, se connecter, uploader et télécharger un fichier (bout en bout, même minimal) |
| Sprint 2 | US-B2, US-B4, US-C1, US-C3 | Un utilisateur gère ses fichiers et peut les partager via un lien simple |
| Sprint 3 | US-C2, US-D1, US-D2 | Le partage devient contrôlé : expiration, mot de passe, partage ciblé |
| Sprint 4 | US-D3, US-E1, US-E2, US-E3 + corrections | Durcissement du service (quotas, validation, tests) + préparation démo finale |

*À ajuster selon la vélocité réelle observée après le Sprint 1 — ne pas hésiter à redescendre le scope plutôt que sacrifier la qualité du process.*

---

## 8. Definition of Ready / Definition of Done

**Definition of Ready** (une US peut entrer dans un sprint si) :
- Rédigée sous forme "En tant que ... je veux ... afin de ..." avec critères d'acceptation.
- Estimée par l'équipe (voir §9).
- Dépendances techniques identifiées (pas de bloquant connu).

**Definition of Done** (une US est terminée si) :
- Code fonctionnel, revu par au moins un autre membre de l'équipe (pull request).
- Testée (au moins manuellement, idéalement test automatisé pour les cas critiques).
- Documentée si elle introduit un comportement visible (README / doc API).
- Démontrable au PO sans intervention manuelle en base de données.

---

## 9. Estimation et suivi

- Utiliser des **points d'histoire** (ex. suite de Fibonacci 1-2-3-5-8) estimés collectivement (Planning Poker informel) lors de chaque Sprint Planning.
- Consigner : estimation initiale, réalisé, écart — dans le backlog (colonne dédiée).
- Après le Sprint 1, calculer la **vélocité** (somme des points terminés) pour calibrer le scope des sprints suivants.
- Un exemple de tableau à tenir dans l'outil de backlog :

| US | Estimation (pts) | Sprint | Statut | Réalisé (pts) |
|---|---|---|---|---|
| US-A1 | 3 | 1 | ... | ... |
| US-B1 | 5 | 1 | ... | ... |

---

## 10. Livrables attendus par séance

- **Après chaque sprint (séances 1 à 4)** :
  - Incrément fonctionnel démontré au PO.
  - CR de la réunion (décisions du PO, nouvelles demandes/contraintes).
  - Backlog à jour (statuts, nouvelles US, réestimations).
  - Notes de rétrospective (actions d'amélioration retenues).
- **Séance finale (5)** :
  - Démo complète du produit.
  - Support de présentation + rétrospective globale du projet (difficultés, leçons apprises, perspectives).
  - Rendu complet : code, modélisations (diagrammes de cas d'usage/séquence/architecture selon pertinence), documentation, rapports de tests, historique complet du backlog et des CR.

---

## 11. Préparation de la réunion d'ouverture (Séance 1)

Support complet (déroulé minuté, questions au PO, CR à remplir en direct) : [docs/comptes-rendus/sprint-1.md](docs/comptes-rendus/sprint-1.md).

**Objectifs de la réunion** : présenter l'équipe/outils, recueillir le vrai besoin du PO, valider/ajuster le backlog proposé, définir le Sprint 1 Goal.

**Questions clés à poser au PO** (formulées simplement, le PO n'est pas forcément technique) :
1. Qui sont les utilisateurs typiques du service ?
2. Quel est le tout premier scénario qu'il veut voir fonctionner à la fin du Sprint 1 ?
3. Partage par lien public, entre utilisateurs inscrits, ou les deux ?
4. Contraintes de confidentialité/sécurité particulières ?
5. Contraintes de volumétrie (taille de fichier, nombre d'utilisateurs) ?
6. Parmi les fonctionnalités du backlog, lesquelles sont indispensables vs confort ?
7. Ce qu'il attend d'une bonne démo de sprint.

**En sortie de réunion** : backlog validé/priorisé, Sprint 1 Goal défini, user stories engagées et estimées, CR rédigé dans `docs/comptes-rendus/sprint-1.md`.

---

## 12. Prochaines actions immédiates (avant/pendant Sprint 1)

1. Constituer l'équipe et désigner le premier Scrum Master (rotatif ensuite).
2. Choisir les outils (repo, backlog, doc) et donner accès à l'enseignant.
3. Préparer une version courte de ce backlog à présenter au PO en ouverture de la séance 1 pour cadrer ses attentes réelles.
4. Trancher le choix technique (ADR) dès que le périmètre du Sprint 1 est confirmé par le PO.
5. Découper US-A1/A2/B1/B3 en tâches techniques pour le Sprint 1.
