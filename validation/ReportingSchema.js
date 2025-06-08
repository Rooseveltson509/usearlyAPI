import Joi from "joi";

export const alertSchema = Joi.object({
  siteUrl: Joi.string().trim().required(),
  //marque: Joi.string().trim().required(),
  blocking: Joi.boolean().truthy("true").falsy("false").required(),
  //bugLocation: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  emojis: Joi.string().trim().required(),
  tips: Joi.string().optional().allow(null, ""), // Autorise null ou une chaîne vide
  capture: Joi.string().optional().allow(null, ""), // Idem pour capture si besoin
});
