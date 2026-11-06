import { prisma } from "@/lib/prisma";

// Ce composant s'exécute à 100% côté serveur
export default async function ServerPage() {
  // Récupération directe depuis la base de données SQLite via Prisma
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc", // Trie du plus récent au plus ancien
    },
  });

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h1>Tableau de bord (Côté Serveur)</h1>
      <p>
        Cette page est générée sur le serveur. Elle interroge Prisma directement.
      </p>
      
      <div style={{ marginTop: "2rem" }}>
        <h2>Utilisateurs inscrits ({users.length})</h2>
        
        {users.length === 0 ? (
          <p>Aucun utilisateur n'est encore inscrit.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {users.map((user) => (
              <li 
                key={user.id} 
                style={{ 
                  padding: "1rem", 
                  borderBottom: "1px solid #ccc",
                  marginBottom: "0.5rem"
                }}
              >
                <strong>{user.email}</strong>
                <br />
                <small>
                  Inscrit le : {new Date(user.createdAt).toLocaleString("fr-FR")}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}