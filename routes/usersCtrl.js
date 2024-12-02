// Imports
import db from '../models/index.js'; // Import du fichier contenant les modèles Sequelize
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from "bcryptjs";
import { generateTokenForUser, getUserId } from '../utils/jwtUtils.js';
const { User } = db;
import asyncLib from "async";

//let bcrypt = require("bcryptjs");
//let jwtUtils = require("../utils/jwtUtils");
//let models = require("../models");
//let asyncLib = require("async");
import randToken from 'rand-token';
const { uid } = randToken;
import validator from 'email-validator';
//const validator = require("email-validator");
/* const {
  checkPassword,
  checkPhoneNumber,
  checkString,
  sentEmail,
  isValidDateFormat,
  isOver16,
  sendResetPasswordEmail,
  getPagination,
  getPagingData,
} = require("../funcs/functions"); */


import { func } from '../funcs/functions.js';

/* const Sequelize = require("sequelize");
const Op = Sequelize.Op; */

import Sequelize from 'sequelize';
const { Op } = Sequelize;
//import { randomCode } from "../funcs/functions";

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
              return res.status(500).json({ error: "unable to verify the user" });
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
  login: function (req, res) {
    // Params
    var email = req.body.email;
    var password = req.body.password;

    if (email == null || password == null) {
      return res.status(400).json({ error: "missing parameters" });
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
              return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userFound, done) {
          if (userFound && userFound.confirmedAt !== null) {
            bcrypt.compare(
              password,
              userFound.password,
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
            token: generateTokenForUser(userFound),
          });
        } else {
          return res.status(500).json({ error: "cannot log on user" });
        }
      }
    );
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
    let size = parseInt(req.params.page);

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
  getUserByEmail: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);
    var email = req.params.email;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }
    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }
    User.findOne({
      where: { id: userId, role: "admin" },
    })
      .then(function (user) {
        if (user) {
          User.findAll({
            where: { email: email },
          })
            .then(function (user2) {
              if (user2) {
                return res.status(200).json(user2);
              } else {
                return res.status(404).json({ error: "User not found" });
              }
            })
            .catch(function (err) {
              res
                .status(404)
                .json({ error: "cannot fetch user......" + email });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch user..." });
      });
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
  updateUserPassword: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    // Params
    let password = req.body.password;
    let password_confirm = req.body.password_confirm;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    if (!func.checkPassword(password)) {
      return res.status(304).json({
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
            bcrypt.hash(password, 5, function (err, bcryptedPassword) {
              done(null, userFound, bcryptedPassword);
            });
          } else {
            return res.status(409).json({ error: "user not exist" });
          }
        },
        function (userFound, bcryptedPassword, done) {
          if (userFound) {
            userFound
              .update({
                password: bcryptedPassword,
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
          return res.status(500).json({ error: "cannot update user pwd" });
        }
      }
    );
  },

  // update user profile by admin
  updateUserProfileByAdmin: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    // Params
    let email = req.params.email;
    let nom = req.body.nom;
    let prenom = req.body.prenom;
    var address = req.body.address;
    var city = req.body.city;
    var zipCode = req.body.zipCode;
    let phone = req.body.phone;

    if (!func.checkString(nom)) {
      return res.status(400).json({
        error:
          "Invalid last name (Must be alphaNumerate Min 3 characters  - Max 50 characters)",
      });
    }

    if (!func.checkString(prenom)) {
      return res.status(400).json({
        error:
          "firstname invalid (Must be alphaNumerate Min 3 characters  - Max 50 characters)",
      });
    }
    if (!checkZipcode(zipCode)) {
      return res.status(400).json({
        error: "Invalid ZipCode (Must be Numerate with 5 characters)",
      });
    }
    if (!checkCity(city)) {
      return res.status(400).json({ error: "Invalid City (Only alphabetic)" });
    }
    if (!checkAddress(address)) {
      return res.status(400).json({
        error: "Invalid Address (Must be alphaNumerate with (space))",
      });
    }

    if (!func.checkPhoneNumber(phone)) {
      return res.status(400).json({
        error:
          "Phone Number invalid (example : 06 01 02 03 04 | 06-01-02-03-04 | +33 6 01 02 03 04 |  0033 6 01 02 03 04)",
      });
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
            userFound
              .update({
                last_name: nom ? nom : userFound.nom,
                first_name: prenom ? prenom : userFound.prenom,
                address: address ? address : userFound.address,
                city: city ? city : userFound.city,
                zipCode: zipCode ? zipCode : userFound.zipCode,
                phoneNumber: phone ? phone : userFound.phoneNumber,
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
  // delete user by admin
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
          return res.status(200).json({ msg: "User has been deleted successfully" });
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
      mdp.trim().length === 0) {
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
          let newBrand = Marque.create({
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
