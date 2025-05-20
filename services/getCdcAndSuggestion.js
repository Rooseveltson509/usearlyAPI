import db from "../models/index.js";
import { service as siteService } from "./siteService.js";

const { CoupDeCoeur, Suggestion, User, Like } = db;

export const getRecentCoupDeCoeurByUrl = async (url, userId = null) => {
  const normalizedUrl = siteService.normalizeFullUrl(url);
  if (!normalizedUrl) return null;

  const parsed = new URL(normalizedUrl);
  const siteUrl = parsed.hostname.replace(/^www\./, "");
  const brandName = await siteService.extractBrandName(normalizedUrl);

  const coups = await CoupDeCoeur.findAll({
    where: { siteUrl },
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

  // Récupère tous les likes pour ces coups de cœur
  const coupIds = coups.map((c) => c.id);
  const likes = await Like.findAll({
    where: {
      targetId: coupIds,
      targetType: "coupDeCoeur",
    },
  });

  // Regroupe les likes par targetId
  const likeMap = new Map();
  likes.forEach((like) => {
    const key = like.targetId;
    if (!likeMap.has(key)) likeMap.set(key, []);
    likeMap.get(key).push(like);
  });

  return {
    siteUrl,
    brandName,
    feedbacks: coups.map((c) => {
      const itemLikes = likeMap.get(c.id) || [];
      const votes = itemLikes.length;
      const userLiked =
        userId && itemLikes.some((like) => like.userId === userId);

      return {
        id: c.id,
        emoji: c.emoji,
        description: c.description,
        createdAt: c.createdAt,
        votes,
        userLiked,
        user: c.author
          ? {
              id: c.author.id,
              pseudo: c.author.pseudo,
              avatar: c.author.avatar,
            }
          : null,
      };
    }),
  };
};

export const getRecentSuggestionsByUrl = async (url, userId) => {
  const normalizedUrl = siteService.normalizeFullUrl(url);
  if (!normalizedUrl) return null;

  const parsed = new URL(normalizedUrl);
  const siteUrl = parsed.hostname.replace(/^www\./, "");
  const brandName = await siteService.extractBrandName(normalizedUrl);

  const suggestions = await Suggestion.findAll({
    where: { siteUrl },
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

  const suggestionIds = suggestions.map((s) => s.id);

  // ✅ Récupérer TOUS les likes liés à ces suggestions
  const likes = await Like.findAll({
    where: {
      targetId: suggestionIds,
      targetType: "suggestion",
    },
  });

  return {
    siteUrl,
    brandName,
    feedbacks: suggestions.map((s) => {
      const suggestionLikes = likes.filter((l) => l.targetId === s.id);
      const votes = suggestionLikes.length;
      const userLiked = suggestionLikes.some((l) => l.userId === userId);

      return {
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
        votes,
        userLiked,
      };
    }),
  };
};
