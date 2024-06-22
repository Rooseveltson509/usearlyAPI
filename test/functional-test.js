// import variables
let chai = require("chai");
require("dotenv").config();
const { checkPassword } = require("../funcs/functions");
let config = require("../config/config");
const validator = require("email-validator");
var randomEmail = require("random-email");
let token;
let tokenValidateAccount;
let userId;
let emailConnexion;

var expect = require("chai").expect;
var should = require("should"),
  assert = require("assert"),
  request = require("supertest")(`${process.env.URL}:3000`),
  superagent = require("superagent");

const userCredentials = {
  email: "roose@gmail.com",
  password: "@roose509",
};

const userCreateData = {
  gender: "monsieur",
  nom: "sequez",
  prenom: "sequelize",
  email: randomEmail(),
  password: "@roose509",
  password_confirm: "@roose509",
  address: "15 rue de la tour eifel",
  zipCode: "95100",
  city: "Argenteuil",
  optin: "yes",
};

/**
 * Register
 */

describe("User register", function () {
  it("should return status OK (201)", function (done) {
    request
      .post(`${config.rootAPI}user/register`)
      .type("form")
      .send(userCreateData)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.ok(res.status, 201);
        res.status.should.be.equal(201);
        emailConnexion = res.body.email;

        done();
      });
  });
});


describe("Email validation", function () {
  it("should return status OK (200)", function (done) {
    request
      .get(`${config.rootAPI}/user/test/validate/${emailConnexion}`)
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        assert.ok(res.status, 200);
        res.status.should.be.equal(200);
        const userId = res.body.id;
        const tokenValidateAccount = res.body.confToken;
        request
          .get(`${config.rootAPI}/user/mailValidation`)
          .query({userId: userId, token: tokenValidateAccount})
          .end(function (res) {
            done();
          })
      });
  });
});

/**
 * Login
 */
/**/
describe("User LOGIN", function () {
  it("should return status OK (200)", function (done) {
    request
      .post(`${config.rootAPI}user/login`)
      .type("form")
      .send({
        email: emailConnexion,
        password: userCreateData.password,
      })
      .end(function (err, res) {
        if (err) {
          throw err;
        }
        token = res.body.token;
        assert.ok(res);
        assert.ok(res.body);
        assert.ok(res.status, 200);
        res.body.should.have.property("token");
        done();
      });
  });
});
