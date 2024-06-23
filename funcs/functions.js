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
exports.checkCity = function (city) {
  return CITY_STRING.test(city);
};
exports.checkAddress = function (address) {
  return ADDRESS_STRING.test(address);
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

exports.sendResetPasswordEmail = function (
  toUser,
  toUserName,
  domain,
  newUserId,
  resetToken
) {
  sendmail(
    {
      from: "furiousducksf2i@gmail.com",
      to: toUser,
      subject: "Email de vérification",
      html: updatePassword(toUserName, domain, newUserId, resetToken),
    },
    function (err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    }
  );
};

exports.sendEmail = function (
  toUser,
  toUserName,
  domain,
  newUserId,
  resetToken
) {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "deshaun.schmitt29@ethereal.email",
      pass: "gG2QAZXrawFu1XkkZj",
    },
  });

  const info = transporter.sendMail({
      from: '"Usearly Application 😍" <usearly@gmail.com>', // sender address
      to: toUser,
      subject: "Email de vérification",
      text: "Heureux de vous voir", // plain text body
      html: updatePassword(toUserName, domain, newUserId, resetToken),
    },
    function (err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    }
  );
  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
};

