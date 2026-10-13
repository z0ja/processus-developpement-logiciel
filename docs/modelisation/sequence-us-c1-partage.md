# Diagramme de séquence — US-C1 & US-C3 : générer un lien de partage et accéder au fichier partagé

> **US-C1** : En tant qu'utilisateur, je peux générer un lien de partage pour un fichier.  
> **US-C3** : En tant que destinataire, je peux accéder à un fichier partagé via le lien ou via mon compte.

---

## 1. Génération et révocation d'un lien de partage (US-C1)

Seul le propriétaire du fichier peut générer un lien de partage. Le serveur associe un jeton UUID v4 unique au fichier en base de données et renvoie l'URL correspondante (`/share/<token>`).

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur (Propriétaire)
    participant UI as FileList / ShareModal<br/>(Client Web)
    participant R as POST /api/files/:id/share<br/>(route.ts)
    participant CU as getCurrentUser()
    participant DB as PostgreSQL<br/>(Prisma)

    U->>UI: Clic sur « Partager » à côté du fichier
    UI->>R: POST /api/files/:id/share (avec cookie session)
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
            R->>DB: Recherche ShareLink existant pour ce fileId
            DB-->>R: shareLink ou null
            alt lien déjà existant
                R-->>UI: 200 { token, shareUrl }
            else aucun lien actif
                R->>R: token = randomUUID()
                R->>DB: INSERT ShareLink (token, fileId)
                DB-->>R: nouveau ShareLink
                R-->>UI: 200 { token, shareUrl }
            end
            UI-->>U: Affiche la modale avec l'URL + bouton « Copier »
        end
    end
```

---

## 2. Consultation et téléchargement par un tiers (US-C3)

Le destinataire accède au lien public sans avoir besoin d'être authentifié. Le téléchargement réutilise le modèle de flux Node.js (`fs.createReadStream` vers `ReadableStream`) avec les en-têtes HTTP de streaming.

```mermaid
sequenceDiagram
    autonumber
    actor D as Destinataire (Visiteur)
    participant N as Navigateur
    participant P as Page /share/:token<br/>(page.tsx)
    participant API as GET /api/share/:token/download<br/>(route.ts)
    participant DB as PostgreSQL<br/>(Prisma)
    participant FS as Disque serveur<br/>(uploads)

    D->>N: Ouvre l'URL /share/:token
    N->>P: Requête GET /share/:token
    P->>DB: Recherche ShareLink par token (+ jointure File)
    DB-->>P: shareLink + file, ou null

    alt lien introuvable ou expiré
        P-->>N: 404 / 410 « Lien introuvable ou expiré »
        N-->>D: Écran d'erreur avec retour à l'accueil
    else lien valide
        P-->>N: 200 Page de téléchargement (nom, taille, type)
        N-->>D: Affiche les infos du fichier et bouton « Télécharger »
        
        D->>N: Clic sur « Télécharger le fichier »
        N->>API: GET /api/share/:token/download
        API->>DB: Recherche ShareLink + file
        DB-->>API: file (storagePath, mimeType, name, size)
        API->>FS: fs.createReadStream(resolveStoragePath(storagePath))
        FS-->>API: Flux binaire du fichier
        API-->>N: 200 Stream (Content-Disposition: attachment, Content-Length)
        N-->>D: Téléchargement du fichier enregistré sur l'ordinateur
    end
```

---

## Principes de sécurité et d'architecture

- **Jeton UUID cryptographique** : Les liens de partage utilisent des UUID v4 aléatoires. Ils ne peuvent être ni devinés par énumération, ni prédits.
- **Contrôle d'accès strict à la création** : Seul le propriétaire authentifié (`ownerId === user.id`) peut créer ou révoquer un lien de partage.
- **Accès public découplé** : La route `/share/:token` et le téléchargement `/api/share/:token/download` ne nécessitent aucune session, permettant le partage sans friction.
- **Sécurité du stockage** : La fonction `resolveStoragePath` garantit l'imperméabilité du répertoire de stockage face aux attaques par traversée de répertoire (*Path Traversal*).
- **Préparation pour les extensions** : Les champs `expiresAt` et `password` sont prévus dans le schéma pour les évolutions du Sprint 3 (US-D1, US-D2).

Code concerné :
- Modèle : [`prisma/schema.prisma`](../../prisma/schema.prisma)
- API propriétaire : [`src/app/api/files/[id]/share/route.ts`](../../src/app/api/files/[id]/share/route.ts)
- API publique & streaming : [`src/app/api/share/[token]/download/route.ts`](../../src/app/api/share/[token]/download/route.ts)
- Frontend : [`src/app/file-list.tsx`](../../src/app/file-list.tsx), [`src/app/share-modal.tsx`](../../src/app/share-modal.tsx), [`src/app/share/[token]/page.tsx`](../../src/app/share/[token]/page.tsx)

