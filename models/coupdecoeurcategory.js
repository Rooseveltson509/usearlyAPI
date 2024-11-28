'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CoupDeCoeurCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relation avec la table CoupDeCoeurs
      CoupDeCoeurCategory.belongsTo(models.CoupDeCoeur, {
        foreignKey: 'coupDeCoeurId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      // Relation avec la table Categories
      CoupDeCoeurCategory.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  CoupDeCoeurCategory.init(
    {
      coupDeCoeurId: {
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
      modelName: 'CoupDeCoeurCategory',
    }
  );

  return CoupDeCoeurCategory;
};