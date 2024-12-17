// Imports
import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  getUserId,
  verifyRefreshToken,
} from "../utils/jwtUtils.js";
const { User, Marque } = db;
import asyncLib from "async";
import randToken from "rand-token";
const { uid } = randToken;
import validator from "email-validator";
import { func } from "../funcs/functions.js";
import Sequelize from "sequelize";
const { Op } = Sequelize;

// Routers
export const user = {
  register: function (req, res) {
    //let gender = req.body.gender;
    let pseudo = req.body.pseudo;
    let born = req.body.born;
    let email = req.body.email;
    let password = req.body.password;
    let password_confirm = req.body.password_confirm;
    let token = func.randomCode(6, "0123456789");

    if (pseudo == null || email == null || password == null) {
      return res.status(400).json({ error: "all fields must be filled in." });
    }

    if (!func.checkString(pseudo)) {
      return res.status(400).json({
        error:
          "Invalid last name (Must be alphaNumerate Min 3 characters  - Max 50 characters)",
      });
    }

    if (func.isValidDateFormat(born)) {
      if (func.isOver16(born) < 16) {
        return res.status(400).json({
          error: "born (You should be 16 years of age or older)",
        });
      }
    }
    if (!func.isValidDateFormat(born)) {
      return res.status(400).json({
        error: "Wrong format (Format accepted: dd/mm/yyyy or dd-mm-yyyy)",
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    if (!func.checkPassword(password)) {
      return res.status(400).json({
        error:
          "password invalid (Min 1 special character - Min 1 number. - Min 8 characters or More)",
      });
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: "passwords do not match." });
    }

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            attributes: ["email"],
            where: { email: email },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "Impossible de verifier cet utilisateur" });
            });
        },
        function (userFound, done) {
          if (!userFound) {
            bcrypt.hash(password, 5, function (err, bcryptedPassword) {
              done(null, userFound, bcryptedPassword);
            });
          } else {
            return res.status(409).json({ error: "Cet utilisateur existe" });
          }
        },
        function (userFound, bcryptedPassword, done) {
          User.create({
            pseudo: pseudo,
            born: born,
            email: email,
            password: bcryptedPassword,
            confirmationToken: token,
          })
            .then(function (newUser) {
              done(newUser);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "Impossible d'ajouter cet utilisateur" });
            });
        },
      ],
      function (newUser) {
        if (newUser) {
          func.sentEmail(
            newUser.email,
            token,
            "https://usearly-api.vercel.app",
            newUser.id
          );
          return res.status(201).json({
            msg: "un mail de confirmation vous a été envoyé afin de valider votre compte à l'adresse : ",
            email: newUser.email,
          });
        } else {
          return res
            .status(500)
            .json({ error: "Impossible d'ajouter cet utilisateur" });
        }
      }
    );
  },
  // Email sending to confirm account
  confirmEmail: function (req, res) {
    // Params
    var userId = req.params.userId;
    var token = req.body.token;

    //const { userId, token } = req.query;

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId, confirmationToken: token },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to verify the user" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            userFound
              .update({
                confirmationToken: null,
                confirmedAt: new Date(Date.now()),
              })
              .then(function () {
                done(userFound);
              })
              .catch(function (err) {
                res
                  .status(500)
                  .json({ error: "Impossible de vérifier cet user" });
              });
          } else {
            res.status(404).json({ error: "Utilisateur introuvable" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          res.status(200).json({
            msg: "Votre compte a bien été validé, veuillez à présent vous connecter.",
          });

          // decommente pour la prod
          /* res.writeHead(302, {
            Location: "/register",
          }); */
          return res.end();
          // return
        } else {
          return res.status(500).json({ error: "INVALID TOKEN." });
        }
      }
    );
  },

  // Login
  login: async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const accessToken = generateAccessToken(user); // Génère un access token
      let refreshToken = null; // Initialise le refresh token à null

      if (rememberMe) {
        // Génère un refresh token uniquement si `rememberMe` est true
        refreshToken = generateRefreshToken(user);

        // Stocke le refresh token dans un cookie sécurisé
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true, // Empêche l'accès via JavaScript (protection XSS)
          secure: true, // Requis pour HTTPS (les cookies ne transitent que sur HTTPS)
          sameSite: "strict", // Empêche le partage du cookie entre sites (CSRF)
          maxAge: 30 * 24 * 60 * 60 * 1000, // Définit une expiration
        });
      } else {
        // Supprime le cookie contenant le refresh token si `rememberMe` est false
        res.clearCookie("refreshToken");
      }

      // Réponse JSON
      const response = {
        success: true,
        message: "Connexion réussie.",
        accessToken, // Toujours renvoyé
      };

      // Ajoute le refreshToken dans la réponse seulement si `rememberMe` est true
      if (rememberMe && refreshToken) {
        response.refreshToken = refreshToken;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur interne." });
    }
  },

  refreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res
        .status(403)
        .json({ success: false, message: "Refresh Token missing" });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken); // Vérifie et décode le Refresh Token
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Invalid Refresh Token" });
      }

      const newAccessToken = generateAccessToken(user); // Génère un nouvel Access Token
      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement :", error);
      return res
        .status(403)
        .json({ success: false, message: "Invalid Refresh Token" });
    }
  },

  logout: (req, res) => {
    res.clearCookie("refreshToken"); // Supprimez le cookie contenant le Refresh Token
    return res
      .status(200)
      .json({ success: true, message: "Déconnexion réussie." });
  },

  verifyToken: (req, res) => {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId !== -1) {
        return res.status(200).json({
          success: true,
          userId,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Token invalide ou expiré",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du token:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la vérification du token",
      });
    }
  },

  // Email sending to confirm account
  forgotPassword: function (req, res) {
    // Params
    let email = req.body.email;

    if (email == null) {
      return res.status(400).json({ error: "Invalid credencials" });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { email: email },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to verify user email" });
            });
        },
        function (userFound, done) {
          if (userFound && userFound.confirmedAt !== null) {
            const resetToken = uid(64);
            userFound
              .update({
                resetToken: resetToken,
                resetAt: new Date(Date.now()),
                expiredAt: new Date(Date.now() + 60 * 60 * 1000),
              })
              .then(function (userFound) {
                func.sendResetPasswordEmail(
                  userFound.email,
                  userFound.pseudo,
                  "https://usearly-api.vercel.app",
                  userFound.id,
                  resetToken
                );
                done(userFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot update user password." });
              });
          } else {
            res.status(404).json({ error: "user not found" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(201).json({
            msg:
              "Pour réinitialiser votre mot de passe un mail vous a été envoyer l'adresse : " +
              userFound.email +
              " " +
              new Date(Date.now()),
          });
        } else {
          return res.status(500).json({ error: "cannot update user profile" });
        }
      }
    );
  },

  // RESET PASSWORD
  resetPassword: function (req, res) {
    // Params
    let userId = req.params.userId;
    let token = req.params.token;
    let password = req.body.password;
    let password_confirm = req.body.password_confirm;

    if (!func.checkPassword(password)) {
      return res.status(400).json({
        error:
          "password invalid (must length 6 - 10 and include 1 number at least)",
      });
    }
    if (password_confirm != password) {
      return res.status(400).json({ error: "password do not match." });
    }

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to verify this user" });
            });
        },
        function (userFound, done) {
          if (userFound) {
            bcrypt.hash(password, 5, function (err, bcryptedPassword) {
              done(null, userFound, bcryptedPassword);
            });
          } else {
            return res.status(409).json({ error: "user not exist" });
          }
        },
        function (userFound, bcryptedPassword, done) {
          if (
            userFound &&
            userFound.resetToken !== null &&
            userFound.resetToken === token
          ) {
            if (userFound.expiredAt > new Date(Date.now())) {
              userFound
                .update({
                  password: bcryptedPassword,
                  resetAt: null,
                  resetToken: null,
                  expiredAt: null,
                })
                .then(function () {
                  done(userFound);
                })
                .catch(function (err) {
                  res.status(500).json({ error: "cannot found user" });
                });
            } else {
              res.status(404).json({ error: "Your token is not valid." });
            }
          } else {
            res.status(404).json({ error: "ce lien n'est plus valide...." });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res
            .status(201)
            .json({ msg: "Votre mot de pass a bien été modifié." });
        } else {
          return res
            .status(500)
            .json({ error: "cannot validate your password." });
        }
      }
    );
  },

  // Retrieve all Tutorials from the database.
  findAllUsers: (req, res) => {
    // Getting auth header
    let headerAuth = req.headers["authorization"];
    let userId = getUserId(headerAuth);

    if (userId < 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    let page = parseInt(req.params.page);

    const { limit, offset } = func.getPagination(page, 10);

    User.findAndCountAll({
      where: {
        role: {
          [Op.notLike]: "%admin%",
        },
      },
      limit,
      offset,
    })
      .then((data) => {
        const response = func.getPagingData(data, page, 10);
        res.send(response);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving Users.",
        });
      });
  },

  // Find ALL Users
  listUsers: function (req, res) {
    // Getting auth header
    let headerAuth = req.headers["authorization"];
    let userId = getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    User.findOne({
      where: { id: userId },
    })
      .then(function (user) {
        if (user.role == "admin") {
          User.findAll({
            where: {
              role: {
                [Op.notLike]: "%admin%",
              },
            },
          })
            .then(function (user2) {
              if (user2) {
                res.status(200).json(user2);
              }
            })
            .catch(function (err) {
              res.status(500).json({ error: "cannot fetch user" });
            });
        } else {
          res.status(404).json({ error: "Accès non autorisé." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch user" });
      });
  },
  // Find User By EMAIL from admin
  findByEmail: async function (req, res) {
    try {
      // Récupérer le token d'authentification
      const headerAuth = req.headers["authorization"];
      const adminId = getUserId(headerAuth);

      // Vérification des droits d'accès
      const adminUser = await User.findOne({
        where: { id: adminId, role: "admin" },
      });
      if (!adminUser) {
        return res
          .status(403)
          .json({ error: "Access denied. Admin role required." });
      }

      // Validation des paramètres (par exemple, vérifier si l'email est fourni)
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ error: "Missing email parameter." });
      }

      // Rechercher l'utilisateur par email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res
          .status(404)
          .json({ error: `User with email ${email} not found.` });
      }

      // Retourner les détails de l'utilisateur trouvé
      return res.status(200).json({
        status: 200,
        success: true,
        message: "User found successfully.",
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Error finding user by email:", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  },

  // user account after login
  getUserProfile: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    if (userId < 0) return res.status(400).json({ error: "wrong token" });

    User.findOne({
      attributes: ["gender", "pseudo", "born", "email"],
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ error: "user not found" });
        }
      })
      .catch(function (err) {
        res.status(500).json({ err });
      });
  },

  // update user profile
  updateUserProfile: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    // Params
    let pseudo = req.body.pseudo;
    let born = req.body.born;
    let gender = req.body.gender;

    const exactlyNYearsAgoDate = (yearsAgo) =>
      new Date(new Date().setFullYear(new Date().getFullYear() - yearsAgo));
    const mockBirthday = new Date(born);
    const isAdult = mockBirthday.getTime() < exactlyNYearsAgoDate(18).getTime();

    if (!func.checkString(pseudo)) {
      return res.status(400).json({
        error:
          "Invalid pseudo (Must be alphaNumerate Min 3 characters  - Max 50 characters)",
      });
    }

    if (gender == null) {
      return res
        .status(400)
        .json({ error: "Gender INVALID (must be (monsieur) - (madame))...." });
    }

    if (!isAdult) {
      return res.status(400).json({
        error: "born (You should be 18 years of age or older)",
      });
    }

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId },
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
            userFound
              .update({
                pseudo: pseudo ? pseudo : userFound.pseudo,
                born: born ? born : userFound.born,
                gender: gender ? gender : userFound.gender,
              })
              .then(function () {
                done(userFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot update user" });
              });
          } else {
            res.status(404).json({ error: "user not found" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(201).json(userFound);
        } else {
          return res.status(500).json({ error: "cannot update user profile" });
        }
      }
    );
  },

  // update user password
  updateUserPassword: async function (req, res) {
    try {
      // Récupérer l'en-tête d'authentification
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      // Paramètres
      const { old_password, password, password_confirm } = req.body;

      // Vérifications initiales
      if (userId <= 0) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      if (!old_password || !password || !password_confirm) {
        return res.status(400).json({
          error:
            "All fields are required (old_password, password, password_confirm).",
        });
      }

      if (!func.checkPassword(password)) {
        return res.status(400).json({
          error:
            "Password invalid (Min 1 special character - Min 1 number - Min 8 characters or more).",
        });
      }

      if (password !== password_confirm) {
        return res.status(400).json({ error: "Passwords do not match." });
      }

      // Trouver l'utilisateur dans la base de données
      const userFound = await User.findOne({ where: { id: userId } });
      if (!userFound) {
        return res.status(404).json({ error: "User not found." });
      }

      // Vérifier si l'ancien mot de passe correspond
      const validPassword = await bcrypt.compare(
        old_password,
        userFound.password
      );
      if (!validPassword) {
        return res.status(403).json({ error: "Old password is incorrect." });
      }

      // Hasher le nouveau mot de passe
      const bcryptedPassword = await bcrypt.hash(password, 5);

      // Mettre à jour le mot de passe de l'utilisateur
      await userFound.update({ password: bcryptedPassword });

      // Réponse
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Password updated successfully.",
      });
    } catch (err) {
      console.error("Error updating user password:", err);
      return res
        .status(500)
        .json({ error: "An error occurred", details: err.message });
    }
  },

  // delete user profile by admin
  destroyUserProfileByAdmin: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    // Params
    let email = req.params.email;

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId, role: "admin" },
          })
            .then(function (userAdmin) {
              done(null, userAdmin);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userAdmin, done) {
          if (userAdmin) {
            User.findOne({
              where: { email: email },
            })
              .then(function (userFound) {
                done(null, userFound);
              })
              .catch(function (err) {
                return res.status(500).json({ error: "unable to verify user" });
              });
          } else {
            res.status(500).json({ error: "Acces denied" });
          }
        },
        function (userFound, done) {
          if (userFound) {
            User.destroy({
              where: { email: userFound.email },
            })
              .then(function () {
                done(userFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot delete the user" });
              });
          } else {
            res.status(404).json({ error: "user not found" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res.status(200).json({ msg: "resource deleted successfully" });
        } else {
          return res.status(500).json({ error: "cannot delete user profile" });
        }
      }
    );
  },
  // delete user profile
  destroyUserProfile: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    // Params
    let email = req.params.email;

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }
    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId },
          })
            .then(function (userF) {
              done(null, userF);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userF, done) {
          if (userF.email === email && userF.id === userId) {
            User.destroy({
              where: { email: email, id: userId },
              truncate: { cascade: false },
            })
              .then(function () {
                done(userF);
              })
              .catch(function (err) {
                return res.status(500).json({ err });
              });
          } else {
            res.status(500).json({ err: "ACCESS DENIED" });
          }
        },
      ],
      function (userF) {
        if (userF) {
          return res.status(200).json({ msg: "resource deleted successfully" });
        } else {
          return res.status(500).json({ error: "cannot delete user profile" });
        }
      }
    );
  },
  // delete employee profile by admin
  destroyUserProfileByAdmins: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    // Params
    let email = req.params.email;

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId, role: "admin" },
          })
            .then(function (userAdmin) {
              done(null, userAdmin);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userAdmin, done) {
          if (userAdmin) {
            User.findOne({
              where: { email: email },
            })
              .then(function (userFound) {
                done(null, userFound);
              })
              .catch(function (err) {
                return res.status(500).json({ error: "unable to verify user" });
              });
          } else {
            return res.status(500).json({ error: "Acces denied" });
          }
        },
        function (userFound, done) {
          if (userFound) {
            User.destroy({
              where: { email: email },
            })
              .then(function () {
                done(userFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot delete the user" });
              });
          } else {
            res.status(404).json({ error: "user not found" });
          }
        },
      ],
      function (userFound) {
        if (userFound) {
          return res
            .status(200)
            .json({ msg: "User has been deleted successfully" });
        } else {
          return res.status(500).json({ error: "cannot delete user profile" });
        }
      }
    );
  },
  createBrandNew: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    let name = req.body.name;
    let email = req.body.email;
    let mdp = req.body.mdp;
    let mdp_confirm = req.body.mdp_confirm;

    if (
      name.trim().length === 0 ||
      email.trim().length === 0 ||
      mdp.trim().length === 0
    ) {
      return res.status(400).json({ error: "all fields must be filled in." });
    }

    if (!func.checkString(name)) {
      return res.status(400).json({
        error:
          "Invalid last name (Must be alphaNumerate Min 3 characters  - Max 50 characters)",
      });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    if (!func.checkPassword(mdp)) {
      return res.status(400).json({
        error:
          "password invalid (Min 1 special character - Min 1 number. - Min 8 characters or More)",
      });
    }

    if (mdp !== mdp_confirm) {
      return res.status(400).json({ error: "passwords do not match." });
    }

    if (userId <= 0) {
      return res.status(400).json({ error: "missing token" });
    }
    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId, role: "admin" },
          })
            .then(function (userAdmin) {
              done(null, userAdmin);
            })
            .catch(function (err) {
              return res.status(401).json({ error: "User not found" });
            });
        },
        function (userAdmin, done) {
          if (userAdmin) {
            Marque.findOne({
              where: { email: email },
            })
              .then(function (userFound) {
                done(null, userAdmin, userFound);
              })
              .catch(function (err) {
                return res
                  .status(500)
                  .json({ error: "unable to verify this user" });
              });
          } else {
            return res.status(401).json({ error: "Access Denied." });
          }
        },
        function (userAdmin, userFound, done) {
          if (!userFound) {
            bcrypt.hash(mdp, 5, function (err, bcryptedPassword) {
              done(null, userFound, bcryptedPassword);
            });
          } else {
            return res.status(409).json({ error: "Brand already exist. " });
          }
        },

        function (userFound, bcryptedPassword, done) {
          Marque.create({
            userId: userId,
            name: name,
            email: email,
            mdp: bcryptedPassword,
          })
            .then(function (newBrand) {
              done(newBrand);
            })
            .catch(function (err) {
              return res.status(500).json({ error: "cannot add this brand" });
            });
        },
      ],
      function (newBrand) {
        if (newBrand) {
          return res.status(201).json({ msg: "account created with success." });
        } else {
          return res.status(500).json({ error: "cannot add this brand" });
        }
      }
    );
  },
  BrandList: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }
    User.findOne({
      where: { id: userId, role: "admin" },
    })
      .then(function (user) {
        if (user) {
          Marque.findAll({})
            .then(function (brand) {
              if (brand) {
                res.status(200).json(brand);
              }
            })
            .catch(function (err) {
              res.status(500).json({ error: "cannot fetch user" });
            });
        } else {
          res.status(404).json({ error: "Accès non autorisé." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch user" });
      });
  },
};
