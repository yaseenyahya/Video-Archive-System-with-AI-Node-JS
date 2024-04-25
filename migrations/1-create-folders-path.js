"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("folders_path", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      path: {
        type: Sequelize.STRING,
        allowNulls: false,
        unique: true
      },
      folder_name:{
        type: Sequelize.STRING,
        allowNulls: false
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
    await queryInterface.dropTable("folders_path");
  },
};
