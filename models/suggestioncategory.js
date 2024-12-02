'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class SuggestionCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Définir les associations ici
      SuggestionCategory.belongsTo(models.Suggestion, {
        foreignKey: 'suggestionId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      SuggestionCategory.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  SuggestionCategory.init(
    {
      suggestionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SuggestionCategory',
      tableName: 'SuggestionCategories', // S'assurer que le nom correspond à la table créée par la migration
      timestamps: true, // Inclut `createdAt` et `updatedAt` dans les enregistrements
    }
  );

  return SuggestionCategory;
};