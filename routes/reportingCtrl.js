import db from '../models/index.js'; // Import du fichier contenant les modèles Sequelize
import { getUserId } from '../utils/jwtUtils.js';
// Récupération des modèles nécessaires
const { User, Category, SiteType, Reporting } = db;
import { alertSchema } from '../validation/ReportingSchema.js';
import { service } from '../services/siteService.js';

export const reporting = {
  // Créer un rapport
  createAlertz: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "missing parameters... " });
      }

      // Validation des données
      const { error } = alertSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { marque, siteUrl, blocking, bugLocation, description, emojis, tips, capture } = req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "ACCESS DENIED." });
      }

      // Étape 1: Récupérer les métadonnées du site
      const siteMetadata = await service.getSiteMetadata(siteUrl);


      // Étape 2: Charger les catégories et types de sites existants depuis la BDD
      const existingCategories = await Category.findAll({ attributes: ['name'] });
      const existingSiteTypes = await SiteType.findAll({ attributes: ['name'] });

      const categoryNames = existingCategories.map(cat => cat.name);
      const siteTypeNames = existingSiteTypes.map(st => st.name);


      console.log("Données envoyées à OpenAI :");
      console.log("Description :", description);
      console.log("Titre du site :", siteMetadata.title);
      console.log("Description du site :", siteMetadata.description);
      console.log("Types de sites disponibles :", siteTypeNames);
      console.log("Catégories de bugs disponibles :", categoryNames);
      //console.log("Prompt complet :", prompt);

      // Étape 3: Appeler OpenAI pour déterminer les catégories et le type de site
      const { siteType, categories } = await service.getCategoriesAndSiteType(
        description,
        siteMetadata,
        categoryNames,
        siteTypeNames
      );
      if (categories.length === 0) {
        console.warn("OpenAI n'a pas retourné de catégories valides. Utilisation de valeurs par défaut.");
        categories.push('Autre'); // Ajouter une valeur par défaut si nécessaire
      }
      // Étape 4: Trouver ou créer le siteTypeId correspondant
      let siteTypeId = null;
      if (siteType) {
        const matchedSiteType = await SiteType.findOne({ where: { name: siteType } });
        if (matchedSiteType) {
          siteTypeId = matchedSiteType.id;
        } else {
          // Si aucun SiteType correspondant, vous pouvez en créer un
          const newSiteType = await SiteType.create({ name: siteType });
          siteTypeId = newSiteType.id;
        }
      }

      // Étape 5: Créer le Reporting
      const reporting = await Reporting.create({
        userId: userFound.id,
        marque,
        siteUrl,
        //siteTypeId, // Inclure le type de site suggéré
        blocking,
        description,
        bugLocation,
        emojis,
        capture,
        tips,
      });

      // Étape 6: Associer les catégories proposées au Reporting
      const categoryInstances = await Category.findAll({
        where: { name: categories },
      });

      await reporting.addCategories(categoryInstances);

      // Étape 7: Renvoyer les catégories proposées à l'utilisateur
      return res.status(201).json({
        success: true,
        message: "Signalement créé avec succès.",
        reportingId: reporting.id,
        suggestedCategories: categories,
      });

    } catch (err) {
      console.error("Erreur lors de la création du signalement :", err);
      return res.status(500).json({ error: "An error occurred", details: err.message });
    }
  },

  createAlert: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "missing parameters... " });
      }

      // Validation des données
      const { error } = alertSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { marque, siteUrl, blocking, bugLocation, description, emojis, tips, capture } = req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "ACCESS DENIED." });
      }

      // Charger les catégories et types de sites existants depuis la BDD
      const existingCategories = await Category.findAll({ attributes: ["name"] });
      const existingSiteTypes = await SiteType.findAll({ attributes: ["name"] });

      const categoryNames = existingCategories.map((cat) => cat.name);
      const siteTypeNames = existingSiteTypes.map((st) => st.name);

      const siteMetadata = await service.getSiteMetadata(siteUrl);

      // Récupérer les catégories générées par OpenAI
      const { siteType, categories: generatedCategories } = await service.getCategoriesAndSiteType(
        description,
        siteMetadata,
        categoryNames,
        siteTypeNames
      );

      if (!generatedCategories || generatedCategories.length === 0) {
        return res.status(500).json({
          error: "Impossible de générer des catégories pertinentes à partir de la description.",
        });
      }

      // Extraire le texte de la capture d'écran pour aider à définir bugLocation
      let extractedBugLocation = bugLocation; // Par défaut, utilisez la valeur transmise
      if (capture) {
        console.log("Analyse de la capture :", capture);
        extractedBugLocation = await service.extractTextFromImage(capture);

        // Si le texte extrait contient des mots-clés spécifiques, vous pouvez les utiliser pour déterminer l'emplacement
        if (extractedBugLocation.includes('panier')) {
          extractedBugLocation = 'panier';
        } else if (extractedBugLocation.includes('connexion') || extractedBugLocation.includes('inscription')) {
          extractedBugLocation = 'page connexion/inscription';
        } else if (!extractedBugLocation.trim()) {
          extractedBugLocation = 'emplacement inconnu';
        }
      }

      // Trouver ou créer le siteTypeId correspondant
      let siteTypeId = null;
      if (siteType) {
        const matchedSiteType = await SiteType.findOne({ where: { name: siteType } });
        if (matchedSiteType) {
          siteTypeId = matchedSiteType.id;
        } else {
          const newSiteType = await SiteType.create({ name: siteType });
          siteTypeId = newSiteType.id;
        }
      }

      // Créer le Reporting
      const newReporting = await Reporting.create({
        userId: userFound.id,
        marque,
        siteUrl,
        blocking,
        description,
        bugLocation: extractedBugLocation,
        emojis,
        capture,
        tips,
      });

      // Associer les catégories générées au Reporting
      const categoryInstances = [];
      for (const categoryName of generatedCategories) {
        const [category] = await Category.findOrCreate({
          where: { name: categoryName },
          defaults: { name: categoryName, siteTypeId },
        });
        categoryInstances.push(category);
      }

      // Ajout des catégories dans la table d'association
      await newReporting.addCategories(categoryInstances);

      // Répondre avec le Reporting créé et les catégories associées
      return res.status(201).json({
        success: true,
        message: "Signalement créé avec succès.",
        reporting: newReporting,
        categories: generatedCategories,
      });
    } catch (error) {
      console.error("Erreur lors de la création du signalement :", error);
      return res.status(500).json({
        error: "Une erreur est survenue lors de la création du signalement.",
      });
    }
  },

  updateCategory: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "missing parameters... " });
      }
      const { reportingId, category } = req.body;

      // Validation des paramètres
      if (!reportingId || !category) {
        return res.status(400).json({ error: "Missing reportingId or category." });
      }

      // Vérifier si le signalement existe
      const reporting = await Reporting.findOne({ where: { id: reportingId } });
      if (!reporting) {
        return res.status(404).json({ error: "Reporting not found." });
      }

      // Vérifier si la catégorie choisie est valide
      const validCategories = [
        "Problème de lisibilité",
        "Problème de qualité des images",
        "Problème de navigation",
        "Problème d'ergonomie",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category selected." });
      }

      // Mettre à jour la catégorie du signalement
      const [categoryInstance] = await Category.findOrCreate({
        where: { name: category },
        defaults: { name: category, siteTypeId: null }, // Ajustez siteTypeId si nécessaire
      });

      // Ajouter la relation entre Reporting et la catégorie choisie
      await reporting.addCategory(categoryInstance);

      return res.status(200).json({
        success: true,
        message: "La catégorie a été mise à jour avec succès.",
        updatedReporting: reporting,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la catégorie :", error);
      return res.status(500).json({ error: "An error occurred.", details: error.message });
    }
  },

  // Find User Reportings By store
  getAllReports: async function (req, res) {
    // Getting auth header
    const headerAuth = req.headers["authorization"];
    const userId = getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    try {
      const user = await User.findOne({ where: { id: userId, role: "admin" } });
      if (!user) {
        return res.status(404).json({ error: "Accès non autorisé....." });
      }

      const reports = await Reporting.findAll({
        attributes: ["id", "idUSERS", "marque", "bugLocation", "emojis", "description", "blocking", "tips"],
        include: {
          model: User,
          attributes: ["pseudo", "email"],
        },
      });

      if (reports) {
        return res.status(200).json(reports);
      } else {
        return res.status(404).json({ error: "Report not found." });
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      return res.status(500).json({ error: "cannot fetch reports..." });
    }
  },

  updateAlert: async function (req, res) {
    try {
      // Récupérer l'utilisateur à partir du header d'authentification
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      const { category } = req.body;

      if (!category) {
        return res.status(400).json({ error: "Paramètre catégorie manquant." });
      }

      // Liste des catégories valides
      const validCategories = ["cat1", "cat2", "cat3", "autre"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Valeur de catégorie non valide." });
      }

      // Vérifier l'utilisateur
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }

      // Trouver la dernière alerte de cet utilisateur (vous pouvez affiner ce critère si nécessaire)
      const lastAlert = await Reporting.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]], // Trier pour obtenir la plus récente
      });

      if (!lastAlert) {
        return res.status(404).json({ error: "Aucune alerte trouvée pour cet utilisateur." });
      }

      // Mettre à jour la catégorie de l'alerte
      lastAlert.category = category;
      await lastAlert.save();

      return res.status(200).json({
        success: true,
        message: "Catégorie mise à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la catégorie :", error);
      return res.status(500).json({ error: "Erreur interne.", details: error.message });
    }
  },
};