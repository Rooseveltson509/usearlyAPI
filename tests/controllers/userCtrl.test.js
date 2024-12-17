/* import { expect } from "chai";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../../models/index.js"; // Importez votre instance Sequelize
import { user } from "../../routes/usersCtrl.js";

const { User } = db; // Récupérez le modèle User depuis db

describe("updateUserPassword", () => {
  let findOneStub, jwtVerifyStub, bcryptCompareStub, bcryptHashStub;

  before(async () => {
    // Supprimez toutes les tables avant de synchroniser
    await db.sequelize.getQueryInterface().dropAllTables();
    console.log("Toutes les tables ont été supprimées.");

    // Synchronisez les modèles
    await db.sequelize.sync({ force: true });
    console.log("Base de données synchronisée.");
  });

  beforeEach(() => {
    // Stub des méthodes nécessaires
    findOneStub = sinon.stub(User, "findOne");
    jwtVerifyStub = sinon.stub(jwt, "verify");
    bcryptCompareStub = sinon.stub(bcrypt, "compare");
    bcryptHashStub = sinon.stub(bcrypt, "hash");
  });

  afterEach(() => {
    // Restaurer tous les stubs après chaque test
    sinon.restore();
  });

  after(async () => {
    // Fermez la connexion après tous les tests
    await db.sequelize.close();
  });

  it("should update the password successfully", async () => {
    // Mock des valeurs nécessaires
    const mockUser = {
      id: 1,
      password: "hashedOldPassword",
      update: sinon.stub().resolves(),
    };
    findOneStub.resolves(mockUser);
    jwtVerifyStub.returns({ userId: 1 });
    bcryptCompareStub.resolves(true);
    bcryptHashStub.resolves("hashedNewPassword");

    const req = {
      headers: { authorization: "Bearer validToken" },
      body: {
        old_password: "OldP@ssw0rd!",
        password: "NewP@ssw0rd!",
        password_confirm: "NewP@ssw0rd!",
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    await user.updateUserPassword(req, res);

    // Assertions
    expect(findOneStub.calledOnceWith({ where: { id: 1 } })).to.be.true;
    expect(bcryptCompareStub.calledWith("OldP@ssw0rd!", "hashedOldPassword")).to
      .be.true;
    expect(bcryptHashStub.calledWith("NewP@ssw0rd!")).to.be.true;
    expect(mockUser.update.calledOnceWith({ password: "hashedNewPassword" })).to
      .be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(
      res.json.calledWith({
        status: 200,
        success: true,
        message: "Password updated successfully.",
      })
    ).to.be.true;
  });

  it("should return an error if the token is invalid", async () => {
    jwtVerifyStub.throws(new Error("jwt malformed"));

    const req = {
      headers: { authorization: "Bearer invalidToken" },
      body: {
        old_password: "OldP@ssw0rd!",
        password: "NewP@ssw0rd!",
        password_confirm: "NewP@ssw0rd!",
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    await user.updateUserPassword(req, res);

    // Assertions
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ error: "Access denied." })).to.be.true;
  });

  it("should return an error if passwords do not match", async () => {
    jwtVerifyStub.returns({ userId: 1 });

    const req = {
      headers: { authorization: "Bearer validToken" },
      body: {
        old_password: "OldP@ssw0rd!",
        password: "NewP@ssw0rd!",
        password_confirm: "DifferentP@ssw0rd!",
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    await user.updateUserPassword(req, res);

    // Assertions
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ error: "Passwords do not match." })).to.be
      .true;
  });

  it("should return an error if the user is not found", async () => {
    findOneStub.resolves(null);
    jwtVerifyStub.returns({ userId: 1 });

    const req = {
      headers: { authorization: "Bearer validToken" },
      body: {
        old_password: "OldP@ssw0rd!",
        password: "NewP@ssw0rd!",
        password_confirm: "NewP@ssw0rd!",
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    await user.updateUserPassword(req, res);

    // Assertions
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ error: "User not found." })).to.be.true;
  });

  it("should return an error if the old password is incorrect", async () => {
    const mockUser = {
      id: 1,
      password: "hashedOldPassword",
      update: sinon.stub(),
    };
    findOneStub.resolves(mockUser);
    jwtVerifyStub.returns({ userId: 1 });
    bcryptCompareStub.resolves(false);

    const req = {
      headers: { authorization: "Bearer validToken" },
      body: {
        old_password: "WrongOldPassword!",
        password: "NewP@ssw0rd!",
        password_confirm: "NewP@ssw0rd!",
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    await user.updateUserPassword(req, res);

    // Assertions
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ error: "Old password is incorrect." })).to.be
      .true;
  });
});
 */
