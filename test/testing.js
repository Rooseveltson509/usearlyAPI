// import variables
let chai = require("chai");
require("dotenv").config();
const {
  checkPassword,
  checkString,
  checkZipcode,
  checkCity,
  checkAddress
} = require("../funcs/functions");
let config = require("../config/config");
const validator = require("email-validator");
var randomEmail = require("random-email");

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


describe("Should check form validate", () => {

  /**
   * Cas passant
   */
  it("Register form should return 201", () => {

    expect(checkString(userCreateData.nom)).to.deep.equal(true);

    expect(checkString(userCreateData.prenom)).to.deep.equal(true);

    expect(validator.validate(userCreateData.email)).to.deep.equal(true);

    expect(checkPassword(userCreateData.password)).to.deep.equal(true);

    expect(checkAddress(userCreateData.address)).to.deep.equal(true);

    expect(checkZipcode(userCreateData.zipCode)).to.deep.equal(true);

    expect(checkCity(userCreateData.city)).to.deep.equal(true);

    expect(userCreateData.optin).to.be.a("string");
  });

  /**
   * Cas non passant
   */
  it("should be return 400 lastName is not valid", () => {
    expect(checkString("@lastName=100")).to.deep.equal(false);
  });

  it("should be return 400 firstName is not valid", () => {
    expect(checkString("<p>firstName</p>")).to.deep.equal(false);
  });

  it("should be return 400 email is not valid", () => {
    expect(validator.validate("invalidMail.com")).to.deep.equal(false);
  });

  it("should be: password invalid (Min 1 special character - Min 1 number. - Min 8 characters or More)", () => {
    expect(checkPassword("Invalid password")).to.deep.equal(false);
  });

  it("should be return 400 Address is not valid", () => {
    expect(checkAddress("#12 rue nowhere 15200")).to.deep.equal(false);
  });

  it("should be return 400 ZipCode is not valid", () => {
    expect(checkZipcode("R20110")).to.deep.equal(false);
  });

  it("should be return 400 City is not valid", () => {
    expect(checkCity("@my city")).to.deep.equal(false);
  });

});

/**
 * Valid Credentials to login
 */
describe("Login form should return 200", () => {

  it("should be a email and validate true", () => {

    expect(validator.validate(userCredentials.email)).to.deep.equal(true);

    expect(checkPassword(userCredentials.password)).to.deep.equal(true);
  });

 /**
  * Invalid Credentials to login
  */
  it("should be return 400 email is not valid", () => {
    expect(validator.validate("invalidMail.com")).to.deep.equal(false);
  });

  it("should be: password invalid (Min 1 special character - Min 1 number. - Min 8 characters or More)", () => {
    expect(checkPassword("Invalid password")).to.deep.equal(false);
  });

});
