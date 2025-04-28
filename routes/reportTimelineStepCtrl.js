import db from "../models/index.js";
const { ReportTimelineStep, Reporting, Marque } = db;
import { getBrandId, getUserId } from "../utils/jwtUtils.js"; // équivalent à getUserId mais pour la marque
import { statusMapping } from "../utils/statusMapping.js";

export const timeline = {
  createOrUpdateTimelineStep: async (req, res) => {
    try {
      const { reportId } = req.params;
      const brandId = getBrandId(req.headers["authorization"]);

      if (!brandId) {
        return res.status(401).json({ error: "Marque non authentifiée." });
      }

      const brandName = await Marque.findByPk(brandId);
      if (!brandName) {
        return res.status(403).json({ error: "Marque non trouvée." });
      }

      const report = await Reporting.findOne({
        where: { id: reportId, marque: brandName.name },
      });

      if (!report) {
        return res.status(404).json({ error: "Signalement non trouvé." });
      }

      const { status, date } = req.body;

      if (!status || !statusMapping[status]) {
        return res.status(400).json({ error: "Statut invalide ou manquant." });
      }

      const { label, message } = statusMapping[status];

      const existingStep = await ReportTimelineStep.findOne({
        where: { reportId, brandId },
      });

      if (!existingStep) {
        // Première création
        const newStep = await ReportTimelineStep.create({
          reportId,
          brandId,
          label,
          status,
          message,
          date: date || new Date(),
          createdBy: "brand",
        });

        return res.status(201).json({ success: true, data: newStep });
      }

      // Sinon on update
      existingStep.label = label;
      existingStep.status = status;
      existingStep.message = message;
      existingStep.updatedAt = new Date();

      await existingStep.save();

      return res.status(200).json({ success: true, data: existingStep });
    } catch (err) {
      console.error("❌ Erreur création/mise à jour étape :", err);
      return res.status(500).json({
        error: "Erreur serveur lors de la création ou mise à jour de l'étape.",
      });
    }
  },

  getTimelineSteps: async (req, res) => {
    try {
      const { reportId } = req.params;

      const userId = getUserId(req.headers["authorization"]);
      const brandId = getBrandId(req.headers["authorization"]);

      if (!userId && !brandId) {
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }

      // Vérifie juste que le signalement existe
      const report = await Reporting.findByPk(reportId);

      if (!report) {
        return res.status(404).json({ error: "Signalement introuvable." });
      }

      // 🚨 Optionnel : tu peux vérifier que le report est public, visible, ou validé
      // if (!report.isPublic) return res.status(403).json({ error: "Ce signalement est privé." });

      // Récupère les étapes de la timeline
      const steps = await db.ReportTimelineStep.findAll({
        where: { reportId },
        order: [["date", "ASC"]],
      });

      return res.status(200).json({ success: true, data: steps });
    } catch (err) {
      console.error("❌ Erreur récupération TimelineSteps :", err);
      return res.status(500).json({
        error: "Erreur serveur lors de la récupération des étapes.",
      });
    }
  },
};
