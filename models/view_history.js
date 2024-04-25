"use strict";
const { Model } = require("sequelize");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class view_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
     
  }
  view_history.init(
    {
      userId: DataTypes.STRING, 
      fileId: DataTypes.STRING,
    },
    {
      sequelize,
      hooks: {
        beforeCreate: function (view_history, options) {
          view_history.createdAt  = dateResolve.getDate();
        },
        beforeUpdate: function (view_history, options) {
 
          view_history.updatedAt  = dateResolve.getDate();
        },
      },
      modelName: "view_history",
      freezeTableName: true
    }
  );

  return view_history;
};
