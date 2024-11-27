
let jwtUtils = require("../utils/jwt.utils");
let models = require("../models");
const Sequelize = require("sequelize");
const { suggestionSchema } = require("../validation/SuggestionSchema");
const Op = Sequelize.Op;


  
module.exports = {
    createSuggestion: async function (req, res) {
      try {
        const headerAuth = req.headers["authorization"];
        const userId = jwtUtils.getUserId(headerAuth);
  
        if (userId <= 0) {
          return res.status(400).json({ error: "Missing parameters." });
        }
  
        // Validation des données avec Joi
        const { error } = suggestionSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
  
        const { marque, description, emplacement, likes, dislikes } = req.body;
  
        // Vérifier si l'utilisateur existe
        const userFound = await models.User.findOne({ where: { id: userId } });
        if (!userFound) {
          return res.status(403).json({ error: "Access denied." });
        }
  
        // Créer une nouvelle suggestion
        const suggestion = await models.Suggestion.create({
          userId: userFound.id,
          marque,
          emplacement,
          description,
          likes,
          dislikes,
        });
  
        return res.status(201).json({
          success: true,
          message: "Suggestion créée avec succès.",
          suggestionId: suggestion.id,
        });
      } catch (err) {
        console.error("Erreur lors de la création de la suggestion :", err);
        return res.status(500).json({ error: "An error occurred", details: err.message });
      }
    },
  };
  