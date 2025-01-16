"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Users", {
    unique: true,
    fields: "email",
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    gender: {
      type: Sequelize.ENUM,
      allowNull: true,
      values: ["monsieur", "madame", "N/A"],
      defaultValue: "N/A",
    },
    pseudo: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    email: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true, // Ajout de l'unicité pour garantir qu'un email ne soit pas dupliqué
    },
    password: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    role: {
      type: Sequelize.ENUM,
      values: ["user", "admin"],
      defaultValue: "user",
    },
    born: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    avatar: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    confirmationToken: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    confirmedAt: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    resetToken: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    resetAt: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    expiredAt: {
      allowNull: true,
      type: Sequelize.DATE,
    },
    rememberToken: {
      allowNull: true,
      type: Sequelize.STRING,
    },
    optin: {
      type: Sequelize.ENUM,
      values: ["yes", "no"],
      defaultValue: "no",
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Users");
  await queryInterface.sequelize.query(
    // prettier-ignore
    "DROP TYPE IF EXISTS \"enum_Users_gender\";"
  );
  await queryInterface.sequelize.query(
    // prettier-ignore
    "DROP TYPE IF EXISTS \"enum_Users_role\";"
  );
  await queryInterface.sequelize.query(
    // prettier-ignore
    "DROP TYPE IF EXISTS \"enum_Users_optin\";"
  );
}
