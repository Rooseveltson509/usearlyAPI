import db from "../models/index.js";
import dotenv from "dotenv";
import { service as siteService } from "../services/siteService.js";
//import stringSimilarity from "string-similarity";
import { sendNotificationToUser } from "./notificationService.js";
import { updateSubCategories } from "../services/subCategoryService.js";

const {
  Reporting,
  ReportingDescription,
  //Category,
  UserPoints,
  ReportingUsers,
  ReportingSubCategory,
  User,
  ReportTimelineStep,
} = db;
dotenv.config();

export const reportService = {
  /*   async createReporting(userId, data) {
    const { siteUrl, bugLocation, description } = data;

    const fullUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const parsedUrl = new URL(fullUrl);
    const domain = parsedUrl.hostname.replace(/^www\./, "");

    console.log(
      `🔍 Vérification du signalement sur: ${domain}, ${bugLocation}`
    );

    const existingReport = await Reporting.findOne({
      where: { domain, bugLocation },
      include: [
        {
          association: "descriptions",
          where: { userId },
          required: false,
          attributes: ["subCategory"],
        },
      ],
    });

    if (existingReport) {
      const userDescriptions = existingReport.descriptions || [];
      const userSubCategories = userDescriptions
        .map((d) => d.subCategory)
        .filter(Boolean);

      const predictedSubCategory = null; // sera ajouté plus tard par IA

      const alreadyReported = userSubCategories.includes(predictedSubCategory);

      if (alreadyReported) {
        return {
          isDuplicate: true,
          isNewDescription: false,
          status: 200,
          success: true,
          message: "Vous avez déjà signalé ce problème spécifique.",
          reportingId: existingReport.id,
        };
      }

      // ✅ Ajout d’une nouvelle description
      await ReportingDescription.create({
        reportingId: existingReport.id,
        userId,
        description,
        emoji: data.emojis,
        subCategory: predictedSubCategory,
      });

      process.nextTick(() => {
        updateSubCategories(existingReport.id);
      });

      return {
        isDuplicate: false,
        isNewDescription: true,
        status: 200,
        success: true,
        message: "Votre signalement a été ajouté au problème existant.",
        reportingId: existingReport.id,
      };
    }

    // 🆕 Création d’un nouveau signalement
    const newReporting = await Reporting.create({
      userId,
      siteUrl,
      domain,
      bugLocation,
      categories: data.categories,
      description,
      marque: data.marque,
      emojis: data.emojis,
      blocking: data.blocking,
      capture: data.capture,
      tips: data.tips,
      subCategory: null,
    });

    await ReportTimelineStep.create({
      reportId: newReporting.id,
      label: "Signalement transmis",
      status: "upcoming",
      date: newReporting.createdAt,
      message: "Votre signalement a été transmis à notre équipe.",
      createdBy: "user",
    });

    await ReportingUsers.create({
      reportingId: newReporting.id,
      userId,
    });

    await ReportingDescription.create({
      reportingId: newReporting.id,
      userId,
      description,
      emoji: data.emojis,
      subCategory: null,
    });

    console.log(
      "🔥 [IA] Appel updateSubCategories pour reportId:",
      newReporting.id
    );

    process.nextTick(() => {
      updateSubCategories(newReporting.id);
    });

    return {
      isDuplicate: false,
      isNewDescription: true,
      status: 201,
      success: true,
      message: "Nouveau signalement créé avec succès.",
      reportingId: newReporting.id,
    };
  }, */

  async createReporting(userId, data) {
    const { siteUrl, bugLocation, description } = data;

    const fullUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const parsedUrl = new URL(fullUrl);
    const domain = parsedUrl.hostname.replace(/^www\./, "");

    console.log(
      `🔍 Vérification du signalement sur: ${domain}, ${bugLocation}`
    );

    const existingReport = await Reporting.findOne({
      where: { domain, bugLocation },
      include: [
        {
          association: "descriptions",
          where: { userId },
          required: false,
          attributes: ["subCategory"],
        },
      ],
    });

    if (existingReport) {
      const userDescriptions = existingReport.descriptions || [];
      const userSubCategories = userDescriptions
        .map((d) => d.subCategory)
        .filter(Boolean);

      const predictedSubCategory = null; // sera enrichi par l’IA plus tard

      const alreadyReported = userSubCategories.includes(predictedSubCategory);

      if (alreadyReported) {
        return {
          isDuplicate: true,
          isNewDescription: false,
          status: 200,
          success: true,
          message: "Vous avez déjà signalé ce problème.", // 🔁 Message + clair
          reportingId: existingReport.id,
        };
      }

      await ReportingDescription.create({
        reportingId: existingReport.id,
        userId,
        description,
        emoji: data.emojis,
        subCategory: predictedSubCategory,
      });

      process.nextTick(() => {
        updateSubCategories(existingReport.id);
      });

      return {
        isDuplicate: null,
        isNewDescription: true,
        status: 200,
        success: true,
        message:
          "Ton signalement a bien été reçu. Analyse en cours pour le classer.",
        reportingId: existingReport.id,
      };
    }

    // 🆕 Création d’un nouveau signalement
    const newReporting = await Reporting.create({
      userId,
      siteUrl,
      domain,
      bugLocation,
      categories: data.categories,
      description,
      marque: data.marque,
      emojis: data.emojis,
      blocking: data.blocking,
      capture: data.capture,
      tips: data.tips,
      subCategory: null,
    });

    await ReportTimelineStep.create({
      reportId: newReporting.id,
      label: "Signalement transmis",
      status: "upcoming",
      date: newReporting.createdAt,
      message: "Votre signalement a été transmis à notre équipe.",
      createdBy: "user",
    });

    await ReportingUsers.create({
      reportingId: newReporting.id,
      userId,
    });

    await ReportingDescription.create({
      reportingId: newReporting.id,
      userId,
      description,
      emoji: data.emojis,
      subCategory: null,
    });

    console.log(
      "🔥 [IA] Appel updateSubCategories pour reportId:",
      newReporting.id
    );

    process.nextTick(() => {
      updateSubCategories(newReporting.id);
    });

    return {
      isDuplicate: false,
      isNewDescription: true,
      status: 201,
      success: true,
      message: "Nouveau signalement créé avec succès.",
      reportingId: newReporting.id,
    };
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

  getAllGroupedByCategory: async ({ page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;

    const { count, rows: reportings } = await Reporting.findAndCountAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: ReportingSubCategory,
          as: "subCategories",
          order: [["count", "DESC"]],
        },
      ],
    });

    const results = [];

    for (const report of reportings) {
      const category = report.categories?.[0] || "Autre";

      const formattedSubCategories = [];

      for (const sub of report.subCategories) {
        const matchingDescriptions = await ReportingDescription.findAll({
          where: {
            reportingId: report.id,
            subCategory: sub.subCategory,
          },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "pseudo", "avatar"],
            },
          ],
          order: [["createdAt", "ASC"]], // Pour que le premier signalement soit bien en premier
        });

        const descriptions = matchingDescriptions.map((desc, index) => ({
          description: desc.description,
          emoji: desc.emoji,
          createdAt: desc.createdAt,
          user: desc.user,
          capture: index === 0 ? report.capture || null : null, // ✅ Ajout uniquement pour le 1er signalement
        }));

        formattedSubCategories.push({
          subCategory: sub.subCategory,
          count: sub.count,
          descriptions,
        });
      }

      results.push({
        reportingId: report.id,
        category,
        marque: report.marque,
        totalCount: formattedSubCategories.reduce(
          (acc, sc) => acc + sc.count,
          0
        ),
        subCategories: formattedSubCategories,
      });
    }

    return {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalReports: count,
      results,
    };
  },
  getSubcategoryStructureForPage: async function (url) {
    const normalizedUrl = siteService.normalizeFullUrl(url);
    if (!normalizedUrl) return null;

    const parsed = new URL(normalizedUrl);
    const domain = parsed.hostname.replace(/^www\./, "");
    const { bugLocation, categories } =
      await siteService.extractBugLocationAndCategories(normalizedUrl);
    const brandName = await siteService.extractBrandName(normalizedUrl);

    const existingReports = await Reporting.findAll({
      where: { domain, bugLocation },
      include: [
        {
          model: ReportingSubCategory,
          as: "subCategories",
        },
      ],
    });

    const results = [];

    for (const category of categories) {
      const subCategoryMap = {};

      for (const report of existingReports) {
        if (!report.categories.includes(category)) continue;

        let hasAttachedCapture = false;

        for (const sub of report.subCategories) {
          if (!sub.subCategory) continue;

          const matchingDescriptions = await ReportingDescription.findAll({
            where: {
              reportingId: report.id,
              subCategory: sub.subCategory,
            },
            attributes: [
              "id",
              "reportingId",
              "emoji",
              "description",
              "subCategory",
              "createdAt",
            ],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "pseudo", "avatar"],
              },
            ],
            order: [["createdAt", "ASC"]],
          });

          if (!subCategoryMap[sub.subCategory]) {
            subCategoryMap[sub.subCategory] = {
              subCategory: sub.subCategory,
              count: 0,
              descriptions: [],
            };
          }

          subCategoryMap[sub.subCategory].count += matchingDescriptions.length;

          subCategoryMap[sub.subCategory].descriptions.push(
            ...matchingDescriptions.map((desc, index) => ({
              reportingId: desc.reportingId,
              description: desc.description,
              emoji: desc.emoji,
              createdAt: desc.createdAt,
              user: desc.user,
              capture:
                !hasAttachedCapture && index === 0
                  ? report.capture || null
                  : null,
            }))
          );

          if (!hasAttachedCapture && matchingDescriptions.length > 0) {
            hasAttachedCapture = true;
          }
        }
      }

      results.push({
        category,
        subCategories: Object.values(subCategoryMap),
      });
    }

    return {
      domain: parsed.hostname,
      bugLocation,
      brandName,
      reportingCount: existingReports.length, // ← pour backward compatibility
      reportingTotalCount: await ReportingDescription.count({
        where: {
          reportingId: existingReports.map((r) => r.id),
        },
      }), // ← ✅ nombre total de contributions utilisateurs
      results,
    };
  },
};
