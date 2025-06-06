import Joi from "joi";

export const suggestionSchema = Joi.object({
  siteUrl: Joi.string().trim().required(),
  emoji: Joi.string().trim().required(),
  //marque: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  //emplacement: Joi.string().trim().required(),
  validated: Joi.boolean().default(false),
  likes: Joi.number().integer().min(0).default(0), // Likes non négatifs
  dislikes: Joi.number().integer().min(0).default(0), // DisLikes non négatifs
  capture: Joi.string().optional().allow(null, ""), // Idem pour capture si besoin
});
