# Diagramme de séquence — US-A1 : créer un compte

> En tant qu'utilisateur, je peux créer un compte pour accéder au service.

L'utilisateur fournit son adresse email et son mot de passe. Après validation du format, unicité de l'email et hachage cryptographique du mot de passe (via `scrypt`), l'utilisateur est persisté dans la base PostgreSQL via Prisma, sans jamais exposer le mot de passe en clair.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant F as RegisterForm<br/>(/register)
    participant R as POST /api/auth/register<br/>(route.ts)
    participant P as password.ts<br/>(validation & crypto)
    participant DB as PostgreSQL<br/>(Prisma)

    U->>F: Saisie email, mot de passe, confirmation
    U->>F: Clic « Créer mon compte »
    F->>F: Validation front-end (longueur, correspondance)

    alt validation front échouée
        F-->>U: Message d'erreur local (sans requête réseau)
    else formulaire valide
        F->>F: Statut « Création du compte… »
        F->>R: POST /api/auth/register (JSON)

        R->>P: validateEmail(email), validatePassword(password)
        alt champs invalides ou manquants
            R-->>F: 400 « Format invalide » / « Mot de passe trop court »
        else champs valides
            R->>DB: prisma.user.findUnique({ where: { email } })
            DB-->>R: utilisateur existant ou null

            alt email déjà utilisé
                R-->>F: 409 « Un compte existe déjà avec cette adresse email »
            else email disponible
                R->>P: hashPassword(password)
                P->>P: Génération salt aléatoire + scrypt derivation
                P-->>R: passwordHash (salt:derivedKey)

                R->>DB: prisma.user.create({ data: { email, passwordHash } })
                alt création réussie
                    DB-->>R: { id, email, createdAt }
                    R-->>F: 201 + JSON ({ message, user: { id, email, createdAt } })
                    F-->>U: Message de confirmation « Compte créé avec succès ! »
                else échec en base
                    DB-->>R: erreur BDD
                    R-->>F: 500 « Une erreur est survenue lors de la création du compte »
                    F-->>U: Message d'erreur
                end
            end
        end
    end
```

## Lecture du diagramme

- **Validations à deux niveaux** :
  - **Côté client (`RegisterForm`)** : vérification immédiate que les mots de passe correspondent et font au moins 8 caractères avant d'envoyer la requête réseau.
  - **Côté serveur (`route.ts` & `password.ts`)** : validation stricte du format email (RFC) et des longueurs pour se prémunir des requêtes directes via API/curl.
- **Sécurité et hachage** :
  - Le mot de passe en clair n'est jamais stocké.
  - La fonction de hachage utilise `crypto.scrypt` (module natif `node:crypto`) avec un sel aléatoire de 16 octets, conforme aux recommandations OWASP.
  - Le hash renvoyé en base n'est jamais retourné dans le corps de réponse JSON (`select: { id: true, email: true, createdAt: true }`).
- **Gestion des doublons (statut 409 Conflict)** :
  - Si l'email est déjà enregistré, une réponse `409` claire est retournée sans compromettre l'intégrité de la table `User` (contrainte unique).

Code concerné : [`src/app/register/page.tsx`](../../src/app/register/page.tsx), [`src/app/register/register-form.tsx`](../../src/app/register/register-form.tsx), [`src/app/api/auth/register/route.ts`](../../src/app/api/auth/register/route.ts), [`src/lib/password.ts`](../../src/lib/password.ts), [`prisma/schema.prisma`](../../prisma/schema.prisma).
