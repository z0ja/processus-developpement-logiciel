import { prisma } from "@/lib/prisma";
import { hashPassword, validateEmail, validatePassword } from "@/lib/password";

// US-A1 : Création de compte utilisateur
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Requête invalide : corps JSON attendu." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return Response.json(
      { error: "Données de formulaire invalides." },
      { status: 400 }
    );
  }

  const { email, password, confirmPassword } = body as {
    email?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
  };

  // Validation de l'email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return Response.json({ error: emailValidation.error }, { status: 400 });
  }

  // Validation du mot de passe
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return Response.json({ error: passwordValidation.error }, { status: 400 });
  }

  const emailStr = (email as string).trim().toLowerCase();
  const passwordStr = password as string;

  // Validation de la confirmation (si fournie)
  if (confirmPassword !== undefined && confirmPassword !== passwordStr) {
    return Response.json(
      { error: "Les mots de passe ne correspondent pas." },
      { status: 400 }
    );
  }

  try {
    // Vérification de l'unicité de l'email
    const existingUser = await prisma.user.findUnique({
      where: { email: emailStr },
    });

    if (existingUser) {
      return Response.json(
        { error: "Un compte existe déjà avec cette adresse email." },
        { status: 409 }
      );
    }

    // Hachage sécurisé du mot de passe
    const passwordHash = await hashPassword(passwordStr);

    // Création de l'utilisateur en base de données
    const user = await prisma.user.create({
      data: {
        email: emailStr,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        message: "Compte créé avec succès.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de compte :", error);
    return Response.json(
      { error: "Une erreur est survenue lors de la création du compte." },
      { status: 500 }
    );
  }
}
