"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  console.log("Running test migration UP...");
  await queryInterface.createTable("TestTable", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
  console.log("Test table created.");
}

export async function down(queryInterface) {
  console.log("Running test migration DOWN...");
  await queryInterface.dropTable("TestTable");
  console.log("Test table dropped.");
}
