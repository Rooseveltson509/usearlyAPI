require("dotenv").config();
let bcrypt = require("bcryptjs");
let jwtUtils = require("../utils/jwt.utils");
let models = require("../models");
var asyncLib = require("async");

module.exports = {
  // Login brand
  BrandLogin: function (req, res) {
    // Params
    var email = req.body.email;
    var mdp = req.body.mdp;

    if (email == null || mdp == null) {
      return res.status(400).json({ error: "missing parameters" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          models.Marque.findOne({
            where: { email: email },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
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
            token: jwtUtils.generateTokenForUser(userFound),
          });
        } else {
          return res.status(500).json({ error: "cannot log on user" });
        }
      }
    );
  },
};
