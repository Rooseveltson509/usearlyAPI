// Imports
//require("dotenv").config();
import sendmail from "sendmail";
//const sendmail = require("sendmail")();
//import { validateMailAccount, updatePassword } from "./template-validate-mail.js";

import { createTransport } from "nodemailer";
import {validateMailAccount, updatePassword} from "./TemplateValidate.js";

// Constants
const PASSWORD_REGEX = /^(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,}$/;
const PHONE_NUMBER =
  /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/;
const ALPHANUMERIC_NUMBER = /^([a-zA-Z0-9_-]){2,50}$/;
const FRENCH_ZIPCODE = /^[0-9]{5}$/;
const CITY_STRING = /^[a-zA-Z',.\s-]{1,25}$/;
const ADDRESS_STRING = /^[a-zA-Z0-9\s,.'-]{3,}$/;
// Check the pattern (dd/mm/yyyy or dd-mm-yyyy)
const REGEX_DATE_FORMAT_FR = /^(0[1-9]|[12][0-9]|3[01])[-\/](0[1-9]|1[0-2])[-\/](19|20)\d\d$/;


let allowlist = [
  "chrome-extension://fjcggidednblenggahpkilfidbalhmad",
  "https://www.nike.com",
  "https://usearly-api.vercel.app",
];


export const func = {

  randomDigit:  function() {
    //^[0-9]{6,6}$
    var result = "";
    for (var i = length; i > 0; --i)
      result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  },

  randomCode: function (length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
},

checkPassword: function (pwd) {
  return PASSWORD_REGEX.test(pwd);
},

checkZipcode: function (zipCode) {
  return FRENCH_ZIPCODE.test(zipCode);
},
checkPhoneNumber: function (phone) {
  return PHONE_NUMBER.test(phone);
},

checkDateFormatFr: function  (date) {
  return REGEX_DATE_FORMAT_FR.test(date);
},
checkCity: function (city) {
  return CITY_STRING.test(city);
},
checkAddress: function (address) {
  return ADDRESS_STRING.test(address);
},

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

isOver16: function (dateString) {
  if (!isValidDateFormat(dateString)) {
    return false;
  }

  const today = new Date();
  const [day, month, year] = dateString.includes('/')
    ? dateString.split('/')
    : dateString.split('-');

  const birthDate = new Date(year, month - 1, day);

  // Calculer l'âge en comparant avec la date actuelle
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
},

checkString: function (text) {
  return ALPHANUMERIC_NUMBER.test(text);
},
getPagination: function (page, size) {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;

  return { limit, offset };
},
getPagingData: function(data, page, limit) {
  const { count: totalItems, rows: users } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, users, totalPages, currentPage };
},


corsOptionsDelegate: function (req, callback) {
  const origin = req.header("Origin") || "";
  console.log(`Requête reçue avec origine : ${origin}`);
  
  let corsOptions;
  if (allowlist.includes(origin)) {
    console.log(`Origine autorisée : ${origin}`);
    corsOptions = {
      origin: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders: "Authorization,Content-Type",
      credentials: true,
    };
  } else {
    console.log(`Origine refusée : ${origin}`);
    corsOptions = { origin: true };
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

sendEmail: function (userName, toUser, domain, newUserId, token) {
  let config = {
    service: "gmail",
    auth: {
      user: "rooseveltsonc@gmail.com",
      pass: "ppxuztwypmslvddp",
    },
  };

  var mailOptions = {
    from: "rooseveltsonc@gmail.com",
    to: `${toUser}`,
    subject: "Toute l'équipe Usearly vous souhaite la bienvenue!",
    text: "That was easy",
  };

  transporter.sendMail(mailOptions, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
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

checkDate: function (date) {
  const exactlyNYearsAgoDate = (yearsAgo) =>
    new Date(new Date().setFullYear(new Date().getFullYear() - yearsAgo));
  const mockBirthday = new Date(date);
  const isAdult = mockBirthday.getTime() < exactlyNYearsAgoDate(16).getTime();
  console.log("isAdult:", isAdult);
},

sendResetPasswordEmail: function  (
  toUser,
  toUserName,
  domain,
  userId,
  token
) {
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
}

}