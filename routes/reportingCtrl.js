require("dotenv").config();let bcrypt = require("bcryptjs");
let jwtUtils = require("../utils/jwt.utils");
let models = require("../models");
const Joi = require("joi"); // Et cette ligne
const Sequelize = require("sequelize");
const Op = Sequelize.Op;



const alertSchema = Joi.object({
  marque: Joi.string().trim().required(),
  blocking: Joi.string().valid("yes", "no").required(),
  bugLocation: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  emojis: Joi.string().trim().required(),
  tips: Joi.string().optional().allow(null, ''), // Autorise null ou une chaîne vide
  capture: Joi.string().optional().allow(null, ''), // Idem pour capture si besoin
});


module.exports = {

  createAlert: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = jwtUtils.getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "missing parameters... " });
      }

      // Validation des données
      const { error } = alertSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { marque, blocking, bugLocation, description, emojis, tips, capture } = req.body;

      // Vérifier si l'utilisateur existe
      const userFound = await models.User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(403).json({ error: "ACCESS DENIED." });
      }

      // Créer un nouveau signalement
      const alert = await models.Reporting.create({
        userId: userFound.id,
        marque,
        blocking,
        description,
        bugLocation,
        emojis,
        capture,
        tips,
      });

      return res.status(201).json({
        success: true,
        message: "Signalement créé avec succès.",
        alertId: alert.id,
      });
    } catch (err) {
      console.error("Erreur lors de la création du signalement :", err);
      return res.status(500).json({ error: "An error occurred", details: err.message });
    }

  },

  // Find User Ticket By code
  getTicketByCode: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var code = req.params.code;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.Employe.findOne({
      where: { id: userId },
    })
      .then(function (employe) {
        if (employe) {
          models.Ticket.findOne({
            attributes: ["userId", "gain", "etat", "code"],
            where: { code: code },
            include: [
              {
                model: models.User,
                attributes: [
                  "id",
                  "first_name",
                  "last_name",
                  "email",
                  "city",
                  "address",
                  "zipCode",
                ],
              },
            ],
          })
            .then(function (ticket) {
              if (ticket) {
                return res.status(200).json(ticket);
              } else {
                return res.status(404).json({ error: "Ticket not found" });
              }
            })
            .catch(function (err) {
              res.status(404).json({ error: "cannot fetch Ticket." });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },

  // Find User Ticket By store
  getAllTicketsByStore: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var store = req.params.store;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.Employe.findOne({
      where: { id: userId },
    })
      .then(function (employe) {
        if (employe) {
          models.Ticket.findAll({
            attributes: ["userId", "gain", "etat", "magasin"],
            where: { magasin: store },
            include: [
              {
                model: models.User,
                attributes: [
                  "id",
                  "first_name",
                  "last_name",
                  "email",
                  "city",
                  "address",
                  "zipCode",
                ],
              },
            ],
          })
            .then(function (ticket) {
              if (ticket) {
                return res.status(200).json(ticket);
              } else {
                return res.status(404).json({ error: "Store not found." });
              }
            })
            .catch(function (err) {
              res.status(404).json({ error: "cannot fetch Ticket." });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },


  // Find User Reportings By store
  getAllReports: function (req, res) {

    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.User.findOne({
      where: { id: userId, role: "admin" },
    })
      .then(function (user) {
        if (user) {
          models.Reporting.findAll({
            attributes: ["id", "idUSERS", "marque", "bugLocation", "emojis", "description", "blocking", "tips"],
            include:
            {
              model: models.User,
              attributes: [
                "pseudo",
                "email",
              ],
            },

          })
            .then(function (report) {
              if (report) {
                return res.status(200).json(report);
              } else {
                return res.status(404).json({ error: "Report not found." });
              }
            })
            .catch(function (err) {
              res.status(404).json({ err });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },
  // Update bugs Category
  updateAlert: async function (req, res) {
    try {
      // Récupérer l'utilisateur à partir du header d'authentification
      const headerAuth = req.headers["authorization"];
      const userId = jwtUtils.getUserId(headerAuth);
  
      const { category } = req.body;
  
      if (!category) {
        return res.status(400).json({ error: "Paramètre catégorie manquant." });
      }
  
      // Liste des catégories valides
      const validCategories = ["cat1", "cat2", "cat3", "autre"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Valeur de catégorie non valide." });
      }
  
      // Vérifier l'utilisateur
      const userFound = await models.User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }
  
      // Trouver la dernière alerte de cet utilisateur (vous pouvez affiner ce critère si nécessaire)
      const lastAlert = await models.Reporting.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]], // Trier pour obtenir la plus récente
      });
  
      if (!lastAlert) {
        return res.status(404).json({ error: "Aucune alerte trouvée pour cet utilisateur." });
      }
  
      // Mettre à jour la catégorie de l'alerte
      lastAlert.category = category;
      await lastAlert.save();
  
      return res.status(200).json({
        success: true,
        message: "Catégorie mise à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la catégorie :", error);
      return res.status(500).json({ error: "Erreur interne.", details: error.message });
    }
  },
  

};
