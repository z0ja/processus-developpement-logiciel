# Diagramme de séquence — US-D1 : expiration d'un lien de partage

> **US-D1** : En tant qu'utilisateur, je peux définir une date d'expiration sur un lien de partage.

---

## 1. Définition ou mise à jour de la date d'expiration (Propriétaire)

Le propriétaire d'un fichier peut configurer ou modifier la date d'expiration d'un lien à tout moment via la modale de partage (durées pré-définies ou date personnalisée).

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur (Propriétaire)
    participant UI as ShareModal<br/>(Client Web)
    participant R as PATCH /api/files/:id/share<br/>(route.ts)
    participant CU as getCurrentUser()
    participant DB as PostgreSQL<br/>(Prisma)

    U->>UI: Sélection d'une durée (+1h, +24h, +7j...) ou date personnalisée
    UI->>R: PATCH /api/files/:id/share { expiresAt: ISO_DATE }
    R->>CU: getCurrentUser()
    CU-->>R: user ou null

    alt non authentifié
        R-->>UI: 401 « Authentification requise »
    else authentifié
        R->>DB: Recherche File par id et ownerId
        DB-->>R: file ou null
        alt fichier introuvable ou non propriétaire
            R-->>UI: 404 « Fichier introuvable »
        else propriétaire légitime
            R->>R: Validation parseExpiration(expiresAt)
            alt date dans le passé ou format invalide
                R-->>UI: 400 « La date d'expiration doit être dans le futur »
            else date future valide
                R->>DB: UPDATE ShareLink SET expiresAt = date
                DB-->>R: ShareLink mis à jour
                R-->>UI: 200 { token, shareUrl, expiresAt }
                UI-->>U: Feedback visuel « Date d'expiration définie au ... »
            end
        end
    end
```

---

## 2. Consultation et téléchargement avec vérification temporelle (Destinataire)

Lorsqu'un visiteur accède à un lien de partage, le serveur vérifie si une date d'expiration est définie et si elle est dépassée. Le rejet intervient avant toute autre vérification (notamment avant le mot de passe).

```mermaid
sequenceDiagram
    autonumber
    actor D as Destinataire (Visiteur)
    participant N as Navigateur
    participant P as Page /share/:token<br/>(page.tsx)
    participant API as GET /api/share/:token/download<br/>(route.ts)
    participant DB as PostgreSQL<br/>(Prisma)
    participant FS as Disque serveur<br/>(uploads)

    D->>N: Ouvre /share/:token
    N->>P: Requête GET /share/:token
    P->>DB: Recherche ShareLink par token
    DB-->>P: shareLink + file

    alt lien expiré (shareLink.expiresAt < now())
        P-->>N: 410 Affichage vue « Lien expiré »
        N-->>D: Message « La date limite de validité est dépassée »
    else lien actif (valide ou sans expiration)
        P-->>N: 200 Affichage page publique (nom, taille, mention « Valide jusqu'au... »)
        N-->>D: Présentation des détails et bouton « Télécharger »
        
        D->>N: Clic « Télécharger le fichier »
        N->>API: GET /api/share/:token/download
        API->>DB: Recherche ShareLink
        DB-->>API: shareLink + file
        alt lien expiré
            API-->>N: 410 « Ce lien de partage a expiré »
        else lien encore valide
            API->>FS: fs.createReadStream(storagePath)
            FS-->>API: Flux binaire du fichier
            API-->>N: 200 Téléchargement (Content-Disposition: attachment)
            N-->>D: Fichier sauvegardé sur le poste
        end
    end
```

---

## Principes de conception et sécurité

- **Validation temporelle stricte** : Le serveur refuse toute date d'expiration antérieure ou égale au moment présent (`Date.now()`).
- **Priorité de sécurité** : La vérification d'expiration est effectuée en première ligne, avant le contrôle du mot de passe (US-D2). Un lien expiré ne permet aucun téléchargement ni tentative d'authentification.
- **Réactivation sans rupture** : Un lien expiré conserve son token UUID ; le propriétaire peut simplement mettre à jour la date d'expiration dans la modale pour le réactiver instantanément sans générer une nouvelle URL.
- **Transparence pour le destinataire** : Si une date de fin de validité est configurée, elle est clairement signalée sur la page de téléchargement afin que l'utilisateur sache jusqu'à quand le document reste accessible.

Code concerné :
- API de modification : [`src/app/api/files/[id]/share/route.ts`](../../src/app/api/files/[id]/share/route.ts)
- API de consultation & téléchargement : [`src/app/api/share/[token]/route.ts`](../../src/app/api/share/[token]/route.ts), [`src/app/api/share/[token]/download/route.ts`](../../src/app/api/share/[token]/download/route.ts)
- Frontend : [`src/app/share-modal.tsx`](../../src/app/share-modal.tsx), [`src/app/file-list.tsx`](../../src/app/file-list.tsx), [`src/app/share/[token]/page.tsx`](../../src/app/share/[token]/page.tsx)
