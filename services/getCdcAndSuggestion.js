import db from "../models/index.js";
import { service as siteService } from "./siteService.js";

const { CoupDeCoeur, Suggestion, User } = db;

export const getRecentCoupDeCoeurByUrl = async (url) => {
  const normalizedUrl = siteService.normalizeFullUrl(url);
  if (!normalizedUrl) return null;

  const parsed = new URL(normalizedUrl);
  const siteUrl = parsed.hostname.replace(/^www\./, "");
  const brandName = await siteService.extractBrandName(normalizedUrl);

  const coups = await CoupDeCoeur.findAll({
    where: {
      siteUrl,
    },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "pseudo", "avatar"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 3,
  });

  return {
    siteUrl,
    brandName,
    feedbacks: coups.map((c) => ({
      id: c.id,
      emoji: c.emoji,
      description: c.description,
      createdAt: c.createdAt,
      user: c.author
        ? {
            id: c.author.id,
            pseudo: c.author.pseudo,
            avatar: c.author.avatar,
          }
        : null,
    })),
  };
};

export const getRecentSuggestionsByUrl = async (url) => {
  const normalizedUrl = siteService.normalizeFullUrl(url);
  if (!normalizedUrl) return null;

  const parsed = new URL(normalizedUrl);
  const siteUrl = parsed.hostname.replace(/^www\./, "");
  const brandName = await siteService.extractBrandName(normalizedUrl);

  const suggestions = await Suggestion.findAll({
    where: {
      siteUrl,
    },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "pseudo", "avatar"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 3,
  });

  return {
    siteUrl,
    brandName,
    feedbacks: suggestions.map((s) => ({
      id: s.id,
      emoji: s.emoji,
      description: s.description,
      createdAt: s.createdAt,
      user: s.author
        ? {
            id: s.author.id,
            pseudo: s.author.pseudo,
            avatar: s.author.avatar,
          }
        : null,
    })),
  };
};
