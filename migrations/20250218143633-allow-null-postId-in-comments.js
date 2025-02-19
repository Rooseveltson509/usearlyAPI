"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Comments", "postId", {
    allowNull: true, // ✅ Permet NULL pour éviter l'erreur
    type: Sequelize.UUID,
    references: {
      model: "Posts",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Comments", "postId", {
    allowNull: false, // ❌ Remet postId obligatoire si nécessaire
    type: Sequelize.UUID,
    references: {
      model: "Posts",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}
