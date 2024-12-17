"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Création de la table Categories
  await queryInterface.createTable("Categories", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    siteTypeId: {
      type: Sequelize.UUID,
      references: { model: "SiteTypes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
  // Ajout d'un index unique pour accélérer les recherches
  await queryInterface.addIndex("Categories", ["name"], {
    unique: true,
    name: "unique_category_name",
  });
}

export async function down(queryInterface) {
  // Supprime l'index en premier
  await queryInterface
    .removeIndex("Categories", "unique_category_name")
    .catch(() => {
      console.warn(
        "Index 'unique_category_name' already removed or does not exist."
      );
    });

  // Ensuite supprime la table
  await queryInterface.dropTable("Categories");
}
