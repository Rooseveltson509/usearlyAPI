import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { getUserId } from "../utils/jwtUtils.js";
// Récupération des modèles nécessaires
const { User, Category, SiteType, Reporting, ReportingDescription } = db;
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

      const { siteUrl, bugLocation, description } = req.body;

      const normalizedUrl = service.normalizeUrl(siteUrl);

      // Validation de l'URL
      if (!service.isValidUrl(normalizedUrl)) {
        return res
          .status(400)
          .json({ error: "URL invalide ou non approuvée.", siteUrl });
      }

      // Valider l'utilisateur
      await reportService.validateUser(userId);

      // Recherche des signalements similaires
      const similarReporting = await reportService.findSimilarReporting(
        siteUrl,
        bugLocation,
        description
      );

      if (similarReporting) {
        const alreadySubmitted = await reportService.checkExistingDescription(
          similarReporting.id,
          userId,
          description
        );

        if (alreadySubmitted) {
          return res.status(200).json({
            status: 200,
            success: true,
            message: "Vous avez déjà soumis ce signalement pour ce problème.",
          });
        }

        // Ajouter la nouvelle description
        await ReportingDescription.create({
          reportingId: similarReporting.id,
          userId,
          description,
        });

        let totalReports = await ReportingDescription.count({
          where: { reportingId: similarReporting.id },
        });
        return res.status(200).json({
          status: 200,
          success: true,
          message: `Un problème similaire a déjà été signalé. Vous êtes la ${totalReports}ᵉ personne à signaler ce problème.`,
          reportingId: similarReporting.id,
          totalReports,
        });
      }

      // Charger les catégories existantes et types de sites
      const existingCategories = await Category.findAll({
        attributes: ["name"],
      });
      const existingSiteTypes = await SiteType.findAll({
        attributes: ["name"],
      });
      const categoryNames = existingCategories.map((cat) => cat.name);
      const siteTypeNames = existingSiteTypes.map((st) => st.name);

      console.log("URL reçue pour les métadonnées :", normalizedUrl);
      const siteMetadata = await service.getSiteMetadata(normalizedUrl);

      const { siteType, categories: generatedCategories } =
        await service.getCategoriesAndSiteType(
          description,
          siteMetadata,
          categoryNames,
          siteTypeNames
        );

      if (!generatedCategories || generatedCategories.length === 0) {
        return res.status(500).json({
          error:
            "Impossible de générer des catégories pertinentes à partir de la description.",
        });
      }

      const siteTypeObject = await service.findOrCreateSiteType(siteType);
      const siteTypeId = siteTypeObject.id; // Extraire uniquement l'ID

      // Créer un nouveau reporting avec le siteTypeId (UUID correct)
      const newReporting = await reportService.createReporting(
        userId,
        req.body,
        generatedCategories,
        siteTypeId
      );
      logger.info("Création du signalement réussie.");
      return res.status(201).json({
        status: 201,
        success: true,
        message: `Signalement créé avec succès.`,
        reporting: newReporting,
        categories: generatedCategories,
      });
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
