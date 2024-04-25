"use strict";
const { Model } = require("sequelize");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class download_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
     
  }
  download_history.init(
    {
      userId: DataTypes.STRING, 
      fileId: DataTypes.STRING,
    },
    {
      sequelize,
      hooks: {
        beforeCreate: function (download_history, options) {
          download_history.createdAt  = dateResolve.getDate();
        },
        beforeUpdate: function (download_history, options) {
          download_history.updatedAt  = dateResolve.getDate();
        },
      },
      modelName: "download_history",
      freezeTableName: true
    }
  );

  return download_history;
};
