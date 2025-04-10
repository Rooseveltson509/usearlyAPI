import db from "../models/index.js";
const { Reporting, CoupDeCoeur, Suggestion, User } = db;
import dotenv from "dotenv";
import { Op, fn, col, literal, where as sequelizeWhere } from "sequelize";

dotenv.config();
const getLastNDays = (days) => {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

export const getStatsByBrand = async (name, days = 7) => {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const getCountsByModel = async (Model, label) => {
    const results = await Model.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", "*"), label],
      ],
      where: {
        [Op.and]: [
          sequelizeWhere(fn("LOWER", col("marque")), fn("LOWER", name)),
          {
            createdAt: {
              [Op.gte]: dateThreshold,
            },
          },
        ],
      },
      group: [literal("DATE(createdAt)")],
      raw: true,
    });

    return results.reduce((acc, curr) => {
      const date = curr.date;
      if (!acc[date]) {
        acc[date] = { date, signalements: 0, coupsDeCoeur: 0, suggestions: 0 };
      }
      acc[date][label] = parseInt(curr[label], 10);
      return acc;
    }, {});
  };

  const r = await getCountsByModel(Reporting, "signalements");
  const c = await getCountsByModel(CoupDeCoeur, "coupsDeCoeur");
  const s = await getCountsByModel(Suggestion, "suggestions");

  const merged = {};
  [...Object.entries(r), ...Object.entries(c), ...Object.entries(s)].forEach(
    ([date, values]) => {
      if (!merged[date]) {
        merged[date] = {
          date,
          signalements: 0,
          coupsDeCoeur: 0,
          suggestions: 0,
        };
      }
      merged[date] = {
        ...merged[date],
        signalements:
          (merged[date].signalements || 0) + (values.signalements || 0),
        coupsDeCoeur:
          (merged[date].coupsDeCoeur || 0) + (values.coupsDeCoeur || 0),
        suggestions:
          (merged[date].suggestions || 0) + (values.suggestions || 0),
      };
    }
  );

  const fullDates = getLastNDays(days);
  const result = fullDates.map((date) =>
    merged[date]
      ? merged[date]
      : { date, signalements: 0, coupsDeCoeur: 0, suggestions: 0 }
  );

  return result;
};

export const getLatestReportsByBrand = async (marque) => {
  const results = await Reporting.findAll({
    where: { marque },
    order: [["createdAt", "DESC"]],
    limit: 3,
    attributes: ["emojis", "description"],
    raw: true,
  });

  return results.map((r) => ({
    emoji: r.emojis,
    description: r.description,
  }));
};

export const getLatestFeedbacksByType = async (marque, type) => {
  let Model;
  let defaultEmoji;
  let emojiField;

  switch (type) {
    case "reporting":
      Model = Reporting;
      emojiField = "emojis"; // Pluriel dans Reporting
      break;
    case "coupdecoeur":
      Model = CoupDeCoeur;
      emojiField = "emoji"; // Singulier ici
      defaultEmoji = "❤️";
      break;
    case "suggestion":
      Model = Suggestion;
      emojiField = "emoji"; // Singulier ici aussi
      defaultEmoji = "💡";
      break;
    default:
      throw new Error("Type de feedback invalide");
  }

  const results = await Model.findAll({
    where: { marque },
    order: [["createdAt", "DESC"]],
    limit: 3,
    attributes: [emojiField, "description", "createdAt"],
    include: {
      model: User,
      as: "author",
      attributes: ["pseudo", "avatar"],
    },
    raw: true,
  });

  return results.map((item) => ({
    emoji: item[emojiField] || defaultEmoji,
    description: item.description,
    user: {
      pseudo: item["author.pseudo"],
      avatar: item["author.avatar"],
    },
  }));
};

export const getTopReportByBrand = async (marque) => {
  const results = await Reporting.findAll({
    where: { marque },
    attributes: ["description", [fn("COUNT", col("description")), "count"]],
    group: ["description"],
    order: [[literal("count"), "DESC"]],
    limit: 1,
    raw: true,
  });

  if (!results.length) return null;

  return {
    description: results[0].description,
    count: results[0].count,
  };
};
