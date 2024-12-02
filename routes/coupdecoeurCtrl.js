/* let jwtUtils = require("../utils/jwtUtils");
let models = require("../models");
const Sequelize = require("sequelize");
const { coupDeCoeurSchema } = require("../validation/CoupdeCoeurSchema");
const Op = Sequelize.Op; */
import db from '../models/index.js'; // Import du fichier contenant les modèles Sequelize
import { coupDeCoeurSchema } from '../validation/CoupdeCoeurSchema.js';
const {CoupDeCoeur } = db;
import { getUserId } from '../utils/jwtUtils.js';




export const coupDeCoeur = {
    createCoupdeCoeur: async function (req, res) {
      try {
        const headerAuth = req.headers["authorization"];
        const userId = getUserId(headerAuth);
  
        if (userId <= 0) {
          return res.status(400).json({ error: "Missing parameters." });
        }
  
        // Validation des données avec Joi
        const { error } = coupDeCoeurSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
  
        const { marque, description, emplacement, emoji, validated, likes, dislikes } = req.body;
  
        // Vérifier si l'utilisateur existe
        const userFound = await models.User.findOne({ where: { id: userId } });
        if (!userFound) {
          return res.status(403).json({ error: "Access denied." });
        }
  
        // Créer un nouveau coup de coeur
        const coupDeCoeur = await CoupDeCoeur.create({
          userId: userFound.id,
          marque,
          description,
          emplacement,
          emoji,
          validated,
          likes,
          dislikes,
        });
  
        return res.status(201).json({
          success: true,
          message: "Coup de coeur créé avec succès.",
          coupDeCoeurId: coupDeCoeur.id,
        });
      } catch (err) {
        console.error("Erreur lors de la création du coup de coeur :", err);
        return res.status(500).json({ error: "An error occurred", details: err.message });
      }
    },
  };
  