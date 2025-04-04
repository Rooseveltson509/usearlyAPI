import db from "../models/index.js";
import { updateSubCategories } from "../services/subCategoryService.js";
import dotenv from "dotenv";
dotenv.config();

const { Reporting, ReportingDescription, ReportingSubCategory } = db;

const enrichValidReports = async () => {
  try {
    const reports = await Reporting.findAll({
      where: {
        domain: { [db.Sequelize.Op.ne]: null },
        bugLocation: { [db.Sequelize.Op.ne]: null },
      },
    });

    let enrichedCount = 0;

    for (const report of reports) {
      const reportingId = report.id;

      // Vérifier s'il y a au moins une description
      const descriptions = await ReportingDescription.findAll({
        where: { reportingId },
      });

      if (!descriptions.length) continue;

      // Vérifier si des sous-catégories existent déjà
      const existingSub = await ReportingSubCategory.count({
        where: { reportingId },
      });

      if (existingSub > 0) continue;

      // 🔥 Mise à jour IA
      console.log(`🧠 Enrichissement du reporting ${reportingId}...`);
      await updateSubCategories(reportingId);
      enrichedCount++;
    }

    console.log(`✅ ${enrichedCount} reports enrichis avec succès.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur dans enrichValidReports:", err);
    process.exit(1);
  }
};

enrichValidReports();
