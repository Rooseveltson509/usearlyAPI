import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
const { ReportingDescription } = db;
import { getUserId } from "../utils/jwtUtils.js";

export const reportingDesc = {
  createReportingDescription: async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const userId = getUserId(authHeader);

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }

      const { reportingId, emoji, description, subCategory } = req.body;

      if (!reportingId || !emoji || !description) {
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      // Vérifier si l'utilisateur a déjà soumis cette description pour ce signalement
      const existing = await ReportingDescription.findOne({
        where: {
          reportingId,
          userId,
          subCategory,
          //description,
          //subCategory,
        },
      });

      if (existing) {
        return res.status(409).json({
          error: "Description déjà envoyée pour ce signalement.",
          isDuplicate: true,
        });
      }

      const newDescription = await ReportingDescription.create({
        reportingId,
        emoji,
        description,
        userId,
        subCategory,
      });

      return res.status(201).json({ success: true, data: newDescription });
    } catch (err) {
      console.error("❌ Erreur création ReportingDescription :", err);
      return res.status(500).json({
        error: "Erreur serveur lors de la création de la description.",
      });
    }
  },
};
