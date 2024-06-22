require("dotenv").config();
let bcrypt = require("bcryptjs");
let jwtUtils = require("../utils/jwt.utils");
let models = require("../models");
var asyncLib = require("async");
const { randomCode } = require("../funcs/functions");
const { checkPassword } = require("../funcs/functions");
const Sequelize = require("sequelize");
const validator = require("email-validator");
const Op = Sequelize.Op;

module.exports = {
  // Find User Ticket By code
  getTicketByCodeEmploye: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var code = req.params.code;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.User.findOne({
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          models.Ticket.findOne({
            attributes: ["userId", "gain", "etat", "code"],
            where: { code: code, userId: user.id },
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
              res.status(404).json({ error: "cannot fetch Ticket......" });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },
  // update user password
  updateEmployeePassword: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Params
    let password = req.body.password;
    let password_confirm = req.body.password_confirm;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    if (!checkPassword(password)) {
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
          models.Employe.findOne({
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

    // update employe profile by admin
    updateUserProfileEmployeByAdmin: function (req, res) {
      // Getting auth header
      var headerAuth = req.headers["authorization"];
      var userId = jwtUtils.getUserId(headerAuth);
  
         // Params
    let password = req.body.password;
    let password_confirm = req.body.password_confirm;
    let email = req.params.email;

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }
    
    if (!checkPassword(password)) {
      return res.status(304).json({
        error:
          "password invalid (Min 1 special character - Min 1 number. - Min 8 characters or More)",
      });
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: "passwords do not match." });
    }
    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }
      asyncLib.waterfall(
        [
          function (done) {
            models.User.findOne({
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
              models.Employe.findOne({
                where: { email: email },
              })
                .then(function (userFound) {
                  done(null, userFound);
                })
                .catch(function (err) {
                  return res.status(500).json({ error: "unable to verify user" });
                });
            } else {
              res.status(500).json({ error: "Access denied" });
            }
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
         /*  function (userFound, done) {
            if (userFound) {
              userFound
                .update({
                  nom: nom ? nom : userFound.nom,
                  prenom: prenom ? prenom : userFound.prenom,
                  email: newEmail ? newEmail : userFound.email,
                })
                .then(function () {
                  done(userFound);
                })
                .catch(function (err) {
                  res.status(500).json({ error: "cannot update employe" });
                });
            } else {
              res.status(404).json({ error: "employe not found" });
            }
          }, */
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
  updateEmployeePasswordByAdmin: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Params
    let password = req.body.password;
    let password_confirm = req.body.password_confirm;
    let email = req.params.email;

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }
    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    if (!checkPassword(password)) {
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
          models.Employe.findOne({
            where: { id: userId, email: email },
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

  // Find all Tickets from user
  getAllTicketsFromUserEmploye: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
    var code = req.params.code;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.User.findOne({
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          models.Ticket.findAll({
            attributes: ["gain", "etat", "code"],
            where: { userId: userId },
          })
            .then(function (ticket) {
              if (ticket) {
                return res.status(200).json(ticket);
              } else {
                return res.status(404).json({ error: "Ticket not found" });
              }
            })
            .catch(function (err) {
              res.status(404).json({ error: "cannot fetch Ticket......" });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },
  // Find User Ticket By code
  assignedTicketForUser: function (req, res) {
    // Getting auth header
    let headerAuth = req.headers["authorization"];
    let userId = jwtUtils.getUserId(headerAuth);
    let code = req.params.code;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    asyncLib.waterfall(
      [
        function (done) {
          models.Employe.findOne({
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
            models.Ticket.findOne({
              where: { code: code, etat: "distribue" },
            })
              .then(function (ticketFound) {
                done(null, ticketFound, userFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot fetch ticket" });
              });
          } else {
            res.status(404).json({ error: "user not found" });
          }
        },
        function (ticketFound, userFound, done) {
          if (ticketFound) {
            ticketFound
              .update({
                userId: ticketFound.userId,
                etat: "valide",
                magasin: userFound.magasin,
                validateAt: new Date(),
                where: { id: ticketFound.id },
              })
              .then(function () {
                done(ticketFound);
              })
              .catch(function (err) {
                res.status(500).json({ error: "cannot update ticket" });
              });
          } else {
            res.status(404).json({ error: "ticket not found..." });
          }
        },
      ],
      function (ticketFound) {
        if (ticketFound) {
          return res
            .status(200)
            .json({ msg: "the ticket has been assigned with success." });
        } else {
          return res.status(500).json({ error: "cannot update ticket" });
        }
      }
    );
  },

  // employee account after login
  getEmployeeProfile: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    // Params
    let email = req.params.email;

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "email is not valid" });
    }

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.Employe.findOne({
      where: { email: email, id: userId },
    })
      .then(function (user) {
        if (user) {
          res.status(201).json(user);
        } else {
          res.status(404).json({ error: "user not found" });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch this user" });
      });
  },

  // FIND AND COUNT ALL TICKET
  findAndCountTickets: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.Employe.findOne({
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          models.Ticket.findAll({
            attributes: [
              "gain",
              [Sequelize.fn("COUNT", Sequelize.col("gain")), "count"],
            ],
            group: "gain",
            raw: true,
            logging: true,
          })
            .then((data) => {
              console.log("Query Result", data);
              return res.status(200).json(data);
            })
            .catch(function (err) {
              res.status(404).json({ error: "cannot fetch Ticket......" });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },

  // FIND AND DISPLAY REMAINING TICKETS
  findRemainingTickets: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.Employe.findOne({
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          models.Ticket.findAll({
            attributes: [
              "gain",
              [Sequelize.fn("COUNT", Sequelize.col("gain")), "remaining"],
            ],
            group: "gain",
            raw: true,
            logging: true,
            where: { etat: "non-distribue" },
          })
            .then((data) => {
              console.log("Query Result", data);
              return res.status(200).json(data);
            })
            .catch(function (err) {
              res.status(404).json({ error: "cannot fetch Ticket......" });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },

  // found the winning tickets
  findTheWinningTicket: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters" });
    }

    models.Employe.findOne({
      where: { id: userId },
    })
      .then(function (user) {
        if (user) {
          models.Ticket.findAll({
            attributes: [
              "gain",
              [Sequelize.fn("COUNT", Sequelize.col("gain")), "win"],
            ],
            group: "gain",
            where: { etat: "valide" },
            raw: true,
            logging: true,
          })
            .then((data) => {
              console.log("Query Result", data);
              return res.status(200).json(data);
            })
            .catch(function (err) {
              res.status(404).json({ error: "cannot fetch Ticket......" });
            });
        } else {
          return res.status(404).json({ error: "Accès non autorisé....." });
        }
      })
      .catch(function (err) {
        res.status(500).json({ error: "cannot fetch Ticket..." });
      });
  },
};
