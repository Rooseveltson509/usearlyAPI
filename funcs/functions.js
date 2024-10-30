// Imports
require("dotenv").config();
const sendmail = require("sendmail")();
const {
  validateMailAccount,
  updatePassword,
} = require("./template-validate-mail");

var nodemailer = require("nodemailer");

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

exports.randomDigit = function randomDigit() {
  //^[0-9]{6,6}$
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
};

exports.randomCode = function (length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
};

exports.checkPassword = function (pwd) {
  return PASSWORD_REGEX.test(pwd);
};

exports.checkZipcode = function (zipCode) {
  return FRENCH_ZIPCODE.test(zipCode);
};

exports.checkPhoneNumber = function (phone) {
  return PHONE_NUMBER.test(phone);
};

exports.checkDateFormatFr = function (date) {
  return REGEX_DATE_FORMAT_FR.test(date);
};

exports.checkCity = function (city) {
  return CITY_STRING.test(city);
};
exports.checkAddress = function (address) {
  return ADDRESS_STRING.test(address);
};

exports.isValidDateFormat = function (dateString) {
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
};

exports.isOver16 = function (dateString) {
  if (!exports.isValidDateFormat(dateString)) {
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
};



exports.checkString = function (text) {
  return ALPHANUMERIC_NUMBER.test(text);
};
exports.getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
exports.getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: users } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, users, totalPages, currentPage };
};

let allowlist = [
  "http://thetiptop.dsp-archiwebo20-ba-rc-js-jl.fr",
  "http://thetiptop.dsp-archiwebo20-ba-rc-js-jl.fr",
  "http://" + process.env.IP_SERVEUR + ":3003",
  "http://" + process.env.IP_SERVEUR + ":4200",
  "http://localhost:3000/",
  "http://localhost:3003/",
  "http://localhost",
  "http://localhost:4200",
];
exports.corsOptionsDelegate = function (req, callback) {
  let corsOptions;
  if (allowlist.indexOf(req.header("Origin")) !== -1) {
    console.log("origin is there : " + allowlist.indexOf(req.header("Origin")));
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    console.log("testet" + allowlist.indexOf(req.header("Origin")));
    corsOptions = { origin: false }; // disable CORS for this request
    //console.log("testet : " + corsOptions.origin)
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

exports.sendConfirmationEmail = function (
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
};

exports.sendEmail = function (userName, toUser, domain, newUserId, token) {
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
};

exports.sentEmail = function (userEmail, token, domain, userId) {
  const transporter = nodemailer.createTransport({
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
};

exports.checkDate = function (date) {
  const exactlyNYearsAgoDate = (yearsAgo) =>
    new Date(new Date().setFullYear(new Date().getFullYear() - yearsAgo));
  const mockBirthday = new Date(date);
  const isAdult = mockBirthday.getTime() < exactlyNYearsAgoDate(16).getTime();
  console.log("isAdult:", isAdult);
};

exports.sendResetPasswordEmail = function (
  toUser,
  toUserName,
  domain,
  userId,
  token
) {
  const transporter = nodemailer.createTransport({
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
};

