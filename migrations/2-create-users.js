"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNulls: true,
      },
      avatar: {
        type: Sequelize.TEXT("long"),
        allowNulls: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNulls: true,
      },
      country_code: {
        type: Sequelize.STRING,
        allowNulls: false,
      },
     
      contact_no: {
        type: Sequelize.STRING,
        allowNulls: false,
        unique: {
          args: true,
          msg: "Contact no already in use.",
        },
      },
      status: {
        type: Sequelize.ENUM("Block", "Active"),
      },
      block_comments: {
        type: Sequelize.STRING,
        allowNulls: true,
      },
      role: {
        type: Sequelize.ENUM("Admin", "User"),
      },
      username: {
        type: Sequelize.STRING,
        allowNulls: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNulls: false,
      }, 
      settings_json: {
        type: Sequelize.TEXT("long"),
        allowNulls: true,
      }, 
      designation_id:{
        type: Sequelize.INTEGER,
        references: {
          model: 'designations', 
          key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },     
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }); 
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
