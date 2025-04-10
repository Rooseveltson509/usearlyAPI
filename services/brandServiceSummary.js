import db from "../models/index.js";
import { fn, col, where as sequelizeWhere } from "sequelize";

const { Reporting, CoupDeCoeur, Suggestion, Comment } = db;

export const getSummaryByBrand = async (marque) => {
  const whereClause = sequelizeWhere(
    fn("LOWER", col("marque")),
    fn("LOWER", marque)
  );

  const signalementsTotal = await Reporting.count({ where: whereClause });
  const coupsDeCoeurTotal = await CoupDeCoeur.count({ where: whereClause });
  const suggestionsTotal = await Suggestion.count({ where: whereClause });

  const enColere = await Reporting.count({
    where: {
      marque,
      emojis: "😡",
    },
  });

  const commentCountReports = await Comment.count({
    include: [
      {
        model: Reporting,
        as: "reporting",
        required: true,
        where: { marque },
      },
    ],
  });

  const commentCountSuggestions = await Comment.count({
    include: [
      {
        model: Suggestion,
        as: "suggestion",
        required: true,
        where: { marque },
      },
    ],
  });

  const commentCountCoupsDeCoeur = await Comment.count({
    include: [
      {
        model: CoupDeCoeur,
        as: "coupDeCoeur",
        required: true,
        where: { marque },
      },
    ],
  });

  const commentaires =
    commentCountReports + commentCountSuggestions + commentCountCoupsDeCoeur;

  return {
    signalementsTotal,
    coupsDeCoeurTotal,
    suggestionsTotal,
    enColere,
    commentaires,
  };
};
