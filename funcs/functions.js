// Imports
//require("dotenv").config();
import sendmail from "sendmail";
//const sendmail = require("sendmail")();
//import { validateMailAccount, updatePassword } from "./template-validate-mail.js";

import { createTransport } from "nodemailer";
import { validateMailAccount, updatePassword } from "./TemplateValidate.js";

// Constants
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,}$/;
const ALPHANUMERIC_NUMBER = /^([a-zA-Z0-9_-]){2,50}$/;

let allowlist = [
  "chrome-extension://ehlmingoeepbmgjjalhfhmcpppadingc",
  "http://localhost:5173",
  "https://usearly-frontend.vercel.app",
  "https://usearly-api.vercel.app",
];

export const func = {
  randomCode: function (length, chars) {
    var result = "";
    for (var i = length; i > 0; --i)
      result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  },

  validatePassword: function (password) {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  checkPassword: function (pwd) {
    return PASSWORD_REGEX.test(pwd);
  },

  // Exemple d'utilisation
  /*   const newPassword = generatePassword(12);
  console.log("Mot de passe généré :", newPassword); */

  isValidDateFormat: function (dateString) {
    // Vérifier si la date correspond à l'un des deux formats dd/mm/yyyy ou dd-mm-yyyy
    const regex = /^(\d{2})(\/|-)(\d{2})(\/|-)(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
      return false;
    }

    // Extraire les parties de la date
    const day = parseInt(match[1], 10);
    const month = parseInt(match[3], 10);
    const year = parseInt(match[5], 10);

    // Vérifier que les valeurs du jour, mois, et année sont valides
    const date = new Date(year, month - 1, day); // month - 1 car les mois commencent à 0 en JS
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  },

  validateAndCheckAdult: function (dateString) {
    const regex = /^(\d{2})([-/])(\d{2})\2(\d{4})$/;

    const match = dateString.match(regex);

    if (!match) {
      return {
        isValid: false,
        message:
          "Format de date incorrect. Veuillez utiliser le format 'dd-mm-yyyy' ou 'dd/mm/yyyy'.",
      };
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[3], 10);
    const year = parseInt(match[4], 10);

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return {
        isValid: false,
        message: "La date est invalide. Vérifiez les valeurs fournies.",
      };
    }

    const today = new Date();
    const age =
      today.getFullYear() -
      year -
      (today.getMonth() < month - 1 ||
      (today.getMonth() === month - 1 && today.getDate() < day)
        ? 1
        : 0);

    const isAdult = age >= 18;

    return {
      isValid: true,
      isAdult,
      age,
      date, // Inclure la date transformée ici
      message: isAdult
        ? "L'utilisateur est adulte."
        : "L'utilisateur doit être majeur pour continuer.",
    };
  },

  checkString: function (text) {
    return ALPHANUMERIC_NUMBER.test(text);
  },
  getPagination: function (page, size) {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
  },
  getPagingData: function (data, page, limit) {
    const { count: totalItems, rows: users } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, users, totalPages, currentPage };
  },

  // Middleware CORS dynamique
  corsOptionsDelegate: function (req, callback) {
    const origin = req.header("Origin") || "";
    console.log(`Requête reçue avec origine : ${origin}`);

    let corsOptions;
    if (allowlist.includes(origin)) {
      console.log(`Origine autorisée : ${origin}`);
      corsOptions = {
        origin: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: "Authorization, Content-Type, X-CSRF-Token", // ✅ Ajoute `X-CSRF-Token`
        credentials: true,
      };
    } else {
      console.log(`Origine refusée : ${origin}`);
      corsOptions = { origin: false };
    }

    callback(null, corsOptions);
  },

  sendConfirmationEmail: function (
    toUser,
    toUserName,
    newUserId,
    domain,
    tokenRandom
  ) {
    sendmail(
      {
        from: "furiousducksf2i@gmail.com",
        to: toUser,
        subject: "Email de vérification",
        html: validateMailAccount(toUserName, newUserId, domain, tokenRandom),
      },
      function (err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
      }
    );
  },

  sentEmail: function (userEmail, token, domain, userId) {
    const transporter = createTransport({
      service: "Gmail",
      auth: {
        user: "rooseveltsonc@gmail.com",
        pass: "znizuafixsmybjep",
      },
      port: 587,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });
    const mail_option = {
      from: "rooseveltsonc@gmail.com",
      to: userEmail,
      subject: "Confirmation de votre compte",
      html: validateMailAccount(token, domain, userId),
    };
    transporter.sendMail(mail_option, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent successfully..." + info.messageId);
      }
    });
  },

  sendEmail: function (userEmail, subject, message) {
    console.log("Envoi de l'email à:", userEmail);
    const transporter = createTransport({
      service: "Gmail",
      auth: {
        user: "rooseveltsonc@gmail.com",
        pass: "znizuafixsmybjep",
      },
      port: 587,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });
    const mail_option = {
      from: "rooseveltsonc@gmail.com",
      to: userEmail,
      subject: subject,
      html: message,
    };

    transporter.sendMail(mail_option, (error, info) => {
      if (error) {
        console.log("Erreur lors de l'envoi de l'email:", error);
      } else {
        console.log("Email envoyé avec succès: " + info.messageId);
      }
    });
  },
  checkDate: function (date) {
    const exactlyNYearsAgoDate = (yearsAgo) =>
      new Date(new Date().setFullYear(new Date().getFullYear() - yearsAgo));
    const mockBirthday = new Date(date);
    const isAdult = mockBirthday.getTime() < exactlyNYearsAgoDate(16).getTime();
    console.log("isAdult:", isAdult);
  },

  sendResetPasswordEmail: function (toUser, toUserName, domain, userId, token) {
    const transporter = createTransport({
      service: "Gmail",
      auth: {
        user: "rooseveltsonc@gmail.com",
        pass: "znizuafixsmybjep",
      },
      port: 587,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });
    const mail_option = {
      from: "rooseveltsonc@gmail.com",
      to: toUser,
      subject: "Modifier mon mot de passe.",
      html: updatePassword(toUserName, domain, userId, token),
    };
    transporter.sendMail(mail_option, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent successfully..." + info.messageId);
      }
    });
  },
};
