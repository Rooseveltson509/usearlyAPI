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
const { User, Marque, Reporting, CoupDeCoeur, Suggestion } = db;
import asyncLib from "async";
import randToken from "rand-token";
const { uid } = randToken;
import validator from "email-validator";
import { func } from "../funcs/functions.js";
import Sequelize from "sequelize";
const { Op } = Sequelize;
import {
  moveFileToFinalDestination,
  deleteOldAvatar,
  brandAvatarsDir,
  ensureDirectoryExists,
} from "../config/multer.js";

import path from "path";

// Routers
export const user = {
  register: async function (req, res) {
    const { pseudo, born, email, password, password_confirm } = req.body;

    try {
      // Vérifiez si tous les champs obligatoires sont remplis
      if (!pseudo || !born || !email || !password) {
        return res
          .status(400)
          .json({ error: "Tous les champs doivent être remplis." });
      }

      // Validez et transformez la date de naissance
      const validation = func.validateAndCheckAdult(born);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.message });
      }
      const dateOfBirth = validation.date; // La date transformée en objet Date

      // Vérifiez si l'utilisateur est majeur
      if (!validation.isAdult) {
        return res.status(400).json({
          error: "Vous devez être majeur pour vous inscrire.",
        });
      }

      // Vérifiez le format du pseudo
      if (!func.checkString(pseudo)) {
        return res.status(400).json({
          error:
            "Pseudo invalide (doit être alphanumérique, 3 à 50 caractères maximum).",
        });
      }

      // Vérifiez si l'email est valide
      if (!validator.validate(email)) {
        return res.status(400).json({ error: "L'email fourni est invalide." });
      }

      // Vérifiez si le mot de passe est valide
      if (!func.validatePassword(password)) {
        return res.status(400).json({
          error:
            "Le mot de passe doit contenir au moins 1 caractère spécial, 1 chiffre, et être d'au moins 8 caractères.",
        });
      }

      // Vérifiez si les mots de passe correspondent
      if (password !== password_confirm) {
        return res
          .status(400)
          .json({ error: "Les mots de passe ne correspondent pas." });
      }

      // Vérifiez si l'email existe déjà dans la base de données
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "Cet utilisateur existe déjà." });
      }

      // Hashage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 5);

      // Génération du token de confirmation
      const token = func.randomCode(6, "0123456789");

      // Créez un nouvel utilisateur
      const newUser = await User.create({
        pseudo,
        born: dateOfBirth, // Insérez la date transformée ici
        email,
        password: hashedPassword,
        confirmationToken: token,
      });

      // Envoyez l'email de confirmation
      const confirmationUrl = `ocalhost:5173/confirm?token=${token}`;
      func.sentEmail(email, token, confirmationUrl, newUser.id);

      // Répondez avec un succès
      return res.status(201).json({
        message: `Un mail de confirmation vous a été envoyé à l'adresse ${email}.`,
        email,
        userId: newUser.id,
      });
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      return res
        .status(500)
        .json({ error: "Une erreur interne s'est produite." });
    }
  },
  // Email sending to confirm account
  confirmEmail: async (req, res) => {
    const { userId, token } = req.body;

    try {
      // Vérification des données requises
      if (!userId || !token) {
        return res.status(400).json({
          success: false,
          message: "Données manquantes.",
        });
      }

      // Recherche de l'utilisateur par ID
      const user = await User.findOne({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur introuvable.",
        });
      }

      // Vérifier si le compte est déjà confirmé
      if (!user.confirmationToken && user.confirmedAt) {
        return res.status(400).json({
          success: false,
          message: "Ce compte est déjà confirmé.",
        });
      }

      // Vérification du token de confirmation
      if (user.confirmationToken !== token) {
        return res.status(400).json({
          success: false,
          message: "Token de confirmation invalide.",
        });
      }

      // Mise à jour des informations utilisateur (confirmation du compte)
      await user.update({
        confirmationToken: null,
        confirmedAt: new Date(),
      });

      // Génération des tokens pour connexion automatique
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const isSecure = process.env.COOKIE_SECURE === "true";
      // Stockage du refreshToken dans un cookie sécurisé
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Empêche l'accès via JS
        secure: true, // Nécessaire pour HTTPS
        sameSite: isSecure ? "None" : "Lax", // Protection CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000, // Expiration du refreshToken (30 jours)
      });

      return res.status(200).json({
        success: true,
        message: "Votre compte a bien été validé.",
        accessToken, // Retourner le token pour une connexion automatique
      });
    } catch (error) {
      console.error("Erreur lors de la confirmation :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur interne, veuillez réessayer.",
      });
    }
  },

  // Login
  login: async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const isRememberMe = rememberMe === true || rememberMe === "true";

    try {
      const user = await User.findOne({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      if (!user.confirmedAt || user.confirmationToken !== null) {
        return res.status(403).json({
          success: false,
          message: "Veuillez confirmer votre compte avant de vous connecter.",
        });
      }

      const accessToken = generateAccessToken(user);
      const isSecure = process.env.COOKIE_SECURE === "true";

      // ✅ Ajout du refreshToken dans un cookie uniquement si RememberMe
      if (isRememberMe) {
        const refreshToken = generateRefreshToken(user);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "None" : "Lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      } else {
        res.clearCookie("refreshToken");
      }

      return res.status(200).json({
        success: true,
        message: "Connexion réussie.",
        accessToken,
        user: {
          avatar: user.avatar,
          type: "user",
        },
      });
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur interne." });
    }
  },
  refreshToken: async (req, res) => {
    try {
      console.log("📌 Requête reçue pour refresh token");

      // ✅ CSRF vérification uniquement en production
      if (process.env.NODE_ENV === "production") {
        console.log(
          "📌 Vérification du CSRF Token en production...",
          req.headers["x-csrf-token"],
          req.cookies["_csrf"]
        );

        if (req.headers["x-csrf-token"] !== req.cookies["_csrf"]) {
          return res
            .status(403)
            .json({ success: false, message: "CSRF Token invalide" });
        }
      } else {
        console.log("⚠ CSRF Token check bypassé (dev mode)");
      }

      // 🔁 Récupération du refresh token (via cookie ou body en dev)
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        console.error("⚠ Aucun refreshToken reçu !");
        return res
          .status(401)
          .json({ success: false, message: "Refresh Token manquant" });
      }

      // 🔒 Vérification du refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Utilisateur non trouvé" });
      }

      // ✅ Génération d'un nouveau token
      const newAccessToken = generateAccessToken(user);
      console.log("✅ Nouveau accessToken généré :", newAccessToken);

      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error("❌ Erreur interne lors du refresh :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur serveur" });
    }
  },

  // logout controller
  logout: async (req, res) => {
    try {
      // Supprimer les cookies du refreshToken
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // En prod, secure est true
        sameSite: "Strict",
      });
      res.clearCookie("_csrf", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // En prod, secure est true
        sameSite: "Strict",
      });

      // Envoyer une réponse de succès
      return res
        .status(200)
        .json({ success: true, message: "Déconnexion réussie" });
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      return res
        .status(500)
        .json({ success: false, message: "Erreur lors de la déconnexion" });
    }
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
  forgotPassword: async (req, res) => {
    const { email } = req.body;

    // Vérification des paramètres
    if (!email) {
      return res.status(400).json({ success: false, message: "Email requis." });
    }

    if (!validator.validate(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Format de l'email invalide." });
    }

    try {
      // Vérification si l'utilisateur existe
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Utilisateur introuvable." });
      }

      if (!user.confirmedAt) {
        return res.status(400).json({
          success: false,
          message: "L'utilisateur n'a pas encore confirmé son compte.",
        });
      }

      // Génération et mise à jour des informations de réinitialisation
      const resetToken = uid(64);
      await user.update({
        resetToken,
        resetAt: new Date(),
        expiredAt: new Date(Date.now() + 60 * 60 * 1000), // Expiration dans 1 heure
      });

      // Envoi de l'email de réinitialisation
      await func.sendResetPasswordEmail(
        user.email,
        user.pseudo,
        `${process.env.FRONTEND_URL}/reset-password/${user.id}/${resetToken}`,
        user.id,
        resetToken
      );

      // Réponse en cas de succès
      return res.status(200).json({
        success: true,
        message: `Un email de réinitialisation a été envoyé à l'adresse : ${user.email}.`,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du mot de passe :",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Erreur interne. Veuillez réessayer plus tard.",
      });
    }
  },

  // RESET PASSWORD
  resetPassword: async (req, res) => {
    const { userId, token } = req.params;
    const { password, password_confirm } = req.body;

    // Validation des entrées
    if (!func.checkPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit contenir entre 6 et 10 caractères et inclure au moins un chiffre.",
      });
    }

    if (password !== password_confirm) {
      return res.status(400).json({
        success: false,
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    try {
      // Recherche de l'utilisateur par ID
      const user = await User.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur introuvable.",
        });
      }

      // Vérification du token de réinitialisation
      if (!user.resetToken || user.resetToken !== token) {
        return res.status(400).json({
          success: false,
          message:
            "Ce lien de réinitialisation est invalide ou a déjà été utilisé.",
        });
      }

      // Vérification de l'expiration du token
      if (user.expiredAt <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Le lien de réinitialisation a expiré.",
        });
      }

      // Hachage du nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mise à jour des informations de l'utilisateur
      await user.update({
        password: hashedPassword,
        resetAt: null,
        resetToken: null,
        expiredAt: null,
      });

      // Génération des nouveaux tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const isSecure = process.env.COOKIE_SECURE === "true";

      // Stockage du refreshToken dans un cookie sécurisé
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Empêche l'accès via JS
        secure: true, // Requis pour HTTPS
        sameSite: isSecure ? "None" : "Lax", // Protection CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000, // Expiration du refreshToken
      });

      return res.status(200).json({
        success: true,
        message: "Votre mot de passe a été réinitialisé avec succès.",
        accessToken, // Retourner le token pour authentification automatique
      });
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du mot de passe :",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne. Veuillez réessayer plus tard.",
      });
    }
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
      attributes: ["id", "gender", "pseudo", "born", "role", "email", "avatar"],
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
  updateUserProfile: async (req, res) => {
    const avatarFile = req.file; // 📌 Nouveau fichier temporaire
    try {
      let headerAuth = req.headers["authorization"];
      let userId = getUserId(headerAuth);

      if (userId < 0) {
        if (avatarFile) await deleteOldAvatar(avatarFile.path);
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      if (!userId) {
        if (avatarFile) await deleteOldAvatar(avatarFile.path);
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }

      const { pseudo, born, gender } = req.body;

      if (!pseudo || pseudo.length < 3 || pseudo.length > 50) {
        if (avatarFile) await deleteOldAvatar(avatarFile.path);
        return res.status(400).json({
          error:
            "Pseudo invalide. Minimum 3 caractères, maximum 50 caractères.",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        if (avatarFile) await deleteOldAvatar(avatarFile.path);
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }

      // 📌 Suppression de l'ancien avatar AVANT d'ajouter le nouveau
      if (
        user.avatar &&
        user.avatar.startsWith("uploads/avatars/users") &&
        !user.avatar.includes("default-avatar.png")
      ) {
        await deleteOldAvatar(user.avatar);
      }

      let finalAvatarPath = user.avatar;
      if (avatarFile) {
        const finalDir = path.resolve("uploads/avatars/users");
        ensureDirectoryExists(finalDir);

        const finalName = `avatar-${Date.now()}-${userId}${path.extname(avatarFile.originalname)}`;
        const finalPath = path.join(finalDir, finalName);

        // 📌 Avant de déplacer, supprimer l'ancien avatar (évite l'accumulation)
        if (
          user.avatar &&
          user.avatar.startsWith("uploads/avatars/users") &&
          !user.avatar.includes("default-avatar.png")
        ) {
          await deleteOldAvatar(user.avatar);
        }

        await moveFileToFinalDestination(avatarFile.path, finalPath);

        // 📌 Correction : stocker le chemin correct pour le frontend
        finalAvatarPath = `uploads/avatars/users/${finalName}`;
      }

      await user.update({
        pseudo: pseudo || user.pseudo,
        born: born || user.born,
        gender: gender || user.gender,
        avatar: finalAvatarPath,
      });

      return res.status(200).json({
        success: true,
        message: "Profil mis à jour avec succès.",
        user,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      if (avatarFile) await deleteOldAvatar(avatarFile.path);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
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
        return res
          .status(403)
          .json({ error: "Votre ancien mot de passe est incorrect." });
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
  createBrandNew: async function (req, res) {
    try {
      console.log("📥 Données reçues dans req.body :", req.body);
      console.log("📥 Fichier reçu dans req.file :", req.file);

      // Récupération des données
      const { name, email, mdp, mdp_confirm } = req.body;
      const avatarFile = req.file; // 📌 Fichier avatar reçu via multer
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      // Vérification des champs obligatoires
      if (!name || !email || !mdp || !mdp_confirm) {
        console.log("❌ Un ou plusieurs champs sont manquants !");
        return res
          .status(400)
          .json({ error: "Tous les champs doivent être remplis." });
      }

      // Vérifications des formats des champs
      if (!func.checkString(name)) {
        return res.status(400).json({
          error: "Nom invalide (doit être alphanumérique, 3-50 caractères).",
        });
      }

      if (!validator.validate(email)) {
        return res.status(400).json({ error: "Email non valide." });
      }

      if (!func.validatePassword(mdp)) {
        return res.status(400).json({
          error:
            "Mot de passe invalide (8+ caractères, 1 chiffre, 1 caractère spécial).",
        });
      }

      if (mdp !== mdp_confirm) {
        return res
          .status(400)
          .json({ error: "Les mots de passe ne correspondent pas." });
      }

      // Vérifier si l'utilisateur est un admin
      const userAdmin = await User.findOne({
        where: { id: userId, role: "admin" },
      });

      if (!userAdmin) {
        return res.status(401).json({ error: "Accès refusé." });
      }

      // Vérifier si la marque existe déjà
      const existingBrand = await Marque.findOne({ where: { email } });
      if (existingBrand) {
        return res.status(409).json({ error: "La marque existe déjà." });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(mdp, 5);

      // 📌 Gestion de l'avatar (stockage dans le bon dossier)
      let avatarPath = null;
      if (avatarFile) {
        const tempPath = avatarFile.path; // Chemin temporaire
        const finalDir = path.resolve("uploads/avatars/brands");
        ensureDirectoryExists(finalDir);

        const finalName = `avatar-${Date.now()}-${userId}${path.extname(avatarFile.originalname)}`;
        const finalPath = path.join(finalDir, finalName);

        await moveFileToFinalDestination(tempPath, finalPath);
        avatarPath = `uploads/avatars/brands/${finalName}`;
        console.log("📂 Avatar stocké :", avatarPath);
      }

      // Création de la marque
      const newBrand = await Marque.create({
        userId,
        name,
        email,
        mdp: hashedPassword,
        avatar: avatarPath, // 📌 Enregistrer l'avatar dans la base de données
      });

      return res
        .status(201)
        .json({ message: "Compte créé avec succès.", brand: newBrand });
    } catch (error) {
      console.error("Erreur lors de la création de la marque :", error);
      return res
        .status(500)
        .json({ error: "Impossible d'ajouter cette marque." });
    }
  },

  updateBrandAvatar: async function (req, res) {
    try {
      const { brandId } = req.params;
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);
      const newAvatarFile = req.file;

      if (!brandId || !newAvatarFile) {
        return res.status(400).json({ error: "Brand ID et avatar requis." });
      }

      // Vérifier si l'utilisateur est bien admin
      const userAdmin = await User.findOne({
        where: { id: userId, role: "admin" },
      });
      if (!userAdmin) {
        return res.status(401).json({ error: "Accès refusé." });
      }

      // Vérifier si la marque existe
      const brand = await Marque.findByPk(brandId);
      if (!brand) {
        return res.status(404).json({ error: "Marque non trouvée." });
      }

      console.log("🔍 Ancien avatar actuel :", brand.avatar);

      // 📌 Supprimer l'ancien avatar AVANT d'ajouter le nouveau
      if (brand.avatar) {
        const oldAvatarPath = brand.avatar; // Assure-toi que c'est un chemin relatif
        console.log("🗑 Suppression de l'ancien avatar :", oldAvatarPath);
        await deleteOldAvatar(oldAvatarPath);
      }

      // 📌 Déplacement du nouvel avatar dans le bon dossier
      const finalDir = path.resolve("uploads/avatars/brands");
      ensureDirectoryExists(finalDir);

      // 📌 Générer un nom propre au brand pour éviter une accumulation de fichiers
      const finalName = `brand-${brandId}${path.extname(newAvatarFile.originalname)}`;
      const finalPath = path.join(finalDir, finalName);

      console.log("📂 Nouveau chemin de l'avatar :", finalPath);

      await moveFileToFinalDestination(newAvatarFile.path, finalPath);

      // 📌 Mettre à jour l'avatar dans la base avec le chemin relatif
      brand.avatar = `avatars/brands/${finalName}`;
      await brand.save();

      return res.status(200).json({
        message: "Avatar mis à jour avec succès.",
        brand,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'avatar :", error);
      return res
        .status(500)
        .json({ error: "Impossible de mettre à jour l'avatar." });
    }
  },

  updateBrand: async function (req, res) {
    try {
      console.log("🛠️ Début de la mise à jour de la marque.");

      const brandId = req.params.id;
      console.log("📩 ID Marque :", brandId);

      const { name, email, mdp, offres } = req.body;
      console.log("📩 Body reçu :", { name, email, mdp, offres });

      const avatarFile = req.file;
      console.log(
        "📩 Fichier reçu :",
        avatarFile ? avatarFile.originalname : "Aucun fichier"
      );

      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        console.error("⛔ Accès refusé : utilisateur non authentifié.");
        return res
          .status(403)
          .json({ error: "Accès refusé. Authentification requise." });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        console.error("⛔ Utilisateur introuvable.");
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }

      const brand = await Marque.findByPk(brandId);
      if (!brand) {
        console.error("⛔ Marque introuvable.");
        return res.status(404).json({ error: "Marque non trouvée." });
      }

      if (user.role !== "admin" && brand.userId !== userId) {
        console.error("⛔ Permission refusée.");
        return res.status(403).json({ error: "Accès refusé." });
      }

      // 📌 Gestion de l'avatar
      let avatarPath = brand.avatar;

      if (avatarFile) {
        console.log(
          "📂 Avatar en cours de traitement :",
          avatarFile.originalname
        );
        const tempPath = avatarFile.path;
        const finalName = `avatar-${Date.now()}-${brandId}${path.extname(avatarFile.originalname)}`;
        const finalPath = path.join(brandAvatarsDir, finalName);

        console.log("📂 Déplacement du fichier vers :", finalPath);

        // 🔥 Déplacer le fichier temporaire vers le répertoire final
        await moveFileToFinalDestination(tempPath, finalPath);
        avatarPath = `uploads/avatars/brands/${finalName}`;

        console.log("✅ Fichier déplacé :", avatarPath);

        // 🗑 Supprimer l'ancien avatar sécurisé (sauf si c'est un avatar par défaut)
        if (
          brand.avatar &&
          brand.avatar !== "uploads/avatars/brands/default-avatar.png"
        ) {
          console.log("🗑 Suppression de l'ancien avatar :", brand.avatar);
          await deleteOldAvatar(brand.avatar);
        }
      }

      // 🔐 Hash du mot de passe uniquement s'il est fourni
      let hashedPassword = brand.mdp;
      if (mdp && mdp.trim() !== "") {
        console.log("🔒 Hash du mot de passe en cours...");
        hashedPassword = await bcrypt.hash(mdp, 5);
        console.log("✅ Mot de passe hashé !");
      }

      // ✅ Vérifier et formater `offres`
      const allowedOffres = ["freemium", "start", "start pro", "premium"];
      const formattedOffre = offres ? offres.toLowerCase() : brand.offres;

      if (!allowedOffres.includes(formattedOffre)) {
        console.error("⛔ Offre invalide :", formattedOffre);
        return res.status(400).json({ error: "Offre invalide." });
      }

      // 🔄 Mise à jour de la marque
      console.log("🛠️ Mise à jour de la base de données...");
      await brand.update({
        name: name || brand.name,
        email: email || brand.email,
        mdp: hashedPassword,
        avatar: avatarPath,
        offres: formattedOffre,
      });

      console.log("✅ Mise à jour réussie !");

      return res.status(200).json({
        success: true,
        message: "Marque mise à jour avec succès.",
        brand,
      });
    } catch (error) {
      console.error("❌ Erreur interne :", error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  },

  deleteBrand: async function (req, res) {
    try {
      const brandId = req.params.id;

      // Vérifier si la marque existe
      const brand = await Marque.findByPk(brandId);
      if (!brand) {
        return res.status(404).json({ error: "Marque non trouvée." });
      }

      // Supprimer l'avatar de la marque s'il existe
      if (brand.avatar) {
        const avatarPath = path.resolve(brand.avatar);
        await deleteOldAvatar(avatarPath);
      }

      // Supprimer la marque
      await brand.destroy();

      return res
        .status(200)
        .json({ success: true, message: "Marque supprimée avec succès." });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression de la marque :", error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  },

  BrandList: async function (req, res) {
    try {
      // Récupérer l'utilisateur à partir du token
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (userId <= 0) {
        return res.status(400).json({ error: "Paramètres manquants." });
      }

      // Vérifier si l'utilisateur est un administrateur
      const user = await User.findOne({
        where: { id: userId },
      });

      if (!user) {
        return res.status(403).json({ error: "Accès non autorisé." });
      }

      // Récupérer toutes les marques avec les colonnes nécessaires
      const brands = await Marque.findAll({
        attributes: ["id", "name", "email", "avatar", "offres", "createdAt"], // ✅ Assure que ces champs sont récupérés
        order: [["createdAt", "DESC"]], // 🔹 Trie par date de création
      });

      return res.status(200).json({ brands }); // ✅ Retourne un objet JSON avec `brands`
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des marques :", error);
      return res
        .status(500)
        .json({ error: "Impossible de récupérer les marques." });
    }
  },

  getUserStats: async function (req, res) {
    try {
      const headerAuth = req.headers["authorization"];
      const userId = getUserId(headerAuth);

      if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }

      // Vérifier si l'utilisateur existe
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }

      // Récupérer le nombre de signalements faits par cet utilisateur
      const reportsCount = await Reporting.count({
        where: { userId },
      });

      // Récupérer le nombre de coups de cœur faits par cet utilisateur
      const coupsDeCoeurCount = await CoupDeCoeur.count({
        where: { userId },
      });

      // Récupérer le nombre de suggestions faites par cet utilisateur
      const suggestionsCount = await Suggestion.count({
        where: { userId },
      });

      // Calcul du Usear Power (exemple : total de toutes les interactions)
      const usearPower =
        reportsCount * 5 + coupsDeCoeurCount * 3 + suggestionsCount * 2;

      return res.status(200).json({
        reports: reportsCount,
        coupsDeCoeur: coupsDeCoeurCount,
        suggestions: suggestionsCount,
        usearPower,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats :", error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  },
};
