"use strict";
const { Model } = require("sequelize");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class Mod_Details extends Model {
    static associate(models) {
     
    }
  }
  Mod_Details.init(
    {
      fileId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      transcriptionText: DataTypes.TEXT("long"),
      createdAt:DataTypes.DATE,
      updatedAt:DataTypes.DATE
    },
    {
      sequelize,
      hooks: {
        beforeCreate: function (mod_detail, options) {

        
          mod_detail.createdAt = dateResolve.getDate();
         
 
        },
        beforeUpdate: function (mod_detail, options) {
         //only for mod details because i am updating createddetails to get data
          mod_detail.createdAt = dateResolve.getDate();
          mod_detail.updatedAt = dateResolve.getDate();
          
        }
       
      },
      modelName: "mod_details"
    }
  );
  return Mod_Details;
};
