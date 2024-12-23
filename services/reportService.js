import db from "../models/index.js";
const { Reporting, ReportingDescription, Category } = db;
import { service } from "../services/siteService.js";
import dotenv from "dotenv";

dotenv.config();

// Variables globales pour la comparaison de similarité
const similarityThreshold = process.env.SIMILARITY_THRESHOLD || 0.7;

export const reportService = {
  async findSimilarReporting(siteUrl, bugLocation, description) {
    // Normalisation des données
    const normalizedSiteUrl = siteUrl.trim().toLowerCase();
    const normalizedBugLocation = bugLocation.trim().toLowerCase();
    const normalizedDescription = description.trim().toLowerCase();

    const similarReportings = await Reporting.findAll({
      where: {
        siteUrl: normalizedSiteUrl,
        bugLocation: normalizedBugLocation,
      },
    });
    console.log("Requête reçue :");
    console.log("siteUrl :", siteUrl);
    console.log("bugLocation :", bugLocation);
    console.log("description :", description);
    for (const reporting of similarReportings) {
      console.log("Comparaison avec signalement :", reporting.id);
      console.log("siteUrl attendu :", reporting.siteUrl);
      console.log("bugLocation attendu :", reporting.bugLocation);
      console.log("description attendue :", reporting.description);
      const similarity = await service.compareDescriptions(
        normalizedDescription,
        reporting.description.trim().toLowerCase() // Normalisation pour la comparaison
      );
      console.log("Similarité calculée :", similarity);
      if (similarity >= similarityThreshold) {
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
      const similarity = await service.compareDescriptions(
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
    let bugLocation = data.bugLocation;

    // Extraction du texte depuis une capture, si fourni
    if (data.capture) {
      try {
        console.log("Extraction de texte depuis l’image...");
        const extractedLocation = await service.extractTextFromImage(
          data.capture
        );

        if (extractedLocation) {
          bugLocation = await service.determineBugLocation(extractedLocation);
        } else {
          console.warn("Aucune correspondance trouvée pour bugLocation.");
        }
      } catch (error) {
        console.error(
          "Erreur lors de l’extraction de texte depuis la capture :",
          error
        );
      }
    }

    // Vérification de doublon
    const duplicate = await this.findSimilarReporting(
      data.siteUrl,
      bugLocation,
      data.description
    );

    if (duplicate) {
      console.log(
        "Signalement en doublon détecté pour le site " + data.siteUrl
      );
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

    // Création d’un nouveau signalement s’il n’y a pas de doublon
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
    });

    // Ajout des catégories
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
  async validateUser(userId) {
    const user = await db.User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("Utilisateur non trouvé ou accès refusé.");
    }
    return user;
  },
};
