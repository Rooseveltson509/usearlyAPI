"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("SiteTypes", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    name: {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true, // Unicité au niveau de la colonne
    },
    description: {
      allowNull: true,
      type: Sequelize.TEXT,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  });

  // Supprimer l'index existant s'il y en a un
  await queryInterface.sequelize
    .query("DROP INDEX IF EXISTS `unique_siteType_name` ON `SiteTypes`")
    .catch(() => {
      console.warn("Index `unique_siteType_name` inexistant, aucune action.");
    });

  // Ajouter un index unique pour `name`
  await queryInterface.addIndex("SiteTypes", ["name"], {
    unique: true,
    name: "unique_siteType_name",
  });
}

export async function down(queryInterface) {
  // Supprimer l'index unique avant de supprimer la table
  await queryInterface
    .removeIndex("SiteTypes", "unique_siteType_name")
    .catch(() => {
      console.warn("Index `unique_siteType_name` déjà supprimé ou inexistant.");
    });

  // Supprimer la table SiteTypes
  await queryInterface.dropTable("SiteTypes");
}
