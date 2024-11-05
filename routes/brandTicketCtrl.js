require("dotenv").config();
let jwtUtils = require("../utils/jwt.utils");
let models = require("../models");
var asyncLib = require("async");
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // create brand response to usearly ticket
  createBrandTicket: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);
  
    let title = req.body.title;
    let description = req.body.description;
    let ticketStatus = req.body.ticketStatus;
    let idticket = req.params.idticket;
  
    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters..." });
    }
  
    if (
      !title || title.trim().length === 0 ||
      !description || description.trim().length === 0 ||
      !ticketStatus || ticketStatus.trim().length === 0
    ) {
      return res.status(400).json({ error: "all fields must be filled in." });
    }
  
    if (!idticket || idticket.trim().length === 0) {
      return res.status(400).json({ error: "invalid ticket id." });
    }
  
    asyncLib.waterfall(
      [
        function (done) {
          models.Marque.findOne({
            where: { id: userId },
          })
            .then(function (brandFound) {
              done(null, brandFound);
            })
            .catch(function (err) {
              console.error("Error finding brand:", err);
              return res.status(500).json({ error: "cannot find brand." });
            });
        },
        function (brandFound, done) {
          if (brandFound) {
            models.Ticket.findOne({
              where: { id: idticket },
            })
              .then(function (ticketFound) {
                done(null, brandFound, ticketFound);
              })
              .catch(function (err) {
                console.error("Error finding ticket:", err);
                return res.status(500).json({ error: "cannot find ticket." });
              });
          } else {
            return res.status(403).json({ error: "ACCESS DENIED." });
          }
        },
        function (brandFound, ticketFound, done) {
          if (!ticketFound) {
            return res.status(404).json({ error: "ticket not found." });
          }
  
          models.TicketMarque.create({
            id: uuidv4(), // Génération explicite de l'UUID
            ticketId: ticketFound.id,
            title: title,
            marqueId: brandFound.id,
            description: description,
            ticketStatus: ticketStatus,
          })
            .then(function (newTicket) {
              done(newTicket);
            })
            .catch(function (err) {
              console.error("Error creating ticket:", err);
              return res.status(500).json({ err });
            });
        },
      ],
      function (newTicket) {
        if (newTicket) {
          return res.status(201).json(newTicket);
        } else {
          return res.status(500).json({ error: "cannot create ticket" });
        }
      }
    );
  }
  
};
