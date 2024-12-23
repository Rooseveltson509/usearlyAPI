import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { getUserId } from "../utils/jwtUtils.js";
// Récupération des modèles nécessaires
const { User, Category, SiteType, Reporting } = db;
import { service } from "../services/siteService.js";
import { reportService } from "../services/reportService.js";
import logger from "../utils/logger.js";

export const reporting = {
  // Créer un rapport
  createReport: async function (req, res) {
    try {
      const userId = getUserId(req.headers["authorization"]);
      if (userId <= 0) {
        return res.status(400).json({ error: "missing parameters..." });
      }

      const { siteUrl, description } = req.body;
      const normalizedUrl = service.normalizeUrl(siteUrl);

      if (!service.isValidUrl(normalizedUrl)) {
        return res
          .status(400)
          .json({ error: "URL invalide ou non approuvée.", siteUrl });
      }

      await reportService.validateUser(userId);

      // Chargement des catégories existantes
      const existingCategories = await Category.findAll({
        attributes: ["name"],
      });
      const categoryNames = existingCategories.map((cat) => cat.name);

      const siteMetadata = await service.getSiteMetadata(normalizedUrl);

      const { siteType, categories: generatedCategories } =
        await service.getCategoriesAndSiteType(
          description,
          siteMetadata,
          categoryNames,
          []
        );

      const siteTypeObject = await service.findOrCreateSiteType(siteType);
      const siteTypeId = siteTypeObject.id;

      // Création d’un nouveau signalement ou détection de doublon
      const reportResult = await reportService.createReporting(
        userId,
        req.body,
        generatedCategories,
        siteTypeId
      );

      // Retourner la réponse appropriée en cas de doublon ou de création
      return res.status(reportResult.status).json(reportResult);
    } catch (error) {
      logger.error("Erreur lors de la création du signalement :", error);
      return res.status(500).json({
        error: "Une erreur est survenue lors de la création du signalement.",
      });
    }
  },
  // Find User Reportings By store
  getAllReports: async function (req, res) {
    try {
      // Récupérer l'authentification de l'admin
      const headerAuth = req.headers["authorization"];
      const adminId = getUserId(headerAuth);

      // Vérifier si l'utilisateur est un administrateur
      const admin = await User.findOne({
        where: { id: adminId, role: "admin" },
      });
      if (!admin) {
        return res.status(403).json({ error: "Accès non autorisé." });
      }

      // Paramètres pour la pagination
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Récupérer tous les reportings avec pagination
      const { count, rows: reports } = await Reporting.findAndCountAll({
        attributes: [
          "id",
          "siteUrl",
          "marque",
          "bugLocation",
          "emojis",
          "description",
          "blocking",
          "tips",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: User,
            as: "User",
            attributes: ["pseudo", "email"],
          },
          {
            model: SiteType,
            as: "siteType",
            attributes: ["name", "description"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      // Retourner les reportings avec pagination
      return res.status(200).json({
        totalReports: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        reports,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des reportings :", err);
      return res.status(500).json({
        error:
          "Une erreur est survenue lors de la récupération des signalements.",
      });
    }
  },

  getReportsByUser: async function (req, res) {
    try {
      // Récupérer l'authentification de l'admin
      const headerAuth = req.headers["authorization"];
      const adminId = getUserId(headerAuth);

      // Vérifier si l'utilisateur est un administrateur
      const admin = await User.findOne({
        where: { id: adminId, role: "admin" },
      });
      if (!admin) {
        return res.status(403).json({ error: "Accès non autorisé." });
      }

      // Récupérer l'email de l'utilisateur cible depuis les paramètres
      const { email } = req.params;

      if (!email) {
        return res
          .status(400)
          .json({ error: "L'email de l'utilisateur est requis." });
      }

      // Vérifier si l'utilisateur cible existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: "Utilisateur introuvable." });
      }

      // Récupérer les reportings de l'utilisateur spécifié
      const { count, rows: userReports } = await Reporting.findAndCountAll({
        where: { userId: user.id },
        attributes: [
          "id",
          "siteUrl",
          "marque",
          "bugLocation",
          "emojis",
          "description",
          "blocking",
          "tips",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: User,
            as: "User",
            attributes: ["pseudo", "email"],
          },
          {
            model: SiteType,
            as: "siteType",
            attributes: ["name", "description"],
          },
        ],
      });

      // Retourner les reportings avec le nombre total
      return res.status(200).json({
        user: { id: user.id, pseudo: user.pseudo, email: user.email },
        totalReports: count,
        reports: userReports,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des reportings :", err);
      return res.status(500).json({
        error:
          "Une erreur est survenue lors de la récupération des signalements.",
      });
    }
  },
};
