# Diagramme de séquence — US-C2 : partager un fichier avec un autre utilisateur du service

> **US-C2** : En tant qu'utilisateur, je peux partager un fichier directement avec un autre utilisateur du service.

Le propriétaire désigne le destinataire par son email. Le partage est enregistré dans la table `FileShare` (couple `fileId` / `recipientId` unique) : aucun lien public n'est créé. Le destinataire retrouve le fichier dans la section « Fichiers partagés avec moi » de l'accueil (US-C3, accès via le compte).

---

## 1. Partage par le propriétaire

```mermaid
sequenceDiagram
    autonumber
    actor U as Propriétaire
    participant UI as ShareModal<br/>(Client Web)
    participant R as POST /api/files/:id/shares<br/>(route.ts)
    participant CU as getCurrentUser()
    participant DB as PostgreSQL<br/>(Prisma)

    U->>UI: Clic sur « Partager », saisit l'email du destinataire
    UI->>R: POST /api/files/:id/shares { email } (cookie session)
    R->>CU: getCurrentUser()
    CU-->>R: user ou null

    alt non authentifié
        R-->>UI: 401 « Authentification requise »
    else email invalide ou égal à celui du propriétaire
        R-->>UI: 400
    else authentifié
        R->>DB: Recherche File par id et ownerId
        DB-->>R: file ou null
        alt fichier introuvable ou non possédé
            R-->>UI: 404 « Fichier introuvable »
        else propriétaire légitime
            R->>DB: Recherche User par email (normalisé en minuscules)
            DB-->>R: recipient ou null
            alt aucun utilisateur avec cet email
                R-->>UI: 404 « Aucun utilisateur du service ne correspond à cet email »
            else destinataire trouvé
                R->>DB: INSERT FileShare (fileId, recipientId)
                alt déjà partagé (contrainte d'unicité, P2002)
                    DB-->>R: erreur d'unicité
                    R-->>UI: 409 « Déjà partagé avec cet utilisateur »
                else nouveau partage
                    DB-->>R: FileShare + email du destinataire
                    R-->>UI: 201 { id, createdAt, recipient }
                    UI-->>U: Ajoute le destinataire à la liste (bouton « Retirer »)
                end
            end
        end
    end
```

Le retrait d'un destinataire suit le même schéma avec `DELETE /api/files/:id/shares/:recipientId` : la suppression est filtrée sur `file.ownerId = user.id`, donc seul le propriétaire peut retirer un partage (`404` sinon).

---

## 2. Accès par le destinataire

```mermaid
sequenceDiagram
    autonumber
    actor D as Destinataire (connecté)
    participant UI as SharedFileList<br/>(accueil)
    participant S as GET /api/shared
    participant DL as GET /api/files/:id/download
    participant DB as PostgreSQL<br/>(Prisma)
    participant FS as Disque serveur<br/>(uploads)

    D->>UI: Ouvre l'accueil
    UI->>S: GET /api/shared (cookie session)
    S->>DB: FileShare où recipientId = user.id (+ File, email du propriétaire)
    DB-->>S: partages
    S-->>UI: 200 [{ id, name, size, ownerEmail, sharedAt }]
    UI-->>D: Section « Fichiers partagés avec moi »

    D->>UI: Clic sur « Télécharger »
    UI->>DL: GET /api/files/:id/download
    DL->>DB: File où id = :id ET (ownerId = user.id OU partagé avec user.id)
    alt ni propriétaire ni destinataire
        DB-->>DL: null
        DL-->>UI: 404 « Fichier introuvable »
    else accès autorisé
        DB-->>DL: file
        DL->>FS: fs.createReadStream(resolveStoragePath(storagePath))
        FS-->>DL: flux binaire
        DL-->>UI: 200 Stream (Content-Disposition: attachment)
    end
```

---

## Principes de sécurité

- **Partage ciblé** : contrairement au lien public (US-C1), seul le destinataire connecté peut télécharger le fichier ; une copie de l'URL de téléchargement ne suffit pas.
- **Contrôle d'accès en une requête** : le téléchargement vérifie en base que l'utilisateur est propriétaire ou destinataire ; un tiers obtient `404`, sans distinguer « fichier inexistant » et « accès refusé ».
- **Révocation immédiate** : retirer un destinataire supprime la ligne `FileShare`, ce qui coupe l'accès dès la requête suivante.
- **Suppressions en cascade** : supprimer le fichier ou le compte du destinataire supprime les partages associés (`onDelete: Cascade`).
- **Énumération des comptes** : la réponse `404` sur un email inconnu révèle si un compte existe. C'est accepté pour un service interne à l'université, où le propriétaire doit savoir si son destinataire est inscrit.

Code concerné :
- Modèle : [`prisma/schema.prisma`](../../prisma/schema.prisma) (modèle `FileShare`), migration `20261106162413_add_file_share`
- API propriétaire : [`src/app/api/files/[id]/shares/route.ts`](../../src/app/api/files/[id]/shares/route.ts), [`src/app/api/files/[id]/shares/[recipientId]/route.ts`](../../src/app/api/files/[id]/shares/[recipientId]/route.ts)
- API destinataire : [`src/app/api/shared/route.ts`](../../src/app/api/shared/route.ts), [`src/app/api/files/[id]/download/route.ts`](../../src/app/api/files/[id]/download/route.ts)
- Frontend : [`src/app/share-modal.tsx`](../../src/app/share-modal.tsx), [`src/app/file-list.tsx`](../../src/app/file-list.tsx), [`src/app/shared-file-list.tsx`](../../src/app/shared-file-list.tsx)
