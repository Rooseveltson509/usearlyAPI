import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { getUserId } from "../utils/jwtUtils.js";
// Récupération des modèles nécessaires
const { User, Category, SiteType, Reporting } = db;
import { service } from "../services/siteService.js";
import { reportService } from "../services/reportService.js";
import logger from "../utils/logger.js";
import { performance } from "perf_hooks";

export const reporting = {
  // Créer un rapport
  createReport: async function (req, res) {
    try {
      const startTotal = performance.now(); // Démarrage
      const userId = getUserId(req.headers["authorization"]);
      if (userId <= 0) {
        const endTotal = performance.now();
        console.log(
          `Total execution time: ${(endTotal - startTotal).toFixed(2)}ms`
        );
        return res.status(400).json({ error: "missing parameters..." });
      }

      const { siteUrl, description } = req.body;
      const normalizedUrl = service.normalizeUrl(siteUrl);

      const startValidation = performance.now();
      if (!service.isValidUrl(normalizedUrl)) {
        console.log(
          `Validation executed in ${(performance.now() - startValidation).toFixed(2)}ms`
        );
        return res
          .status(400)
          .json({ error: "URL invalide ou non approuvée.", siteUrl });
      }
      // Appels parallèles pour réduire le temps d'attente
      const startCategories = performance.now();
      const [existingCategories, siteMetadata] = await Promise.all([
        //await reportService.getCategories(),
        Category.findAll({ attributes: ["name"] }),
        service.getSiteMetadata(normalizedUrl),
      ]);
      console.log(
        `Category retrieval executed in ${(performance.now() - startCategories).toFixed(2)}ms`
      );
      const categoryNames = existingCategories.map((cat) => cat.name);

      // Génération des catégories et du type de site
      const startSiteType = performance.now();
      const { siteType, categories: generatedCategories } =
        await service.getCategoriesAndSiteType(
          description,
          siteMetadata,
          categoryNames,
          []
        );
      console.log(
        `SiteType generation executed in ${(performance.now() - startSiteType).toFixed(2)}ms`
      );

      const siteTypeObject = await service.findOrCreateSiteType(siteType);

      // Création du signalement
      const startDuplicationCheck = performance.now();
      const reportResult = await reportService.createReporting(
        userId,
        req.body,
        generatedCategories,
        siteTypeObject.id
      );
      console.log(
        `Duplication check executed in ${(performance.now() - startDuplicationCheck).toFixed(2)}ms`
      );

      const endTotal = performance.now();
      console.log(
        `Total execution time: ${(endTotal - startTotal).toFixed(2)}ms`
      );

      return res.status(reportResult.status).json(reportResult);
    } catch (error) {
      logger.error("Erreur lors de la création du signalement :", error);
      return res.status(500).json({
        error: "Une erreur est survenue lors de la création du signalement.",
      });
    }
  },
  // Find User Reportings By store
  /*   getAllReports: async function (req, res) {
    try {
      // Récupérer l'authentification de l'admin
      const headerAuth = req.headers["authorization"];
      const adminId = getUserId(headerAuth);

      // Vérifier si l'utilisateur est un administrateur
      const admin = await User.findOne({
        where: { id: adminId },
        //where: { id: adminId, role: "admin" },
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
      // Ajouter l'en-tête Content-Type
      res.setHeader("Content-Type", "application/json");
      // Retourner les reportings avec pagination
      return res.status(200).json({
        totalReports: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        reports,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des reportings :", err);
      // Ajouter l'en-tête Content-Type
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error:
          "Une erreur est survenue lors de la récupération des signalements.",
      });
    }
  }, */

  getAllReports: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const adminId = getUserId(headerAuth);

      const admin = await User.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(403).json({ error: "Accès non autorisé." });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20; // Mets ici la valeur correcte (ex: 20)

      const offset = (page - 1) * limit;

      // ✅ Ajout de `include: Category` pour récupérer les catégories associées
      const { count, rows: reports } = await Reporting.findAndCountAll({
        distinct: true, // ✅ Ajoute ceci pour éviter les doublons dans le comptage
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
          {
            model: Category, // 🔥 Inclusion des catégories
            as: "categories",
            attributes: ["name"],
            through: { attributes: [] }, // 🔹 On n'affiche pas la table de jointure
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        totalReports: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        reports,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des reportings :", err);
      res.setHeader("Content-Type", "application/json");
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
