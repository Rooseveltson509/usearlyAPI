import Joi from "joi";

export const postSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  content: Joi.string().min(10).required(),
  marqueId: Joi.string().uuid().required(), // ✅ Vérifie que `marqueId` est bien attendu
});
