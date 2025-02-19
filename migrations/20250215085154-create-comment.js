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
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: "Posts",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    reportId: {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: "Reportings",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    suggestionId: {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: "Suggestions",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    coupDeCoeurId: {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: "CoupdeCoeurs",
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

  // 🔍 Ajout d'index pour optimiser les performances
  await queryInterface.addIndex("Comments", ["postId"], {
    name: "index_postId",
  });
  await queryInterface.addIndex("Comments", ["reportId"], {
    name: "index_reportId",
  });
  await queryInterface.addIndex("Comments", ["suggestionId"], {
    name: "index_suggestionId",
  });
  await queryInterface.addIndex("Comments", ["coupDeCoeurId"], {
    name: "index_coupDeCoeurId",
  });
  await queryInterface.addIndex("Comments", ["userId"], {
    name: "index_userId",
  });
}

export async function down(queryInterface) {
  // ❌ Suppression des index
  await queryInterface.removeIndex("Comments", "index_postId").catch(() => {});
  await queryInterface
    .removeIndex("Comments", "index_reportId")
    .catch(() => {});
  await queryInterface
    .removeIndex("Comments", "index_suggestionId")
    .catch(() => {});
  await queryInterface
    .removeIndex("Comments", "index_coupDeCoeurId")
    .catch(() => {});
  await queryInterface.removeIndex("Comments", "index_userId").catch(() => {});

  // ❌ Suppression de la table
  await queryInterface.dropTable("Comments").catch(() => {
    console.warn("Table Comments déjà supprimée.");
  });
}
