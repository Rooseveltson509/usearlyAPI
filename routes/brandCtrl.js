import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import bcrypt from "bcryptjs";
import { generateRefreshToken } from "../utils/jwtUtils.js";
const { Marque } = db;
import asyncLib from "async";

// Méthodes exportées
export const brandCtrl = {
  login: function (req, res) {
    // Params
    const email = req.body.email;
    const mdp = req.body.mdp;

    if (email == null || mdp == null) {
      return res.status(400).json({ error: "missing parameters" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          Marque.findOne({
            where: { email: email },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function () {
              return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            bcrypt.compare(
              mdp,
              userFound.mdp,
              function (errBycrypt, resBycrypt) {
                done(null, userFound, resBycrypt);
              }
            );
          } else {
            return res.status(404).json({ error: "Utilisateur introuvable." });
          }
        },
        function (userFound, resBycrypt, done) {
          if (resBycrypt) {
            done(userFound);
          } else {
            return res
              .status(400)
              .json({ error: "Email ou mot de passe INVALIDE..." });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(200).json({
            token: generateRefreshToken(userFound),
          });
        } else {
          return res.status(500).json({ error: "cannot log on user" });
        }
      }
    );
  },
};
