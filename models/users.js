"use strict";
const { Model } = require("sequelize");
var bcrypt = require("bcrypt");
const dateResolve = require("../dateResolve");
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
     
    }
  }
  Users.init(
    {
      name: DataTypes.STRING,
      avatar: DataTypes.TEXT("long"),
      email: DataTypes.STRING,
      country_code: DataTypes.STRING,
      contact_no: DataTypes.STRING,
      status:DataTypes.ENUM("Block", "Active"),
      block_comments: DataTypes.STRING,
      role: DataTypes.ENUM("Admin", "User"),
      username: {
        type: DataTypes.STRING,
        unique: {
          name: 'username',
          msg: "This username is already in use.",
          fields: [sequelize.fn('lower', sequelize.col('username'))]
        },
      },
      password: DataTypes.STRING,
      settings_json: DataTypes.TEXT("long"),
      designation_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      hooks: {
        beforeCreate: function (user, options) {

         // if(user.password){
        //  const salt = bcrypt.genSaltSync();
        //  user.password = bcrypt.hashSync(user.password, salt);
       //   }
          user.createdAt = dateResolve.getDate();
 
        },
        beforeUpdate: function (user, options) {
         
        //  if(user.changed("password")){
       //   const salt = bcrypt.genSaltSync();
       //   user.password = bcrypt.hashSync(user.password, salt);
      //    }
          user.updatedAt = dateResolve.getDate();
          
        },
      },
      modelName: "users"
    }
  );
  return Users;
};
