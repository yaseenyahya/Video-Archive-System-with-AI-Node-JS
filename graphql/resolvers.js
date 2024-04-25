var db = require("../models/index");
var bcrypt = require("bcrypt");
var { AuthenticationError } = require("apollo-server");
const { Op, col, fn } = require("sequelize");
const { RedisPubSub } = require("graphql-redis-subscriptions");
const otherconfig = require("../config/otherconfig.json");
const env = process.env.NODE_ENV || "development";
const otherConfig = otherconfig[env];
const fileCatcher = require("../fileCatcher");
const { convert } = require('html-to-text');
const files = require('../models/files');
const users = require('../models/users');
const resolveFuntions = require("./resolveFuntions");
const _ = require('lodash');
const dateResolve = require("../dateResolve");

const pubsub = new RedisPubSub({
  connection: otherConfig.REDIS_URL,
});

const REFRESH_FOLDER = "REFRESH_FOLDER";
const REFRESH_FOLDER_ALL = "REFRESH_FOLDER_ALL";
const TRANSCRIPTION_CHANGED = "TRANSCRIPTION_CHANGED";
module.exports = {
  Subscription: {
    refreshfoldercallback: {
      subscribe: () => pubsub.asyncIterator(REFRESH_FOLDER),
    },
    refreshfoldercallbackall: {
      subscribe: () => pubsub.asyncIterator(REFRESH_FOLDER_ALL),
    },
    transcriptionchangedcallbackall: {
      subscribe: () => pubsub.asyncIterator(TRANSCRIPTION_CHANGED),
    }
  },
  Query: {
    get_user: async (parent, args, { res, resolver }) => {
      const user = await db.users.findOne({
        where: {
          id: args.user_id,
        },
        order: [["id", "DESC"]],
      });

      return user;
    },
    get_users: async (parent, args, { res, resolver }) => {
      const users = await db.users.findAll({

        order: [["id", "DESC"]],
      });

      return users;
    },
    get_designations: async (parent, args, { res, resolver }) => {
      const designations = await db.designations.findAll({
        order: [["id", "DESC"]],
      });

      return designations;
    },
    get_folders_path: async (parent, args) => {
      const folders_path = await db.folders_path.findAll({
        order: [["id", "DESC"]],
      });



      return folders_path;
    },
    get_folders_files_from_path: async (parent, args, { res, resolver }) => {
      const files = fileCatcher.scanDirectoryForTest(args.folderPath);

      return files;
    },
    get_folders_files_from_folder_id_with_notify: async (parent, args, { res, resolver }) => {

      return {
        notify:args.notify,
        folderId: args.folderId,
        files: global.files["id" + args.folderId] ? global.files["id" + args.folderId] : [],
      };
    },
    get_folders_files_from_folder_id: async (parent, args, { res, resolver }) => {

      return {
        folderId: args.folderId,
        files: global.files["id" + args.folderId] ? global.files["id" + args.folderId] : [],
      };
    },
    get_folders_files_from_folder_id_db_filter: async (parent, args) => {
      let startDate = dateResolve.getMomentDateWithParam(args.startDate);
      startDate.startOf('day');
      let endDate = dateResolve.getMomentDateWithParam(args.endDate);
      endDate.endOf('day');

      // Query the database for records with today's date
      const allFiles = await db.files.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          folderId: args.folderId
        },
        order: [['createdAt', 'DESC']],
        raw: true
      });

      let filteredResults = null;

      if (args.searchText && args.searchText.length > 0) {
        filteredResults = allFiles.map(result => {
          const transcriptionHTML = result.transcription;
          const transcriptionConvertedText = convert(transcriptionHTML, {
            wordwrap: false
          });


          const searchTextRegex = new RegExp(args.searchText, 'gi');
          if (transcriptionConvertedText.match(searchTextRegex) ||
            result.filename.match(searchTextRegex)) {
            return {
              ...result,
              truncatedTranscriptionText: resolveFuntions.truncateText(transcriptionConvertedText, 6, 30)
            }
          }
        }).filter(Boolean);
      } else {
        filteredResults = allFiles.map(result => {
          const transcriptionConvertedText = convert(result.transcription, {
            wordwrap: false
          });

          return {
            ...result,
            truncatedTranscriptionText: resolveFuntions.truncateText(transcriptionConvertedText, 6, 30)
          }

        });
      }

      return {
        currentDateTime: dateResolve.getMomentDate(),
        folderId: args.folderId,
        searchText: args.searchText,
        startDate: args.startDate,
        endDate: args.endDate,
        files: filteredResults
      }
    },
    get_folders_db_filter: async (parent, args) => {
      let startDate = dateResolve.getMomentDateWithParam(args.startDate);
      startDate.startOf('day');
      let endDate = dateResolve.getMomentDateWithParam(args.endDate);
      endDate.endOf('day');

      // Query the database for records with today's date
      const allFiles = await db.files.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
          folderId: {
            [Op.in]: args.folderIds
          }
        },
        order: [['createdAt', 'DESC']],
        raw: true
      });

      let filteredResults = null;

      if (args.searchText && args.searchText.length > 0) {
        filteredResults = allFiles.map(result => {
          const transcriptionHTML = result.transcription;
          const transcriptionConvertedText = convert(transcriptionHTML, {
            wordwrap: false
          });


          const searchTextRegex = new RegExp(args.searchText, 'gi');
          if (transcriptionConvertedText.match(searchTextRegex) ||
            result.filename.match(searchTextRegex)) {
            return {
              ...result,
              truncatedTranscriptionText: resolveFuntions.truncateText(transcriptionConvertedText, 6, 30)
            }
          }
        }).filter(Boolean);
      } else {
        filteredResults = allFiles.map(result => {
          const transcriptionConvertedText = convert(result.transcription, {
            wordwrap: false
          });

          return {
            ...result,
            truncatedTranscriptionText: resolveFuntions.truncateText(transcriptionConvertedText, 6, 30)
          }

        });
      }

      return {
        currentDateTime: dateResolve.getMomentDate(),

        searchText: args.searchText,
        startDate: args.startDate,
        endDate: args.endDate,
        files: filteredResults
      }
    },
    force_folder_to_refresh_all: async (parent, args) => {

      pubsub.publish(REFRESH_FOLDER_ALL, {
        refreshfoldercallbackall: true,
      });
    },
   
    get_today_files: async (parent, args) => {

      const today = dateResolve.getMomentDate();
      today.startOf('day');// Set the time to the start of the day

      const todayEnd = dateResolve.getMomentDate();
      todayEnd.endOf('day');

      // Query the database for records with today's date
      const todayFiles = await db.files.findAll({
        where: {
          createdAt: {
            [Op.between]: [today, todayEnd],
          },
          folderId: args.folderId
        },
        order: [['createdAt', 'DESC']],
        raw: true
      });

      const processedResults = todayFiles.map(result => {
        const transcriptionConvertedText = convert(result.transcription, {
          wordwrap: false
        });

        return {
          ...result,
          truncatedTranscriptionText: resolveFuntions.truncateText(transcriptionConvertedText, 6, 30)
        };
      });

      return processedResults;
    },
    get_transcription: async (parent, args) => {
      const file = await db.files.findOne({
        where: {
          id: args.fileId,
        }
      });
      return {
        success: true,
        error: null,
        result: file.transcription
      }
    },
    get_last_mod_detail: async (parent, args) => {
      const lastEntry = await db.mod_details.findOne({
        where: {
          fileId: args.fileId,
        },
        order: [['createdAt', 'DESC']], // Get the last entry based on createdAt column
      });
      return lastEntry;
    },
    get_mod_detail_by_file_id: async (parent, args) => {
      const modDetails = await db.mod_details.findAll({
        where: {
          fileId: args.fileId,
        },
        order: [['createdAt', 'DESC']], // Get the last entry based on createdAt column
      });
      return modDetails;
    },
    get_ids_for_quick_search: async (parent, args) => {
      const today = dateResolve.getMomentDate();
      today.startOf('day');// Set the time to the start of the day

      const todayEnd = dateResolve.getMomentDate();
      todayEnd.endOf('day');
      const files = await db.files.findAll({
        attributes: ['id', 'transcription', 'filename'],
        where: {
          folderId: args.folderId,
          createdAt: {
            [Op.between]: [today, todayEnd],
          }

        },
        order: [['createdAt', 'DESC']],
      });

      const matchingFileIds = [];


      files.forEach(file => {
        const transcriptionHTML = file.transcription;
        const transcriptionConvertedText = convert(transcriptionHTML, {
          wordwrap: false
        });


        const searchTextRegex = new RegExp(args.searchText, 'gi');
        if (transcriptionConvertedText.match(searchTextRegex) ||
          file.filename.match(searchTextRegex)) {
          matchingFileIds.push(file.id);
        }
      });

      return {
        ids: matchingFileIds,
        searchText: args.searchText
      };
    },
    get_users_download_history: async (parent, args) => {
      db.download_history.belongsTo(db.users, { foreignKey: 'userId', targetKey: 'id' });
      db.download_history.belongsTo(db.files, { foreignKey: 'fileId', targetKey: 'id' });

      let startDate = dateResolve.getMomentDateWithParam(args.startDate);
      startDate.startOf('day');
      let endDate = dateResolve.getMomentDateWithParam(args.endDate);
      endDate.endOf('day');


      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      };
      
      // Conditionally add userId to the where clause if it is defined
      if (args.userId) {
        whereClause.userId = args.userId;
      }

      const files = await db.download_history.findAll({
        where: whereClause,
        
        order: [['createdAt', 'DESC']],
        include: [
          { model: db.users, attributes: ['username', 'country_code', 'contact_no', 'designation_id'] }, // Select User fields you need
          { model: db.files, attributes: ['folderId', 'filename', 'extension', 'moreInfo', 'deleted', 'transcription'] }, // Select File fields you need
        ],

      })

      let filteredFiles = [];
      if (args.searchText && args.searchText.length > 0) {

        files.forEach(file => {

          const transcriptionHTML = file.file.transcription;
          const transcriptionConvertedText = convert(transcriptionHTML, {
            wordwrap: false
          });
    
         
          // Search for "arz" (both lowercase and uppercase) in the converted text
          const searchTextRegex = new RegExp(args.searchText, 'gi'); // 'gi' for case-insensitive and global search
         
          if (transcriptionConvertedText.match(searchTextRegex) ||
            file.file.filename.match(searchTextRegex)) {

              console.log("abrro",   file.filename)
            filteredFiles.push({
              id: file.file.id,
              folderId: file.file.folderId,
              username: file.user.username,
              filename: file.file.filename,
              createdAt: file.createdAt,
              extension: file.file.extension,
              fileId: file.fileId,
              moreInfo: file.file.moreInfo,
              deleted: file.file.deleted,
              designation_id: file.user.designation_id
            });
          }
        });
      } else {

        files.forEach(file => {

          filteredFiles.push({
            id: file.id,
            folderId: file.file.folderId,
            username: file.user.username,
            filename: file.file.filename,
            createdAt: file.createdAt,
            extension: file.file.extension,
            fileId: file.fileId,
            moreInfo: file.file.moreInfo,
            deleted: file.file.deleted,
            designation_id: file.user.designation_id
          });
        });
      }


      return filteredFiles;
    },
    get_users_view_history: async (parent, args) => {
      db.view_history.belongsTo(db.users, { foreignKey: 'userId', targetKey: 'id' });


      let startDate = dateResolve.getMomentDateWithParam(args.startDate);
      startDate.startOf('day');
      let endDate = dateResolve.getMomentDateWithParam(args.endDate);
      endDate.endOf('day');


    

      const viewHistory = await db.view_history.findAll({
        where: {
          userId : args.userId,
          fileId:args.fileId
        },
        
        order: [['createdAt', 'DESC']],
        include: [
          { model: db.users, attributes: ['username', 'name'] }, // Select User fields you need
        
        ],

      })

      


      return viewHistory;
    },
    get_files_full_details_by_id_for_export: async (parent, args) => {
      const files = await db.files.findAll({
        where: {
          id: args.filesIds,
        },
        order: [['createdAt', 'DESC']]
      });

      return files
    },
    get_file_full_details_by_id: async (parent, args) => {
      const file = await db.files.findOne({
        where: {
          id: args.fileId,
        }
      });
  
      return file
    
  
  }

  },
  
  RoleType: {
    Admin: "Admin",
    User: "User",
  },

  Mutation: {
    login: async (parent, args, { res, resolver }) => {
      let me = null;
      let user = await db.users.findOne({
        where: {
          username: args.username,
        },
      });

      if (user) {
        let valid = args.password == user.password;
        if (valid) {
          me = user;
        }
      }
      if (!me) {
        throw new AuthenticationError(
          user
            ? "User password is incorrect."
            : "User isn't connected to any account."
        );
      } else {
        if (me.status == "Block")
          throw new AuthenticationError(
            "User is blocked. Please contact admin."
          );
      }
      return me;
    },
    check_email_user_exist: async (parent, args, { res, resolver }) => {
      let user = await db.users.findOne({
        where: {
          email: args.email,
        },
      });

      return {
        success: true,
        error: null,
        result: user != null,
      };
    },
    add_designation: async (parent, args, { res, resolver }) => {
      await db.designations.create({
        name: args.name,
      });

      return {
        success: true,
        error: null,
      };
    },
    update_designation: async (parent, args, { res, resolver }) => {
      let designation = await db.designations.findOne({
        where: {
          id: args.designation_id,
        },
      });

      if (designation) {
        designation.name = args.name;

        try {
          await designation.save();
        } catch (e) {
          console.log(e);
        }
      }
      return {
        success: true,
        error: null,
      };
    },
    delete_designation: async (parent, args, { res, resolver }) => {
      // Check if the designation is associated with any user
      const usersWithDesignation = await db.users.findAll({
        where: {

          designation_id: args.designation_id,

        },
      });

      if (usersWithDesignation.length > 0) {
        return {
          success: false,
          error: "Designation is associated with one or more users. Cannot delete.",
        };
      }

      // If no users are using the designation, proceed with deletion
      await db.designations.destroy({
        where: {
          id: args.designation_id,
        },
      });

      return {
        success: true,
        error: null,
      };
    },


    update_loggedin_user: async (parent, args, { res, resolver }) => {
      let user = await db.users.findOne({
        where: {
          id: args.loggedin_id,
        },
      });
      let error = null;
      if (user) {
        let valid = args.current_password == user.password;
        if (!valid) {
          throw new AuthenticationError("Password not match.");
        } else {
          user.name = args.name;
          if (args.avatar != undefined) user.avatar = args.avatar;
          user.email = args.email;
          user.username = args.username;
          if (args.country_code != undefined) user.country_code = args.country_code
          if (args.contact_no != undefined) user.contact_no = args.contact_no;
          if (args.new_password != undefined) user.password = args.new_password;
          try {
            await user.save();
          } catch (e) {
            console.log(e);
            error = e;
          }
        }
      }
      return {
        success: error == null,
        error: error,
      };
    },
    update_user: async (parent, args, { res, resolver }) => {
      let user = await db.users.findOne({
        where: {
          id: args.user_id,
        },
      });
      let error = null;
      if (user) {
        user.name = args.name;
        if (args.avatar != undefined) user.avatar = args.avatar;
        user.email = args.email;
        if (args.country_code != undefined) user.country_code = args.country_code;
        if (args.contact_no != undefined) user.contact_no = args.contact_no;
        user.block_comments = args.block_comments;
        user.status = args.status;
        user.role = args.role;
        user.username = args.username;
        if (args.password != undefined) user.password = args.password;
        user.settings_json = args.settings_json;
        user.designation_id = args.designation_id;
        try {
          await user.save();
        } catch (e) {
          console.log(e);
          error = e;
        }
      }
      return {
        success: error == null,
        error: error,
      };
    },
    add_user: async (parent, args, { res, resolver }) => {
      let user = await db.users.create({
        name: args.name,
        avatar: args.avatar,
        email: args.email,
        country_code: args.country_code,
        contact_no: args.contact_no,
        status: args.status,
        block_comments: args.block_comments,
        role: args.role,
        username: args.username,
        password: args.password,
        settings_json: args.settings_json,
        designation_id: args.designation_id,
      });

      return {
        success: true,
        error: null,
      };
    },
    delete_user: async (parent, args, { res, resolver }) => {
      await db.users.destroy({
        where: {
          id: args.user_id,
        },
      });
      return {
        success: true,
        error: null,
      };
    },
    add_folder_path: async (parent, args, { res, resolver }) => {
      await db.folders_path.create({
        path: args.path,
        folder_name: args.folder_name
      });

      return {
        success: true,
        error: null,
      };
    },
    update_folder_path: async (parent, args, { res, resolver }) => {
      let folder_path = await db.folders_path.findOne({
        where: {
          id: args.folder_path_id,
        },
      });

      if (folder_path) {
        folder_path.path = args.path;
        folder_path.folder_name = args.folder_name;
        try {
          await folder_path.save();
        } catch (e) {
          console.log(e);
        }
      }
      return {
        success: true,
        error: null,
      };
    },
    delete_folder_path: async (parent, args, { res, resolver }) => {
      // Check if the designation is associated with any user

      // If no users are using the designation, proceed with deletion
      await db.folders_path.destroy({
        where: {
          id: args.folder_path_id,
        },
      });

      return {
        success: true,
        error: null,
      };
    },
    add_files_in_files: async (parent, args) => {

      if (args.files.length > 0) {
        //const insertedFiles = await db.files.bulkCreate(args.files,{
         // logging: (sql, queryObject) => {
         //   console.log(sql)
        //  }
       // });
        const insertedFiles = await db.files.bulkCreate(args.files);
        insertedFiles.map(entry => {
          const matchingFile = global.files["id" + args.files[0].folderId].find(file => file.filename === entry.filename);
          if (matchingFile) {
            matchingFile.id = entry.id;
          }

        });
        pubsub.publish(REFRESH_FOLDER, {
          refreshfoldercallback: {
            folderId: args.files[0].folderId,
            newFileIds: insertedFiles.map(item => item.id),
          }
        });
        return insertedFiles
      }

    },
    update_files_deleted_in_files: async (parent, args) => {
      if (args.files.length > 0) {
        const deletedFiles = args.files.filter(file => file.deleted === true);

        // Filter files where 'deleted' is false
        const notDeletedFiles = args.files.filter(file => file.deleted === false)

     
        if(deletedFiles.length > 0){
         await db.files.update(
          {
            deleted: true, // Set the value you want to update 'deleted' to
          },
          { // Specify the fields to be updated
            where: {
              id: deletedFiles.map(file => file.id)
            } // Set to true to return the updated rows
          });
        }
        if(notDeletedFiles.length > 0){
           await db.files.update(
            {
              deleted: false, // Set the value you want to update 'deleted' to
            },
            { // Specify the fields to be updated
              where: {
                id: notDeletedFiles.map(file => file.id)
              } // Set to true to return the updated rows
            });
          }
     
        pubsub.publish(REFRESH_FOLDER, {
          refreshfoldercallback: {
            folderId:  args.files[0].folderId,
            deletedFileIds: deletedFiles.map(file => file.id),
            notDeletedFileIds: notDeletedFiles.map(file => file.id),
          },
        });
        return {
          success: true
        };
      }
    },
    update_more_info_and_preview: async (parent, args) => {
      if (args.files.length > 0) {
      
        const t = await db.sequelize.transaction(); // Start a transaction

        try {
          for (const file of args.files) {
            const { id, preview, moreInfo,size } = file;
    
            await db.files.update(
              {
                preview,
                moreInfo,
                size
              },
              {
                where: { id }, 
                transaction: t,
              }
            );
          }
        
          await t.commit(); 

        } catch (error) {
          await t.rollback(); 
          console.error(error)
        }
        
        pubsub.publish(REFRESH_FOLDER, {
          refreshfoldercallback: {
            folderId:  args.files[0].folderId,
            files: global.files["id" +  args.files[0].folderId],
          },
        });
        return {
          success: true
        };
      }
    },
    update_transcription: async (parent, args, { res, resolver }) => {
      let file = await db.files.findOne({
        where: {
          id: args.fileId,
        },
      });

      if (file) {
        file.transcription = args.transcriptionHTML;

        try {
          await file.save();

          const transcriptionConvertedText = convert(args.transcriptionHTML, {
            wordwrap: false
          });

          const modCount = await db.mod_details.count({
            where: {
              fileId: args.fileId
            }
          });
          if ((transcriptionConvertedText.replace(/\s+/g, '') == "" && modCount > 0)
            || transcriptionConvertedText.replace(/\s+/g, '') != ""
          ) {

            const lastEntry = await db.mod_details.findOne({
              where: {
                userId: args.userId,
                fileId: args.fileId
              },
              order: [['createdAt', 'DESC']], // Get the last entry based on createdAt column
            });

            if (lastEntry) {

              lastEntry.transcriptionText = transcriptionConvertedText;
              lastEntry.createdAt = dateResolve.getMomentDate();
              await lastEntry.save();

            } else {

              await db.mod_details.create({
                fileId: args.fileId,
                userId: args.userId,
                transcriptionText: transcriptionConvertedText
              });
            }
            let truncatedText = resolveFuntions.truncateText(transcriptionConvertedText, 6, 30);
            if (global.files["id" + args.folderId]) {
              let foundFile = _.find(global.files["id" + args.folderId], fileItem => fileItem.id == args.fileId);
              if (foundFile) {
                foundFile.truncatedTranscriptionText = truncatedText;
              }
            }
            pubsub.publish(TRANSCRIPTION_CHANGED, {
              transcriptionchangedcallbackall: {
                folderId: args.folderId,
                fileId: args.fileId,
                userId: args.userId,
                username: args.username,
                transcriptionHTML: args.transcriptionHTML,
                truncatedTranscriptionText: truncatedText
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      }

      return {
        success: true,
        error: null,
        result: null
      };
    },
    add_download_history: async (parent, args, { res, resolver }) => {

      await db.download_history.create({
        userId: args.userId,
        fileId: args.fileId
      });

      return {
        success: true,
        error: null,
      };
    },
    add_or_update_view_history: async (parent, args, { res, resolver }) => {

      //const [viewHistory, created] = await db.view_history.findOrCreate({
      //  where: { userId: args.userId, fileId: args.fileId },
      //  defaults: { userId: args.userId, fileId: args.fileId }
   // });
    const existingViewHistory = await db.view_history.findOne({
      where: { userId: args.userId, fileId: args.fileId }
  });

  if (existingViewHistory) {
    try {
         console.log( dateResolve.getDate())
         existingViewHistory.changed('createdAt', true);
       existingViewHistory.createdAt =dateResolve.getDate();
       
       existingViewHistory.set('createdAt', dateResolve.getDate(),{raw: true});

      await existingViewHistory.save();
 
   
  } catch (error) {
      console.error('Error updating createdAt:', error);
  }
  } else {
    
      const newViewHistory = await db.view_history.create({
          userId: args.userId,
          fileId: args.fileId,
          
      });
    
  }
      return {
        success: true,
        error: null,
      };
    },
  },
  User: {
    designation(parent) {

      return db.designations.findOne({
        where: {
          id: parent.designation_id,
        },
      });
    },
  },
  Mod_Details: {
    async username(parent) {
      const user = await db.users.findOne({
        where: {
          id: parent.userId, // Specify the condition here
        },
      });

      if (user) {
        return user.username;
      }
    },
  },
  FilesDetailsDownloadHistory: {
    folder(parent) {

      return db.folders_path.findOne({
        where: {
          id: parent.folderId,
        },
      });

    },
    designation(parent) {

      return db.designations.findOne({
        where: {
          id: parent.designation_id,
        },
      });
    },
  },
  Files: {
    folder(parent) {

      if (parent.folderId) {
        return db.folders_path.findOne({
          where: {
            id: parent.folderId,
          },
        });
      } else
        return parent.folder
    },
  },
  FilesExport: {
    folder(parent) {

      return db.folders_path.findOne({
        where: {
          id: parent.folderId,
        },
      });
    },
    transcriptionText(parent) {
  
      if (parent.transcription && parent.transcription.length > 0) {

        const transcriptionHTML = parent.transcription;
        const transcriptionConvertedText = convert(transcriptionHTML, {
          wordwrap: false
        });
        return transcriptionConvertedText;
      }
      return null;
    },
    async lastModBy(parent) {
      db.mod_details.belongsTo(db.users, { foreignKey: 'userId', targetKey: 'id' });

      const lastModDetails = await db.mod_details.findOne({
        where: {
          fileId: parent.id,
        },
        order: [['createdAt', 'DESC']], // Get the last entry based on createdAt column
        include: [
          { model: db.users, attributes: ['username'] }, // Select User fields you need

        ],

      });

      if (lastModDetails) {

        return lastModDetails.user.username;
      }
      else
        return null;
    }

  }
};
