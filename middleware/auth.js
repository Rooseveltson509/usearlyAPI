import db from "../models/index.js";
const { User } = db;
import { getUserId } from "../utils/jwtUtils.js";

export const isAdmin = async (req, res, next) => {
  try {
    let headerAuth = req.headers["authorization"];
    let userId = getUserId(headerAuth);

    console.log("🔍 Vérification Admin - UserId récupéré :", userId);

    if (!userId) {
      console.log("❌ Erreur : UserId non trouvé ou token invalide.");
      return res.status(401).json({ error: "Utilisateur non authentifié." });
    }

    const user = await User.findByPk(userId);

    console.log(
      "🔍 Utilisateur trouvé :",
      user ? user.toJSON() : "Aucun utilisateur trouvé"
    );

    if (!user) {
      console.log("❌ Erreur : Utilisateur non trouvé en base de données.");
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    console.log("🔍 Rôle utilisateur :", user.role);

    if (user.role !== "admin") {
      console.log("❌ Erreur : L'utilisateur n'est pas administrateur.");
      return res.status(403).json({
        error:
          "Accès refusé. Seuls les administrateurs peuvent effectuer cette action.",
      });
    }

    console.log("✅ Accès autorisé pour l'admin :", user.email);
    next();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'admin :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};
