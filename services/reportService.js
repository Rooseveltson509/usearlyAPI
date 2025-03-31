import db from "../models/index.js";
import dotenv from "dotenv";
import stringSimilarity from "string-similarity";
import { sendNotificationToUser } from "./notificationService.js";
const {
  Reporting,
  ReportingDescription,
  Category,
  UserPoints,
  ReportingUsers,
} = db;
dotenv.config();

export const reportService = {
  async createReporting(userId, data) {
    const { siteUrl, bugLocation, description } = data;

    // ✅ Normaliser l'URL et extraire le domaine
    const fullUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const parsedUrl = new URL(fullUrl);
    const domain = parsedUrl.hostname.replace(/^www\./, ""); // Ex: "nike.com"

    console.log(
      `🔍 Vérification du signalement sur: ${domain}, ${bugLocation}`
    );

    // 🔍 Vérifier si un signalement similaire (même domaine + bugLocation) existe déjà
    const existingReport = await Reporting.findOne({
      where: { domain, bugLocation },
    });

    if (existingReport) {
      if (existingReport.userId === userId) {
        return {
          isDuplicate: true,
          status: 200,
          success: true,
          message:
            "Vous avez déjà signalé ce problème, nous sommes en train de l'étudier.",
          reportingId: existingReport.id,
        };
      }

      const existingDescriptions = await ReportingDescription.findOne({
        where: { reportingId: existingReport.id, userId },
      });

      if (existingDescriptions) {
        return {
          isDuplicate: true,
          status: 200,
          success: true,
          message:
            "Vous avez déjà signalé ce problème, nous sommes en train de l'étudier.",
          reportingId: existingReport.id,
        };
      }

      await ReportingDescription.create({
        reportingId: existingReport.id,
        userId,
        description,
      });

      return {
        status: 200,
        success: true,
        message:
          "Un signalement similaire existe déjà. Votre description a été ajoutée.",
        reportingId: existingReport.id,
      };
    }

    // 🆕 Création d’un nouveau signalement avec `domain`
    const newReporting = await Reporting.create({
      userId,
      siteUrl,
      domain, // ✅ On stocke le domaine pour éviter les erreurs
      bugLocation,
      categories: data.categories,
      description,
      marque: data.marque,
      emojis: data.emojis,
      blocking: data.blocking,
      capture: data.capture,
      tips: data.tips,
    });
    // Ajouter un enregistrement dans ReportingUsers pour le nouveau signalement
    await ReportingUsers.create({
      reportingId: newReporting.id,
      userId,
    });

    return {
      isDuplicate: false,
      status: 201,
      success: true,
      message: "Nouveau signalement créé avec succès.",
      reportingId: newReporting.id,
    };
  },

  async findSimilarReporting(siteUrl, bugLocation, description) {
    const start = Date.now();
    console.log(
      `🔍 Recherche signalement similaire pour ${siteUrl} - ${bugLocation}`
    );

    const reports = await Reporting.findAll({
      where: { siteUrl, bugLocation },
      include: [{ model: ReportingDescription, as: "descriptions" }],
    });

    console.log(
      `📌 [${Date.now() - start}ms] Signalements trouvés : ${reports.length}`
    );

    if (reports.length === 0) {
      return null;
    }

    // Comparer la description avec les existantes
    const similarityStart = Date.now();
    for (let report of reports) {
      for (let desc of report.descriptions) {
        const similarity = stringSimilarity.compareTwoStrings(
          description.toLowerCase(),
          desc.description.toLowerCase()
        );
        console.log(
          `🧐 Comparaison "${description}" vs "${desc.description}" → Similarité: ${similarity.toFixed(2)}`
        );

        if (similarity > 0.8) {
          console.log(
            `✅ [${Date.now() - similarityStart}ms] Signalement similaire détecté : ${report.id}`
          );
          return report;
        }
      }
    }

    console.log(
      `❌ [${Date.now() - similarityStart}ms] Aucun signalement similaire trouvé.`
    );
    return null;
  },
  async hasUserAlreadyReported(reportingId, userId) {
    const isAuthor = await Reporting.findOne({
      where: { id: reportingId, userId },
    });
    if (isAuthor) return true;

    const existingDescription = await ReportingDescription.findOne({
      where: { reportingId, userId },
    });
    return !!existingDescription;
  },

  /**
   * Recherche ou crée les catégories nécessaires.
   */
  async findOrCreateCategories(categories, siteTypeId) {
    const existingCategories = await Category.findAll({
      where: { name: categories },
      attributes: ["id", "name"],
    });

    const existingCategoryNames = existingCategories.map((cat) => cat.name);

    const newCategories = categories.filter(
      (cat) => !existingCategoryNames.includes(cat)
    );

    const newCategoryInstances = await Promise.all(
      newCategories.map((categoryName) =>
        Category.create({ name: categoryName, siteTypeId })
      )
    );

    return [...existingCategories, ...newCategoryInstances];
  },
  /**
   * Récupère un signalement avec ses descriptions associées.
   */
  async getReportingWithDescriptions(reportingId) {
    try {
      const reporting = await Reporting.findOne({
        where: { id: reportingId },
        include: [
          {
            model: ReportingDescription,
            as: "descriptions",
            attributes: ["id", "userId", "description", "createdAt"],
          },
        ],
      });

      if (!reporting) {
        return { success: false, message: "Signalement introuvable." };
      }

      // 🚀 Vérifier si Sequelize renvoie une seule description
      console.log(
        "🔍 Sequelize renvoie :",
        JSON.stringify(reporting.descriptions, null, 2)
      );

      return {
        success: true,
        reporting: {
          ...reporting.toJSON(), // Assure que l'objet est bien structuré
          descriptions: Array.from(new Set(reporting.descriptions)), // ✅ Supprime les doublons accidentels
        },
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du signalement :", error);
      return { success: false, message: "Erreur interne du serveur." };
    }
  },
  /**
   * Récupère les bugs les plus signalés pour un site donné
   * @param {string} siteUrl - L'URL normalisée du site (ex: adidas.fr)
   * @returns {Promise<Array>} Liste des bugs les plus signalés avec compteur
   */
  async getTopReportedBugs(siteUrl) {
    try {
      const reports = await Reporting.findAll({
        where: { siteUrl },
        include: [
          {
            model: ReportingDescription,
            as: "descriptions",
          },
        ],
      });

      const result = reports.map((report) => {
        return {
          reportingId: report.id,
          bugLocation: report.bugLocation,
          mainDescription: report.description,
          count: 1 + report.descriptions.length, // le créateur initial + descriptions liées
        };
      });

      // 🔽 Tri décroissant selon le nombre de signalements
      return result.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("❌ Erreur getTopReportedBugs:", error);
      throw new Error("Impossible de récupérer les signalements populaires.");
    }
  },
  addSupportToReport: async function (userId, reportingId) {
    try {
      // Vérifie si le report existe
      const report = await Reporting.findByPk(reportingId);
      if (!report) {
        return { status: 404, error: "Signalement introuvable." };
      }

      // Vérifie si l'utilisateur a déjà soutenu ce report
      const existing = await ReportingDescription.findOne({
        where: { userId, reportingId },
      });

      if (existing) {
        return {
          status: 200,
          success: true,
          message: "Vous avez déjà confirmé ce bug.",
          points: 0,
        };
      }

      // Crée une description vide pour représenter un soutien
      await ReportingDescription.create({
        userId,
        reportingId,
        description: "(Confirmation sans commentaire)",
      });

      // ✅ Ajout des points dans UserPoints
      await UserPoints.create({
        userId,
        action: "support_bug",
        points: 5,
        metadata: { reportingId },
      });

      return {
        status: 200,
        success: true,
        message: "Merci ! Votre confirmation a été prise en compte.",
        points: 5, // 🎁 BONUS si gamification
      };
    } catch (error) {
      console.error("❌ Erreur addSupportToReport :", error);
      return {
        status: 500,
        error: "Erreur serveur lors de l'ajout du soutien.",
      };
    }
  },
  // Méthode pour marquer un signalement comme résolu
  markReportingAsResolved: async (reportingId) => {
    // Récupérer le signalement à partir de l'ID
    const reporting = await Reporting.findByPk(reportingId);
    if (!reporting) {
      throw new Error("Signalement introuvable");
    }

    // Mettre à jour le statut du signalement en "résolu"
    reporting.status = "resolved";
    await reporting.save();

    // Envoyer une notification à l'utilisateur qui a fait ce signalement
    sendNotificationToUser(
      reporting.userId,
      "🎉 Votre signalement a été résolu !"
    );
  },

  updateReporting: async (req, res) => {
    try {
      const { reportingId } = req.params; // ID du signalement
      const { status } = req.body; // Nouveau statut pour le signalement

      // Vérifier que le statut est "résolu" et que l'utilisateur est admin
      if (status === "resolved") {
        // Appeler la méthode pour marquer le signalement comme résolu
        await this.markReportingAsResolved(reportingId);
        // Répondre avec un message de succès
        return res
          .status(200)
          .json({ message: "Signalement marqué comme résolu" });
      }

      // Si le statut n'est pas "résolu", gérer d'autres cas
      // ...
    } catch (error) {
      console.error("Erreur lors de la mise à jour du signalement", error);
      return res.status(500).json({
        error: "Erreur interne lors de la mise à jour du signalement",
      });
    }
  },
};
