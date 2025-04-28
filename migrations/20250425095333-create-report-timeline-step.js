"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("ReportTimelineSteps", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    reportId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Reportings",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    label: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("done", "active", "upcoming"),
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    brandId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Marques",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    createdBy: {
      type: Sequelize.ENUM("user", "brand", "system"),
      allowNull: false,
      defaultValue: "system",
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
  });

  await queryInterface.addIndex("ReportTimelineSteps", ["reportId"]);
  await queryInterface.addIndex("ReportTimelineSteps", ["brandId"]);
  await queryInterface.addIndex("ReportTimelineSteps", ["userId"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ReportTimelineSteps");

  await queryInterface.sequelize.query(
    `DROP TYPE IF EXISTS "enum_ReportTimelineSteps_status";`
  );
  await queryInterface.sequelize.query(
    `DROP TYPE IF EXISTS "enum_ReportTimelineSteps_createdBy";`
  );
}
