"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Comments", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    postId: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: "Posts",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    userId: {
      allowNull: false,
      type: Sequelize.UUID,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    content: {
      allowNull: false,
      type: Sequelize.TEXT,
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

  // 🔍 Ajout des index pour optimiser les requêtes
  await queryInterface.addIndex("Comments", ["postId"], {
    name: "index_postId",
  });
  await queryInterface.addIndex("Comments", ["userId"], {
    name: "index_userId",
  });
}

export async function down(queryInterface) {
  // ❌ Suppression des index
  await queryInterface.removeIndex("Comments", "index_postId").catch(() => {});
  await queryInterface.removeIndex("Comments", "index_userId").catch(() => {});

  // ❌ Suppression de la table
  await queryInterface.dropTable("Comments").catch(() => {
    console.warn("Table Comments déjà supprimée.");
  });
}
