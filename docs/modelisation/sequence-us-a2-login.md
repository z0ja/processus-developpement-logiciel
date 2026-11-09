# Diagramme de séquence — US-A2 : se connecter / se déconnecter

> En tant qu'utilisateur, je peux me connecter et me déconnecter.

À la connexion, le serveur vérifie le mot de passe (`scrypt`, cf. US-A1), crée une session en base et pose un cookie `session` (`HttpOnly`). Le cookie contient un jeton aléatoire ; la base n'en conserve que l'empreinte SHA-256. Les routes protégées (ex. upload, US-B1) retrouvent l'utilisateur à partir de ce cookie via `getCurrentUser()`.

## Connexion

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant F as LoginForm<br/>(/login)
    participant R as POST /api/auth/login<br/>(route.ts)
    participant P as password.ts
    participant S as session.ts
    participant DB as PostgreSQL<br/>(Prisma)

    U->>F: Saisie email + mot de passe, clic « Se connecter »
    F->>R: POST /api/auth/login (JSON)

    alt corps non JSON ou champs manquants
        R-->>F: 400 « Email et mot de passe requis »
    else champs présents
        R->>DB: User par email (normalisé en minuscules)
        DB-->>R: utilisateur ou null
        R->>P: verifyPassword(password, hash ou hash factice)
        P-->>R: true / false

        alt email inconnu ou mot de passe faux
            R-->>F: 401 « Email ou mot de passe incorrect »
            F-->>U: Message d'erreur
        else identifiants valides
            R->>S: createSession(user.id)
            S->>S: jeton = 32 octets aléatoires
            S->>DB: INSERT Session (SHA-256 du jeton, userId, expiresAt = +7 j)
            S-->>R: cookie « session » (HttpOnly, SameSite=Lax)
            R-->>F: 200 + utilisateur + Set-Cookie
            F-->>U: Redirection vers l'accueil (connecté)
        end
    end
```

## Requête authentifiée et déconnexion

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant N as Navigateur
    participant R as Route protégée<br/>(ex. POST /api/files)
    participant S as session.ts<br/>(via getCurrentUser)
    participant O as POST /api/auth/logout
    participant DB as PostgreSQL<br/>(Prisma)

    U->>N: Action nécessitant d'être connecté
    N->>R: Requête + cookie « session »
    R->>S: getCurrentUser()
    S->>DB: Session par SHA-256 du jeton
    DB-->>S: session + utilisateur, ou rien
    alt session absente ou expirée
        S-->>R: null
        R-->>N: 401 « Authentification requise »
    else session valide
        S-->>R: utilisateur
        R-->>N: Réponse normale
    end

    U->>N: Clic « Se déconnecter »
    N->>O: POST /api/auth/logout + cookie
    O->>S: destroySession()
    S->>DB: DELETE Session
    S-->>O: suppression du cookie
    O-->>N: 200
    N-->>U: Accueil (déconnecté)
```

## Lecture des diagrammes

- **Message d'erreur unique (401)** : la réponse est identique que l'email soit inconnu ou le mot de passe faux, et un hachage factice est vérifié quand l'email est inconnu, pour ne pas révéler quels comptes existent (ni par le message, ni par le temps de réponse).
- **Jeton haché en base** : une fuite de la table `Session` ne permet pas d'usurper une session, puisque le jeton en clair n'existe que dans le cookie.
- **Cookie `HttpOnly`** : inaccessible au JavaScript de la page, ce qui limite le vol de session par XSS ; `SameSite=Lax` limite les requêtes inter-sites (CSRF) ; `Secure` est activé en production.
- **Déconnexion côté serveur** : la session est supprimée en base, donc un cookie copié avant la déconnexion ne fonctionne plus.
- **Sessions expirées** : refusées à la lecture (`expiresAt`) ; elles ne sont pas encore purgées de la base (amélioration possible).

Code concerné : [`src/app/login/`](../../src/app/login/), [`src/app/logout-button.tsx`](../../src/app/logout-button.tsx), [`src/app/api/auth/login/route.ts`](../../src/app/api/auth/login/route.ts), [`src/app/api/auth/logout/route.ts`](../../src/app/api/auth/logout/route.ts), [`src/lib/session.ts`](../../src/lib/session.ts), [`src/lib/current-user.ts`](../../src/lib/current-user.ts).
