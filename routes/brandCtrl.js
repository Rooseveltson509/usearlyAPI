import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  getUserId,
} from "../utils/jwtUtils.js";
import {
  getStatsByBrand,
  getLatestReportsByBrand,
  getLatestFeedbacksByType,
  getTopReportByBrand,
} from "../services/brandService.js";
import { getSummaryByBrand } from "../services/brandServiceSummary.js";
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
      const accessToken = generateAccessToken(user, "brand");
      let refreshToken = null;

      const isSecure = process.env.COOKIE_SECURE === "true";

      // ✅ Ajout du refreshToken dans un cookie uniquement si RememberMe
      if (rememberMe) {
        const refreshToken = generateRefreshToken(user, "brand");
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "None" : "Lax",
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

      const { brandName } = req.params; // Récupère le paramètre de l'URL
      console.log("Recherche de la marque :", brandName); // Log pour débogage

      // Changer 'brandName' en 'name' pour correspondre à la colonne de ta BDD
      const brand = await Marque.findOne({ where: { name: brandName } }); // Utiliser 'name' ici

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
    } catch (error) {
      console.error("Erreur serveur :", error); // Log détaillé pour l'erreur
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getAnalyticsStats: async (req, res) => {
    const { brandName } = req.params;
    const days = parseInt(req.query.days, 10) || 7;

    try {
      const stats = await getStatsByBrand(brandName, days);
      res.status(200).json(stats);
    } catch (err) {
      console.error("Erreur getAnalyticsStats:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  },

  getSummaryAnalytics: async (req, res) => {
    const { brandName } = req.params;
    if (!brandName) return res.status(400).json({ error: "Marque manquante" });

    try {
      const summary = await getSummaryByBrand(brandName);
      res.json(summary);
    } catch (err) {
      console.error("Erreur getSummaryAnalytics:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
  getLatestReports: async (req, res) => {
    const { brandName } = req.params;
    if (!brandName) {
      return res.status(400).json({ error: "Marque manquante" });
    }

    try {
      const latest = await getLatestReportsByBrand(brandName);
      res.json(latest);
    } catch (err) {
      console.error("Erreur getLatestReports:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getLatestFeedbacks: async (req, res) => {
    const { brandName } = req.params;
    const { type } = req.query;

    if (!brandName || !type) {
      return res.status(400).json({ error: "Paramètres requis manquants" });
    }

    try {
      const data = await getLatestFeedbacksByType(brandName, type);
      res.json(data);
    } catch (err) {
      console.error("Erreur getLatestFeedbacks:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getTopReport: async (req, res) => {
    const { brandName } = req.params;
    if (!brandName) return res.status(400).json({ error: "Marque manquante" });

    try {
      const data = await getTopReportByBrand(brandName);
      if (!data)
        return res.status(404).json({ message: "Aucun signalement trouvé." });
      res.json(data);
    } catch (err) {
      console.error("Erreur getTopReport:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};
