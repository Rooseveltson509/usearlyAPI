import OpenAI from "openai";
//import stringSimilarity from "string-similarity";
import db from "../models/index.js";
const { ReportingDescription, ReportingSubCategory, Reporting, User } = db;
import { Op } from "sequelize";

// 🔐 clé API doit être dans .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Assurez-vous que votre clé API est définie dans vos variables d'environnement
});

/**
 * Analyse toutes les descriptions d’un signalement (ou la première si seule)
 * et génère des sous-catégories intelligentes via OpenAI.
 */
export const updateSubCategories = async (reportingId) => {
  try {
    console.log("🔥 updateSubCategories START pour:", reportingId);

    const report = await Reporting.findByPk(reportingId);
    if (!report) return console.warn("❌ Aucun reporting trouvé.");

    const descriptions = await ReportingDescription.findAll({
      where: { reportingId },
      order: [["createdAt", "ASC"]], // 🔁 Important pour avoir des indexes fiables
      attributes: ["id", "description"],
    });

    if (descriptions.length === 0)
      return console.warn("❌ Aucune description à analyser.");

    const texts = descriptions.map((d) => d.description).filter(Boolean);

    const prompt = `Tu es un assistant IA. Voici des descriptions de bugs liés à la zone : ${report.bugLocation}

${texts.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Analyse ces descriptions et regroupe-les par problème similaire.
Pour chaque groupe, donne une sous-catégorie représentative du type de problème.

Réponds au format JSON comme ceci :
[
  { "subCategory": "Nom du problème", "indexes": [1, 3] },
  { "subCategory": "Autre type de bug", "indexes": [2, 4] }
]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("❌ Pas de réponse IA");

    const groups = JSON.parse(content);
    if (!Array.isArray(groups)) throw new Error("❌ Format JSON incorrect");

    // 🔁 Préparer pour mise à jour des sous-catégories
    const existing = await ReportingSubCategory.findAll({
      where: { reportingId },
    });

    const existingMap = new Map();
    for (const entry of existing) {
      existingMap.set(entry.subCategory, entry);
    }

    const updatedIds = [];

    for (const group of groups) {
      const subCategory = group.subCategory.trim();
      const indexes = group.indexes;

      if (!Array.isArray(indexes) || indexes.length === 0) continue;

      const count = indexes.length;

      let entry;
      if (existingMap.has(subCategory)) {
        entry = existingMap.get(subCategory);
        await entry.update({ count });
      } else {
        entry = await ReportingSubCategory.create({
          reportingId,
          subCategory,
          count,
        });
      }
      updatedIds.push(entry.id);

      // 🔁 Mettre à jour chaque description avec sa sous-catégorie
      for (const i of indexes) {
        const index = i - 1; // ⚠️ OpenAI renvoie des indexes 1-based
        const desc = descriptions[index];
        if (desc) {
          await desc.update({ subCategory });
        }
      }
    }

    // 🔥 Supprimer les sous-catégories obsolètes
    await ReportingSubCategory.destroy({
      where: {
        reportingId,
        id: { [Op.notIn]: updatedIds },
      },
    });

    console.log("✅ Sous-catégories mises à jour + descriptions associées.");
  } catch (err) {
    console.error("❌ updateSubCategories error:", err);
  }
};

export const getSubCategoriesByReportingId = async (reportingId) => {
  try {
    // 1. Récupération du signalement principal
    const report = await Reporting.findByPk(reportingId);
    if (!report) return null;

    const category = report.categories?.[0] || "Non défini";

    // 2. Toutes les sous-catégories associées
    const reportingSubCategories = await ReportingSubCategory.findAll({
      where: { reportingId },
      order: [["count", "DESC"]],
    });

    // 3. Injection des descriptions dans chaque sous-catégorie
    for (const subCat of reportingSubCategories) {
      const matchingDescriptions = await ReportingDescription.findAll({
        where: {
          reportingId,
          subCategory: subCat.subCategory,
        },
        include: [
          {
            model: User,
            as: "user", // ⚠️ doit correspondre à ton alias d’association
            attributes: ["id", "pseudo", "avatar"],
          },
        ],
      });

      subCat.dataValues.descriptions = matchingDescriptions.map((desc) => ({
        description: desc.description,
        user: desc.user,
      }));
    }

    // 4. Résultat final structuré
    return {
      reportingId,
      category,
      totalCount: reportingSubCategories.reduce((sum, sc) => sum + sc.count, 0),
      subCategories: reportingSubCategories,
    };
  } catch (err) {
    console.error("❌ Erreur dans getSubCategories:", err);
    throw err;
  }
};
