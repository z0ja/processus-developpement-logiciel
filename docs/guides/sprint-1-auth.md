# Guide de validation — Sprint 1 : Création de compte (US-A1)

Ce document récapitule la mise en place de la création de compte (**US-A1**) en local avec **Next.js** et **Prisma** (PostgreSQL).

---

## 1. Démarrage de la base de données locale (PostgreSQL)

Le projet utilise le conteneur PostgreSQL défini dans [docker-compose.yml](file:///c:/Users/guerr/Downloads/processus-developpement-logiciel/docker-compose.yml).

Dans votre terminal :
```bash
# 1. Démarrer le conteneur PostgreSQL
docker compose up -d

# 2. Appliquer les migrations Prisma sur la base locale
npx prisma migrate dev

# (Optionnel) Pour inspecter les utilisateurs créés dans l'interface graphique :
npx prisma studio
```

---

## 2. Démarrage de l'application Next.js

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 3. Scénarios de test pour la démo Scrum (US-A1)

### Scénario A : Inscription valide
1. Accédez à la page d'inscription : [http://localhost:3000/register](http://localhost:3000/register) (accessible aussi depuis le bouton sur la page d'accueil).
2. Saisissez une adresse email (ex. `etudiant@univ.fr`) et un mot de passe (au moins 6 caractères).
3. Cliquez sur **Créer le compte** :
   - Le mot de passe est haché de manière sécurisée (`scrypt` + sel aléatoire).
   - L'utilisateur est enregistré en base PostgreSQL via Prisma.
   - Un message de confirmation de création s'affiche.

### Scénario B : Validation des données
- **Format d'email invalide :** la soumission échoue avec un message d'erreur.
- **Mot de passe < 6 caractères :** la soumission est bloquée avec message explicite.
- **Mots de passe non identiques :** le formulaire avertit que les mots de passe diffèrent.

### Scénario C : Unicité de l'email
- Si vous tentez de créer un compte avec une adresse email déjà enregistrée en base, l'API renvoie `409 Conflict` et le formulaire affiche : *« Un compte existe déjà avec cette adresse email. »*.

---

## 4. Fichiers impliqués

- [.env](file:///c:/Users/guerr/Downloads/processus-developpement-logiciel/.env) : Configuration locale de PostgreSQL (`DATABASE_URL`).
- [src/lib/auth.ts](file:///c:/Users/guerr/Downloads/processus-developpement-logiciel/src/lib/auth.ts) : Fonction de hachage de mot de passe `hashPassword` (`scrypt`).
- [src/app/api/auth/register/route.ts](file:///c:/Users/guerr/Downloads/processus-developpement-logiciel/src/app/api/auth/register/route.ts) : Route API d'enregistrement des comptes.
- [src/app/register/page.tsx](file:///c:/Users/guerr/Downloads/processus-developpement-logiciel/src/app/register/page.tsx) : Page et formulaire d'inscription.
- [src/app/page.tsx](file:///c:/Users/guerr/Downloads/processus-developpement-logiciel/src/app/page.tsx) : Page d'accueil avec lien d'accès à la création de compte.
