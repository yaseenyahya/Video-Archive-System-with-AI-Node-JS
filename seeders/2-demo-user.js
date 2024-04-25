"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
   await queryInterface.sequelize.query(
      "INSERT INTO `users`( `name`, `avatar`, `email`, `country_code`, `contact_no`, `role`,`status`,`block_comments`, `username`, `password`,`settings_json`,`designation_id`,`createdAt`,`updatedAt`) VALUES ('demo',NULL,'yaseenyahya021@gmail.com',NULL,NULL,'User','Active',NULL,'demo','demo',NULL,1,NOW(),NOW())"
    );
    await queryInterface.sequelize.query(
      "INSERT INTO `users`( `name`, `avatar`, `email`, `country_code`, `contact_no`, `role`,`status`,`block_comments`, `username`, `password`,`settings_json`,`designation_id`,`createdAt`,`updatedAt`) VALUES ('demoadmin',NULL,'yaseenyahya021@gmail.com',NULL,NULL,'Admin','Active',NULL,'demoadmin','demo',NULL,1,NOW(),NOW())"
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
