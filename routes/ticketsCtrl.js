/* let bcrypt = require("bcryptjs");
let jwtUtils = require("../utils/jwtUtils");
let models = require("../models");
var asyncLib = require("async");

let Os = require("os"); */

import db from "../models/index.js"; // Import du fichier contenant les modèles Sequelize
import Os from "os";
const { User, Reporting, Ticket } = db;
import asyncLib from "async";
import { getUserId } from "../utils/jwtUtils.js";
import dotenv from "dotenv";
dotenv.config();

export const ticket = {
  create: function (req, res) {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = getUserId(headerAuth);

    let marque = req.body.marque;
    let title = req.body.title;
    let category = req.body.category;
    let criticality = req.body.criticality;
    let blocking = req.body.blocking;
    let bugLocation = req.body.bugLocation;
    let emojis = req.body.emojis;
    let tips = req.body.tips;
    let idReporting = req.params.idReporting;

    if (userId <= 0) {
      return res.status(400).json({ error: "missing parameters... " });
    }

    if (
      marque.trim().length === 0 ||
      title.trim().length === 0 ||
      category.trim().length === 0 ||
      criticality.trim().length === 0 ||
      blocking.trim().length === 0 ||
      bugLocation.trim().length === 0 ||
      emojis.trim().length === 0 ||
      tips.trim().length === 0
    ) {
      return res.status(400).json({ error: "all fields must be filled in." });
    }
    asyncLib.waterfall(
      [
        function (done) {
          User.findOne({
            where: { id: userId, role: "admin" },
          })
            .then(function (userFound) {
              done(null, userFound);
            })
            .catch(function (err) {
              return res
                .status(500)
                .json({ error: "unable to verify user ...", err });
            });
        },
        function (userFound, done) {
          if (userFound) {
            Reporting.findOne({
              where: { id: idReporting },
            })
              .then(function (report) {
                done(null, userFound, report);
              })
              .catch(function (err) {
                return res
                  .status(500)
                  .json({ error: "unable to verify ticket.", err });
              });
          } else {
            res.status(403).json({ error: "ACCESS DENIED." });
          }
        },
        function (userFound, report, done) {
          Ticket.create({
            reportingId: idReporting,
            userId: userId,
            email: userFound.email,
            marque: marque,
            title: title,
            category: category,
            blocking: blocking,
            emojis: emojis,
            bugLocation: bugLocation,
            tips: tips,
            criticality: criticality,
            configuration: Os.platform(),
          })
            .then(function (newTicket) {
              done(newTicket);
            })
            .catch(function (err) {
              return res.status(500).json({ err });
            });
        },
      ],
      function (newTicket) {
        if (newTicket) {
          return res.status(201).json(newTicket);
        } else {
          return res.status(500).json({ error: "can not create ticket" });
        }
      }
    );
  },
};
