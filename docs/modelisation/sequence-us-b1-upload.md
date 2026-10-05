# Diagramme de séquence — US-B1 : uploader un fichier

> En tant qu'utilisateur, je peux uploader un fichier.

Le contenu du fichier est écrit sur disque (`UPLOAD_DIR`) sous un nom aléatoire ; ses métadonnées (nom d'origine, type, taille, propriétaire) sont enregistrées en base dans la table `File`, reliées au contenu par `storagePath`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant F as UploadForm<br/>(navigateur)
    participant R as POST /api/files<br/>(route.ts)
    participant A as current-user.ts
    participant S as storage.ts
    participant D as Disque<br/>(UPLOAD_DIR)
    participant DB as PostgreSQL<br/>(Prisma)

    U->>F: Choisit un fichier, clique « Uploader »
    F->>F: Statut « Envoi en cours… »
    F->>R: POST /api/files (multipart/form-data, champ « file »)

    R->>A: getCurrentUser()
    A->>DB: upsert User (provisoire, cf. US-A2)
    DB-->>A: utilisateur
    A-->>R: utilisateur ou null

    alt non authentifié
        R-->>F: 401 « Authentification requise »
    else corps non multipart
        R-->>F: 400 « Requête multipart/form-data attendue »
    else champ « file » absent ou fichier vide
        R-->>F: 400 « Aucun fichier fourni » / « Le fichier est vide »
    else fichier valide
        R->>S: saveFile(file)
        S->>S: storagePath = randomUUID()
        S->>D: écriture en streaming (pipeline)
        D-->>S: OK
        S-->>R: storagePath

        R->>DB: INSERT File (name, mimeType, size, storagePath, ownerId)
        alt enregistrement réussi
            DB-->>R: métadonnées du fichier
            R-->>F: 201 + JSON (id, name, mimeType, size, createdAt)
        else échec en base
            DB-->>R: erreur
            R->>S: deleteStoredFile(storagePath)
            S->>D: suppression (pas de fichier orphelin)
            R-->>F: 500
        end
    end

    F-->>U: Message de succès ou d'erreur
```

## Lecture du diagramme

- **Étapes 4 à 7 — identification** : temporairement, `getCurrentUser()` renvoie toujours l'utilisateur de démo `demo@partage.local`. Une fois US-A2 livrée, il lira la session et pourra renvoyer `null` (→ 401).
- **Validations (bloc `alt`)** : elles ont lieu *avant* toute écriture, pour ne jamais toucher au disque avec une requête invalide. La validation de taille max et de type est prévue dans US-E2.
- **Écriture sur disque** : le nom aléatoire (`randomUUID`) empêche les collisions entre fichiers de même nom et les attaques par *path traversal* (`../`). Le nom d'origine n'est conservé qu'en base.
- **Cohérence disque / base** : si l'insertion en base échoue après l'écriture sur disque, le fichier est supprimé pour ne pas laisser d'orphelin.

Code concerné : [`src/app/upload-form.tsx`](../../src/app/upload-form.tsx), [`src/app/api/files/route.ts`](../../src/app/api/files/route.ts), [`src/lib/current-user.ts`](../../src/lib/current-user.ts), [`src/lib/storage.ts`](../../src/lib/storage.ts).
