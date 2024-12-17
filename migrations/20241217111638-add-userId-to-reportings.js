"use strict";

export async function up(queryInterface, Sequelize) {
  // Étape 1: Ajouter userId sans contrainte
  await queryInterface.addColumn("Reportings", "userId", {
    type: Sequelize.UUID,
    allowNull: true, // Permet les valeurs NULL temporairement
  });

  // Étape 2: Mettre à jour les lignes existantes
  // Vous devez ici définir une valeur par défaut pour 'userId'.
  // Par exemple, un utilisateur existant ou NULL.
  // Voici un exemple générique pour tout mettre à NULL
  await queryInterface.sequelize.query(`
    UPDATE Reportings SET userId = NULL;
  `);

  // Étape 3: Ajouter la contrainte de clé étrangère
  await queryInterface.changeColumn("Reportings", "userId", {
    type: Sequelize.UUID,
    allowNull: false, // Rendez la colonne obligatoire
    references: {
      model: "Users",
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface) {
  // Suppression de la colonne userId
  await queryInterface.removeColumn("Reportings", "userId");
}
