# Sprint 3 — Compte rendu

- **Scrum Master :** Yanis LAFTIMI
- **Rédaction du compte rendu :** Ayoub ACHOUCKI (SCRUM-37)
- **Sprint Goal** (cf. [PLANIFICATION.md](../../PLANIFICATION.md) §7) : le partage devient contrôlé : expiration, mot de passe, partage ciblé.

## Ouverture du sprint (séance 3 avec le PO)

- **Présents :** Yanis LAFTIMI, Wanis GUERRAM, Evan HONORAT, Ayoub ACHOUCKI (4 membres de l'équipe) + PO
- **Revue du Sprint 2 :** partage par lien livré ; US-B4 (suppression d'un fichier) reportée au Sprint 3. Détail et rétrospective : voir [sprint-2.md](sprint-2.md).
- **Retours du PO :** satisfait du Sprint 2, aucune remarque sur les tâches du Sprint 3, aucune nouvelle demande ni contrainte.
- **Décisions :** Sprint Goal et contenu du Sprint 3 validés tels que présentés.

## Planning prévisionnel

Séance 3 : 14h30 – 17h30 (3h par personne). 3h allouées par tâche ; la tâche reportée du Sprint 2 garde son estimation d'origine.

| Ticket | Tâche | Responsable | Temps alloué |
|---|---|---|---|
| SCRUM-16 | US-B4 — Supprimer un fichier (reportée du Sprint 2) | Evan | 2h |
| SCRUM-19 | US-C2 — Partager un fichier avec un autre utilisateur du service | Yanis | 3h |
| SCRUM-20 | US-D1 — Date d'expiration sur un lien de partage | Ayoub | 3h |
| SCRUM-21 | US-D2 — Protéger un lien de partage par mot de passe | Wanis | 3h |
| SCRUM-22 | US-D3 — Limiter le nombre de téléchargements d'un lien (avancée depuis le Sprint 4) | Evan | 3h |
| SCRUM-37 | Rapport du Sprint 3 | Ayoub | 3h |
| | **Total** | | **17h** |

## Déroulement du sprint

- **Suppression (US-B4) :** codée pendant la séance sur la branche d'Evan, mais pas fusionnée dans `main` avant la fin du sprint.
- **Accès aux fichiers partagés (US-C3) :** Wanis a aligné l'accès et le téléchargement des fichiers partagés sur le code de US-C1.
- **Partage ciblé (US-C2) :** le propriétaire partage un fichier avec un autre utilisateur à partir de son email et peut lui retirer l'accès. Une section « Fichiers partagés avec moi » apparaît sur l'accueil du destinataire.
- **Expiration (US-D1) :** le propriétaire choisit une durée rapide ou une date précise pour son lien, ou le laisse sans limite. Un lien expiré ne permet plus de télécharger le fichier, et la liste des fichiers l'indique.
- **Mot de passe (US-D2) :** un lien peut être protégé par un mot de passe, que le propriétaire peut modifier ou retirer. Le destinataire doit le saisir avant d'accéder au fichier.
- **Fenêtre de partage :** les trois US modifiaient la même fenêtre de partage. Après la fusion, les réglages d'expiration et de mot de passe n'apparaissaient qu'une fois le lien généré ; c'est corrigé, ils créent le lien si besoin.
- **Déploiement :** un script met à jour le serveur pedago après chaque fusion dans `main` (arrêt, récupération du code, migrations, build, redémarrage).
- **Documentation :** diagrammes de séquence pour US-C2 et US-D1 dans [docs/modelisation/](../modelisation/), routes ajoutées dans la section API du README.

## Planning réel

Temps reconstitué à partir de l'heure des commits pendant la séance : le travail sans commit n'y apparaît pas. Les derniers commits datent de 18h55, soit près de 1h30 après la fin de la séance, à cause des problèmes de fusion (voir plus bas).

| Ticket | Tâche | Responsable | Temps réel | Fin de sprint | Report |
|---|---|---|---|---|---|
| SCRUM-16 | US-B4 — Supprimer un fichier | Evan | 2h | Codée, non fusionnée dans `main` | Sprint 4 |
| SCRUM-18 | US-C3 — Accéder à un fichier partagé (retouche) | Wanis | 1h | Terminée | — |
| SCRUM-19 | US-C2 — Partager un fichier avec un autre utilisateur | Yanis | 3h30, puis 45 min de fusions et de correctifs | Terminée | — |
| SCRUM-20 | US-D1 — Date d'expiration sur un lien de partage | Ayoub | 3h30 | Terminée | — |
| SCRUM-21 | US-D2 — Protéger un lien de partage par mot de passe | Wanis | 1h45 | Terminée | — |
| SCRUM-22 | US-D3 — Limiter le nombre de téléchargements | Evan | Aucun commit | Non commencée | Sprint 4 |
| SCRUM-37 | Rapport du Sprint 3 | Ayoub | Rédigé pendant la séance 4 | Terminé | — |
| | **Total visible** | | **12h30** | | |

Evan a aussi passé environ 2h en début de séance sur un compte rendu (annexe du CR du Sprint 2), qui ne correspond à aucune tâche Jira.

## Évolutions du backlog

- **US-D3** (limite de téléchargements) avancée du Sprint 4 au Sprint 3.
- **Nouvelle US-B5 — Ouverture de fichier** (SCRUM-36), confiée à Yanis, prévue au Sprint 4.
- **Nouveaux Epics G — Édition et versionnement des fichiers** et **H — Gestion des droits**, répartis sur les Sprints 4 et 5.
- Un **Sprint 5** est ajouté dans Jira : US-E1 (tests automatisés) et US-F2 (recherche) y sont reportées.
- Sprint 4 prévu à ce stade : US-E2 (Wanis), US-E3 (Evan, déjà commencée), US-F1 (Ayoub), US-G1 et US-B5 (Yanis).

## Points d'attention de l'équipe

- **Liste `/myfiles` :** l'action du Sprint 2 « unifier les deux listes de fichiers » n'est pas faite. La page affiche toujours les fichiers de test du dossier `partage/`, sans connexion requise, et permet maintenant de les supprimer.
- **Relectures :** US-C2 et le script de déploiement sont passés par des pull requests ; les autres branches ont été fusionnées directement dans `main`, sans relecture.
- **Problèmes de fusion :** ce sprint a eu beaucoup de problèmes au moment des fusions, qui ont fait perdre du temps à l'équipe :
  - les US-C2, D1 et D2 touchaient toutes la fenêtre de partage, d'où des conflits à régler à la main et un correctif après coup ;
  - d'autres conflits sont apparus sur la liste des fichiers, la page `/myfiles`, le README et le compte rendu du Sprint 2 ;
  - plusieurs fusions successives de `main` dans les branches ont été nécessaires pendant la même séance avant de pouvoir livrer.
- **Migrations :** après récupération de `main`, chacun doit lancer `npm run db:migrate` (nouvelle table `FileShare` pour US-C2).

## Rétrospective du Sprint 3 (équipe)

_(à compléter à la clôture du sprint)_

Suivi des actions d'amélioration retenues à la fin du Sprint 2 :

- Avancer régulièrement pendant le sprint : non, tout le travail s'est fait pendant la séance 3, qui a débordé de près de 1h30.
- Pull request relue pour chaque US : seulement pour US-C2 et le script de déploiement.
- Se coordonner quand plusieurs US touchent les mêmes fichiers : non fait, d'où les conflits sur la fenêtre de partage.
- Ne passer une US à « Terminé » qu'une fois fusionnée dans `main` : respecté pour US-C2, D1 et D2, mais pas pour US-B4, passée à « Terminé » sans être fusionnée.
