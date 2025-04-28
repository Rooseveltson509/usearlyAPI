import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import { getUserId } from "../utils/jwtUtils.js";
import { reportService } from "../services/reportService.js";
import { sendNotificationToUser } from "../services/notificationService.js";
import { createNotification } from "./notificationCtrl.js";
import { service as siteService } from "../services/siteService.js";
import { getSubCategoriesByReportingId } from "../services/subCategoryService.js";
import { Sequelize } from "sequelize";
const { User, SiteType, Reporting } = db;

export const reporting = {
  // Créer un rapport
  createReport: async function (req, res) {
    try {
      const userId = getUserId(req.headers["authorization"]);
      if (userId <= 0) {
        return res.status(400).json({ error: "Utilisateur non authentifié." });
      }

      const { siteUrl, description } = req.body;
      const normalizedUrl = siteService.normalizeUrl(siteUrl);

      if (!siteService.isValidUrl(normalizedUrl)) {
        return res
          .status(400)
          .json({ error: "URL invalide ou non approuvée." });
      }
      // **🔍 Extraire automatiquement la marque et bugLocation**
      const brandName = await siteService.extractBrandName(siteUrl);
      const { bugLocation, categories } =
        await siteService.extractBugLocationAndCategories(siteUrl);

      console.log(`🏷️ Marque détectée: ${brandName}`);
      console.log(`🔍 bugLocation détecté: ${bugLocation}`);
      console.log(`🏷️ Catégories détectées: ${categories.join(", ")}`);

      // ✅ Passer les données au service de signalement
      const reportResult = await reportService.createReporting(userId, {
        siteUrl: normalizedUrl,
        bugLocation, // ✅ On utilise maintenant la valeur extraite automatiquement
        categories,
        description,
        marque: brandName,
        blocking: req.body.blocking,
        tips: req.body.tips,
        emojis: req.body.emojis,
        capture: req.body.capture,
      });

      return res.status(reportResult.status).json(reportResult);
    } catch (error) {
      console.error("❌ Erreur lors de la création du signalement :", error);
      return res.status(500).json({
        error: "Une erreur est survenue lors de la création du signalement.",
      });
    }
  },

  getReport: async function (req, res) {
    try {
      const userId = getUserId(req.headers["authorization"]);

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }
      const { id } = req.params;

      const reportResult = await reportService.getReportWithDescriptions(id);

      return res.status(reportResult.status).json(reportResult);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du signalement :",
        error
      );
      return res.status(500).json({
        error: "Erreur interne du serveur.",
      });
    }
  },

  getGroupedReports: async function (req, res) {
    try {
      const grouped = await Reporting.findAll({
        attributes: [
          "bugLocation",
          "subCategory",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["bugLocation", "subCategory"],
        order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
      });

      return res.status(200).json(grouped);
    } catch (error) {
      console.error("❌ Erreur regroupement reports :", error);
      return res.status(500).json({ error: "Erreur serveur." });
    }
  },

  getSubCategories: async function (req, res) {
    try {
      const { reportingId } = req.params;

      const result = await getSubCategoriesByReportingId(reportingId);

      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ Erreur dans getSubCategories:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },
  getAllGroupedReports: async function (req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await reportService.getAllGroupedByCategory({
        page,
        limit,
      });
      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ Erreur dans getAllGroupedReports:", error);
      return res.status(500).json({ error: "Erreur serveur." });
    }
  },

  markReportingAsResolved: async (req, res) => {
    const { reportingId } = req.params; // On récupère l'ID du signalement dans l'URL
    try {
      // Trouver le signalement en base
      const reporting = await Reporting.findByPk(reportingId);
      if (!reporting)
        return res.status(404).json({ error: "Signalement non trouvé" });

      // Mise à jour du statut du signalement
      reporting.status = "resolved";
      await reporting.save();

      // Envoi des notifications aux utilisateurs
      const users = await reporting.getUser(); // On récupère tous les utilisateurs qui ont signalé ce problème
      users.forEach((user) => {
        sendNotificationToUser(user.id, "🎉 Votre signalement a été résolu !"); // Envoi de la notification
      });

      return res.status(200).json({
        message: "Signalement marqué comme résolu et notifications envoyées.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du signalement" });
    }
  },

  updateReporting: async (req, res) => {
    try {
      const { reportingId } = req.params; // Récupère l'ID du signalement
      const { status } = req.body; // Le nouveau statut (résolu)

      // Vérification du statut, on ne traite que les signalements "résolus"
      if (status === "resolved") {
        // Récupérer le signalement pour trouver l'utilisateur
        const reporting = await Reporting.findByPk(reportingId);

        if (!reporting) {
          return res.status(404).json({ message: "Signalement introuvable" });
        }

        // Marquer le signalement comme "résolu"
        reporting.status = "resolved";
        await reporting.save();

        // Créer une notification pour l'utilisateur
        await createNotification({
          userId: reporting.userId,
          message: "🎉 Votre signalement a été résolu !",
          type: "bug_fixed", // Tu peux ajouter un type pour identifier la notification
        });

        return res.status(200).json({
          message: "Signalement marqué comme résolu et notification envoyée",
        });
      }

      return res.status(400).json({ message: "Statut invalide" });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du signalement", error);
      return res.status(500).json({
        error: "Erreur interne lors de la mise à jour du signalement",
      });
    }
  },
  getPageInfo: async function (req, res) {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ error: "URL manquante." });

      const result = await reportService.getSubcategoryStructureForPage(url);
      if (!result)
        return res
          .status(400)
          .json({ error: "URL invalide ou non traitable." });

      return res.status(200).json(result);
    } catch (err) {
      console.error("❌ Erreur getPageInfo:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
  },

  /**
   * Récupère un signalement avec toutes ses descriptions associées.
   */
  getReportWithDescriptions: async function (req, res) {
    try {
      const { reportingId } = req.params;
      const reportData =
        await reportService.getReportingWithDescriptions(reportingId);

      if (!reportData.success) {
        return res.status(404).json({ error: reportData.message });
      }

      return res.status(200).json(reportData);
    } catch (error) {
      console.error("Erreur lors de la récupération du signalement :", error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  },
  testGetSiteMetadata: async (req, res) => {
    try {
      const { siteUrl } = req.query; // Récupérer l'URL depuis la requête GET
      if (!siteUrl) {
        return res.status(400).json({ error: "Veuillez fournir un siteUrl." });
      }

      console.log(`🔍 Récupération des métadonnées pour : ${siteUrl}`);
      const metadata = await siteService.getSiteMetadata(siteUrl);

      return res.status(200).json({
        success: true,
        metadata,
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des métadonnées :",
        error
      );
      return res.status(500).json({
        error: "Impossible de récupérer les métadonnées du site.",
      });
    }
  },

  // ✅ Ajouter ou supprimer une réaction sur un signalement
  addReactionToReport: async function (req, res) {
    try {
      console.log("📌 Requête reçue pour ajouter une réaction...");
      console.log("📦 Headers :", req.headers);
      console.log("📦 Body reçu :", req.body);
      console.log("📦 Paramètres :", req.params);

      const { reportId } = req.params;
      const { emoji } = req.body;
      const userId = getUserId(req.headers["authorization"]);

      if (!userId) {
        console.error("❌ Erreur : Utilisateur non authentifié.");
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      if (!reportId || !emoji) {
        console.error("❌ Erreur : Paramètres manquants.");
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      const report = await Reporting.findByPk(reportId);
      if (!report) {
        console.error("❌ Erreur : Signalement non trouvé.");
        return res.status(404).json({ error: "Signalement non trouvé." });
      }

      // ✅ Vérification et correction des réactions
      let reactions = [];

      if (
        typeof report.reactions === "string" &&
        report.reactions.trim() !== ""
      ) {
        try {
          reactions = JSON.parse(report.reactions);
          if (!Array.isArray(reactions)) {
            console.error(
              "❌ Données des réactions invalides. Réinitialisation..."
            );
            reactions = [];
          }
        } catch (error) {
          console.error("❌ Erreur lors du parsing JSON :", error);
          return res.status(500).json({
            error:
              "Données corrompues dans les réactions. Veuillez contacter un administrateur.",
          });
        }
      }

      console.log("✅ Réactions après parsing :", reactions);

      // ✅ Vérifie si l'utilisateur a déjà réagi
      const existingIndex = reactions.findIndex((r) => r.userId === userId);

      if (existingIndex !== -1) {
        if (reactions[existingIndex].emoji === emoji) {
          console.log("🔄 Suppression de la réaction existante.");
          reactions.splice(existingIndex, 1);
        } else {
          console.log("🔄 Mise à jour de l'emoji de la réaction.");
          reactions[existingIndex].emoji = emoji;
        }
      } else {
        console.log("➕ Ajout d'une nouvelle réaction.");
        reactions.push({ userId, emoji, count: 1 });
      }

      console.log("✅ Réactions mises à jour :", reactions);

      // ✅ Mise à jour de la base de données
      await report.update({ reactions: JSON.stringify(reactions) });

      return res.status(200).json({
        success: true,
        message: "Réaction mise à jour.",
        reactions,
      });
    } catch (err) {
      console.error("❌ Erreur lors de l'ajout de la réaction :", err);
      return res.status(500).json({ error: "Une erreur est survenue" });
    }
  },

  // ✅ Récupérer les utilisateurs ayant réagis avec un emoji sur un report
  getReportReactionUsers: async (req, res) => {
    try {
      const { reportId, emoji } = req.params;
      console.log(
        "🔍 Requête reçue pour le report :",
        reportId,
        "et emoji :",
        emoji
      );

      const report = await Reporting.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      console.log("🗂 Réactions stockées :", report.reactions);

      // Vérifie que les réactions existent et sont bien un tableau
      if (!report.reactions || typeof report.reactions !== "string") {
        return res.status(200).json({ success: true, users: [] });
      }

      // Transforme en tableau JSON
      let reactions;
      try {
        reactions = JSON.parse(report.reactions);
      } catch (err) {
        console.error("❌ Erreur JSON :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'analyse des réactions" });
      }

      console.log("✅ Réactions après parsing :", reactions);

      // Filtrer les utilisateurs ayant utilisé cet emoji
      const users = reactions
        .filter((r) => r.emoji === emoji)
        .map((r) => r.userId);

      console.log("👥 Utilisateurs ayant réagi :", users);

      if (users.length === 0) {
        return res.status(200).json({ success: true, users: [] });
      }

      // Récupérer les infos des utilisateurs
      const userInfos = await User.findAll({
        where: { id: users },
        attributes: ["id", "pseudo", "avatar"],
      });

      return res.status(200).json({ success: true, users: userInfos });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  getAllReportReactions: async function (req, res) {
    try {
      console.log("📌 Récupération des réactions...");

      const { reportId } = req.params;

      const report = await Reporting.findByPk(reportId);
      if (!report) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      console.log("🗂 Réactions stockées dans la BDD :", report.reactions);

      // ✅ Vérifie si `report.reactions` est null ou vide
      if (!report.reactions || typeof report.reactions !== "string") {
        return res.status(200).json({ success: true, reactions: [] });
      }

      let reactions;
      try {
        reactions = JSON.parse(report.reactions);
      } catch (err) {
        console.error("❌ Erreur JSON :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'analyse des réactions" });
      }

      console.log("✅ Réactions après parsing :", reactions);

      return res.status(200).json({ success: true, reactions });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // Find User Reportings By store
  getAllReports: async function (req, res) {
    try {
      console.log("🔄 Requête reçue pour récupérer les signalements...");

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const offset = (page - 1) * limit;

      console.log(`📌 Page: ${page}, Limit: ${limit}`);

      const { count, rows: reports } = await Reporting.findAndCountAll({
        distinct: true,
        limit,
        offset,
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "pseudo", "avatar"],
          },
        ],
        attributes: {
          include: [[Sequelize.literal("'signalement'"), "type"]],
        },
        order: [["createdAt", "DESC"]],
      });

      console.log("✅ Signalements récupérés :", reports);

      const formattedReports = reports.map((report) => {
        let reactions = [];
        if (report.reactions && typeof report.reactions === "string") {
          try {
            reactions = JSON.parse(report.reactions);
          } catch (error) {
            console.error("❌ Erreur parsing JSON des réactions :", error);
          }
        }

        // ✅ Normalisation des réactions
        const reactionMap = new Map();

        reactions.forEach((reaction) => {
          if (!reaction.emoji) return;

          const key = reaction.emoji;
          if (!reactionMap.has(key)) {
            reactionMap.set(key, {
              emoji: reaction.emoji,
              userIds: new Set(), // Utilisation d'un Set pour éviter les doublons
            });
          }

          reactionMap.get(key).userIds.add(reaction.userId);
        });

        // ✅ Format final des réactions
        const normalizedReactions = Array.from(reactionMap.values()).map(
          (reaction) => ({
            emoji: reaction.emoji,
            count: reaction.userIds.size, // Le count est le nombre unique d'utilisateurs
            userIds: Array.from(reaction.userIds), // Convertir le Set en tableau
          })
        );

        return {
          ...report.toJSON(),
          type: "signalement",
          reactions: normalizedReactions,
        };
      });

      console.log("📤 Réponse envoyée :", formattedReports);

      res.status(200).json({
        totalReports: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        reports: formattedReports,
      });
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      res.status(500).json({ error: "❌ Erreur serveur" });
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

  // ✅ Confirmer un bug déjà signalé
  confirmReport: async function (req, res) {
    try {
      const userId = getUserId(req.headers["authorization"]);
      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }

      const { reportingId } = req.body;
      if (!reportingId) {
        return res.status(400).json({ error: "reportingId manquant." });
      }

      const result = await reportService.addSupportToReport(
        userId,
        reportingId
      );

      return res.status(result.status).json(result);
    } catch (error) {
      console.error("❌ Erreur lors de la confirmation du report :", error);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors de la confirmation." });
    }
  },
};
