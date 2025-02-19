import db from "../models/index.js";
const { Reporting, ReportingDescription, Category } = db;
import { service } from "../services/siteService.js";
import dotenv from "dotenv";

dotenv.config();

// Variables globales pour la comparaison de similarité
const similarityThreshold = process.env.SIMILARITY_THRESHOLD || 0.7;

export const reportService = {
  /*   getCategories: async function () {
    if (!cachedCategories) {
      console.log("Fetching categories from database...");
      cachedCategories = await Category.findAll({ attributes: ["name"] });
    }
    return cachedCategories;
  }, */
  async findSimilarReporting(siteUrl, bugLocation, description) {
    // Normalisation des données
    const normalizedSiteUrl = siteUrl.trim().toLowerCase();
    const normalizedBugLocation = bugLocation.trim().toLowerCase();
    const normalizedDescription = description.trim().toLowerCase();

    let offset = 0;
    const limit = 50; // Nombre de résultats par requête
    let duplicate = null;

    while (true) {
      // Recherche paginée
      const similarReportings = await Reporting.findAll({
        where: {
          siteUrl: normalizedSiteUrl,
          bugLocation: normalizedBugLocation,
          description: normalizedDescription,
        },
        limit,
        offset,
      });

      console.log(
        `Recherche paginée - Offset: ${offset}, Résultats récupérés: ${similarReportings.length}`
      );

      // Parcourir les résultats récupérés
      for (const reporting of similarReportings) {
        const similarity = await service.compareDescriptions(
          normalizedDescription,
          reporting.description.trim().toLowerCase() // Normalisation pour la comparaison
        );
        console.log("Similarité calculée :", similarity);

        if (similarity >= similarityThreshold) {
          // Si une similarité suffisante est trouvée
          duplicate = reporting;
          break;
        }
      }

      // Si un doublon est trouvé ou qu'il n'y a plus de résultats, arrêter la boucle
      if (duplicate || similarReportings.length < limit) {
        break;
      }

      // Passer à la page suivante
      offset += limit;
    }

    // Retourner le doublon trouvé ou null
    return duplicate;
  },

  /**
   * Vérifie si une description similaire existe déjà pour un signalement donné.
   *
   * @param {number} reportingId - ID du signalement.
   * @param {number} userId - ID de l'utilisateur.
   * @param {string} description - La description à vérifier.
   */
  async checkExistingDescription(reportingId, userId, description) {
    const existingDescriptions = await ReportingDescription.findAll({
      where: { reportingId, userId },
    });

    for (const existingDescription of existingDescriptions) {
      const similarity = await service.compareDescriptions(
        description,
        existingDescription.description
      );
      console.log("Similarité avec description déjà existante :", similarity);
      if (similarity > similarityThreshold) {
        return true;
      }
    }

    return false;
  },

  async createReporting(userId, data, categories, siteTypeId) {
    let bugLocation = data.bugLocation;

    // Extraction de texte depuis une image (décalée en tâche asynchrone si nécessaire)
    if (data.capture) {
      console.log("Extraction de texte depuis l’image...");
      try {
        const extractedLocation = await service.extractTextFromImage(
          data.capture
        );

        if (extractedLocation) {
          bugLocation = await service.determineBugLocation(extractedLocation);
        }
      } catch (error) {
        console.error("Erreur lors de l’extraction de texte :", error);
      }
    }

    // Vérification de doublon rapide avant traitements lourds
    const duplicate = await this.findSimilarReporting(
      data.siteUrl,
      bugLocation,
      data.description
    );

    if (duplicate) {
      const isDuplicateDescription = await this.checkExistingDescription(
        duplicate.id,
        userId,
        data.description
      );

      if (isDuplicateDescription) {
        return {
          isDuplicate: true,
          status: 200,
          success: true,
          message: `Un problème similaire a déjà été signalé. Vous êtes la ${
            duplicate.ReportingDescriptions?.length || 1
          }ᵉ personne à signaler ce problème.`,
          reportingId: duplicate.id,
          totalReports: duplicate.ReportingDescriptions?.length || 1,
        };
      }
    }

    // Création d’un nouveau signalement
    const newReporting = await Reporting.create({
      userId,
      marque: data.marque,
      siteUrl: data.siteUrl,
      blocking: data.blocking,
      description: data.description,
      bugLocation,
      emojis: data.emojis,
      capture: data.capture,
      tips: data.tips,
      reactions: [], // ✅ Initialisation des réactions
    });

    // Chargement ou création des catégories (en mémoire pour minimiser les appels DB)
    const categoryInstances = await this.findOrCreateCategories(
      categories,
      siteTypeId
    );

    await newReporting.addCategories(categoryInstances);

    // Ajout de la description associée
    await ReportingDescription.create({
      reportingId: newReporting.id,
      userId,
      description: data.description,
    });

    return {
      isDuplicate: false,
      status: 201,
      success: true,
      message: "Signalement créé avec succès.",
      reporting: newReporting,
      categories,
    };
  },

  async findOrCreateCategories(categories, siteTypeId) {
    const existingCategories = await Category.findAll({
      where: { name: categories },
      attributes: ["id", "name"],
    });

    const existingCategoryNames = existingCategories.map((cat) => cat.name);

    // Créer seulement les catégories qui n'existent pas déjà
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

  async validateUser(userId) {
    const user = await db.User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("Utilisateur non trouvé ou accès refusé.");
    }
    return user;
  },
};
