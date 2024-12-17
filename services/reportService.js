import db from "../models/index.js";
import stringSimilarity from "string-similarity";
const { Reporting, ReportingDescription, Category } = db;
import { service } from "../services/siteService.js";
import dotenv from "dotenv";

dotenv.config();

// Variables globales pour la comparaison de similarité
const similarityThreshold = process.env.SIMILARITY_THRESHOLD || 0.7;

export const reportService = {
  async validateUser(userId) {
    const user = await db.User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("Utilisateur non trouvé ou accès refusé.");
    }
    return user;
  },

  async findSimilarReporting(siteUrl, bugLocation, description) {
    const similarReportings = await Reporting.findAll({
      where: { siteUrl, bugLocation },
    });

    for (const reporting of similarReportings) {
      const similarity = stringSimilarity.compareTwoStrings(
        description,
        reporting.description
      );
      if (similarity > similarityThreshold) {
        // 70% de similarité
        return reporting;
      }
    }

    return null;
  },

  async checkExistingDescription(reportingId, userId, description) {
    const existingDescriptions = await ReportingDescription.findAll({
      where: { reportingId, userId },
    });

    for (const existingDescription of existingDescriptions) {
      const similarity = stringSimilarity.compareTwoStrings(
        description,
        existingDescription.description
      );
      if (similarity > similarityThreshold) {
        return true;
      }
    }

    return false;
  },

  async createReporting(userId, data, categories, siteTypeId) {
    let bugLocation = data.bugLocation; // Valeur par défaut

    // Si une capture est fournie, extraire le texte et déterminer bugLocation
    if (data.capture) {
      try {
        console.log("Extraction de texte depuis l’image...");
        const extractedLocation = await service.extractTextFromImage(
          data.capture
        );

        if (extractedLocation) {
          console.log(
            "Emplacement détecté depuis la capture :",
            extractedLocation
          );
          bugLocation = extractedLocation; // Met à jour bugLocation avec la valeur extraite
        } else {
          console.warn(
            "Aucune correspondance trouvée pour bugLocation à partir de la capture."
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de l’extraction de texte depuis la capture :",
          error
        );
        // On garde la valeur initiale de bugLocation en cas d'erreur
      }
    }

    // Créer un nouveau reporting avec le bugLocation (mis à jour ou inchangé)
    const newReporting = await Reporting.create({
      userId,
      marque: data.marque,
      siteUrl: data.siteUrl,
      blocking: data.blocking,
      description: data.description,
      bugLocation, // Utilise la valeur mise à jour ou inchangée
      emojis: data.emojis,
      capture: data.capture,
      tips: data.tips,
    });

    // Associer des catégories au reporting
    const categoryInstances = await Promise.all(
      categories.map(async (categoryName) => {
        const [category] = await Category.findOrCreate({
          where: { name: categoryName },
          defaults: { name: categoryName, siteTypeId },
        });
        return category;
      })
    );

    await newReporting.addCategories(categoryInstances);

    // Ajouter une description associée au reporting
    await ReportingDescription.create({
      reportingId: newReporting.id,
      userId,
      description: data.description,
    });

    return newReporting;
  },
  /*  async createReporting(userId, data, categories, siteTypeId) {
    const newReporting = await Reporting.create({
      userId,
      marque: data.marque,
      siteUrl: data.siteUrl,
      blocking: data.blocking,
      description: data.description,
      bugLocation: data.bugLocation,
      emojis: data.emojis,
      capture: data.capture,
      tips: data.tips,
    });

    const categoryInstances = await Promise.all(
      categories.map(async (categoryName) => {
        const [category] = await Category.findOrCreate({
          where: { name: categoryName },
          defaults: { name: categoryName, siteTypeId },
        });
        return category;
      })
    );

    await newReporting.addCategories(categoryInstances);

    await ReportingDescription.create({
      reportingId: newReporting.id,
      userId,
      description: data.description,
    });

    return newReporting;
  }, */
};
