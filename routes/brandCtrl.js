import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  getUserId,
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
        user: {
          avatar: user.avatar,
          type: "brand", // Ajout du type ici
        },
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

  fetchBrandProfile: async (req, res) => {
    try {
      // Récupération du token d'authentification
      // Getting auth header
      let headerAuth = req.headers["authorization"];
      const brandId = getUserId(headerAuth); // Fonction pour extraire l'ID du token

      if (brandId < 0) {
        return res
          .status(401)
          .json({ success: false, message: "Non autorisé." });
      }

      // Recherche de la marque dans la base de données
      const brand = await Marque.findOne({
        attributes: ["id", "name", "email", "avatar", "offres"], // Champs que tu veux retourner
        where: { id: brandId },
      });

      // Vérification si la marque existe
      if (!brand) {
        return res
          .status(404)
          .json({ success: false, message: "Marque non trouvée." });
      }

      // Retourner le profil de la marque
      return res.status(200).json({ success: true, brand });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du profil de la marque :",
        error
      );
      return res
        .status(500)
        .json({ success: false, message: "Erreur interne du serveur." });
    }
  },

  // �� trouver une marque par son nom
  getBrandByName: async function (req, res) {
    try {
      let headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth); // Fonction pour extraire l'ID du token

      if (userId < 0) {
        return res
          .status(401)
          .json({ success: false, message: "Non autorisé." });
      }
      const { name } = req.params;
      const brand = await Marque.findOne({ where: { name } });

      if (!brand) {
        return res.status(404).json({ error: "Marque non trouvée" });
      }
      if (brand.avatar.includes("..")) {
        return res.status(400).json({ error: "Chemin d'accès interdit" });
      }
      const isValidAvatarPath = brand.avatar.startsWith(
        "uploads/avatars/brands/"
      );

      if (!isValidAvatarPath) {
        return res.status(400).json({ error: "Chemin d'avatar invalide" });
      }

      const allowedHosts = ["usearlyapi.fly.dev", "localhost:3000"];
      const host = req.get("host");

      if (!allowedHosts.includes(host)) {
        return res.status(400).json({ error: "Domaine non autorisé" });
      }

      const baseUrl = `${req.protocol}://${host}`;
      res.json({
        avatar: brand.avatar
          ? `${baseUrl}/${brand.avatar}`
          : "/default-avatar.png",
        updatedAt: brand.updatedAt ? brand.updatedAt.toISOString() : null, // Formate proprement
      });
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};
