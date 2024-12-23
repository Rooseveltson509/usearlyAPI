import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtUtils.js";
const { Marque } = db;

// Méthodes exportées
export const brandCtrl = {
  login: async (req, res) => {
    const { email, mdp, rememberMe } = req.body;

    if (!email || !mdp) {
      return res
        .status(400)
        .json({ success: false, message: "Email et mot de passe requis." });
    }

    try {
      const user = await Marque.findOne({ where: { email } });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Utilisateur introuvable." });
      }

      if (!user.mdp) {
        return res.status(500).json({
          success: false,
          message: "Mot de passe manquant pour cet utilisateur.",
        });
      }

      const passwordMatch = await bcrypt.compare(mdp, user.mdp);

      if (!passwordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Mot de passe incorrect." });
      }

      // Génération des tokens
      const accessToken = generateAccessToken(user);
      let refreshToken = null;

      if (rememberMe) {
        refreshToken = generateRefreshToken(user);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      } else {
        res.clearCookie("refreshToken");
      }

      const response = {
        success: true,
        message: "Connexion réussie.",
        accessToken,
      };

      if (rememberMe && refreshToken) {
        response.refreshToken = refreshToken;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur interne." });
    }
  },
};
