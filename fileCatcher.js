const fs = require('fs');
const path = require('path');
const fileImageMaker = require('./fileImageMaker');
const { gql } = require("apollo-server-express");
const moment = require("moment");
const dateResolve = require("./dateResolve");
module.exports = {
  async scanDirectory(folderName, folderId, dirPath, server) {

    let monitoredFiles = global.files[folderId] ?? [];
    let newMonitoredFilesForDatabaseEntry = [];
    let newMoreInfoAndPreviewUpdateFilesForDatabaseEntry = [];
    let updateDeleteFieldOfMonitoredFilesForDatabaseEntry = [];
    const files = fs.readdirSync(dirPath);
    const todayDate = dateResolve.getMomentDate();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const extension = path.extname(file).slice(1);
      if (!stats.isDirectory() && dateResolve.getMomentDateWithParam(stats.birthtime).date() === todayDate.date()) {

        // Check if the file is already monitored
        const existingFileIndex = monitoredFiles.findIndex(
          (monitoredFile) => monitoredFile.filename === file
        );

        if (existingFileIndex === -1) {
       

          if (fileImageMaker.isPdfExtension(extension) ||
            fileImageMaker.isVideoExtension(extension) ||
            fileImageMaker.isImageExtension(extension) ||
            fileImageMaker.isAudioExtension(extension)||
            fileImageMaker.isOggExtension(extension)
          ) {

            const { preview, moreInfo } = await this.getPreviewAndMoreInfo(filePath, extension);
          
            const item = {
              preview: preview,
              filename: file,
              createdAt: dateResolve.getDateWithParam(stats.birthtime),

              extension: extension,
              truncatedTranscriptionText: "",
              deleted: false,
              moreInfo: moreInfo,
              size: stats.size,
              folder: {
                id: folderId.replace("id", ""),
                path: dirPath,
                folder_name: folderName
              }
            };
            monitoredFiles.push(item);

            let clonedItem = { ...item };
            clonedItem.folderId = item.folder.id;
            clonedItem.transcription = "";
            delete clonedItem.folder;
            delete clonedItem.truncatedTranscriptionText;

       

            newMonitoredFilesForDatabaseEntry.push(clonedItem);
          }// console.log(`File added: ${file}`);
        } else {
          if (monitoredFiles[existingFileIndex].folder.path != dirPath) {
            monitoredFiles[existingFileIndex].folder.path = dirPath;
          }
          if (monitoredFiles[existingFileIndex].folder.folder_name != folderName) {
            monitoredFiles[existingFileIndex].folder.folder_name = folderName;
          } // if folder name change by admin it will change folder name automatically

          if (monitoredFiles[existingFileIndex].moreInfo == null && monitoredFiles[existingFileIndex].size < stats.size) {
            const { preview, moreInfo } = await this.getPreviewAndMoreInfo(filePath, extension);
           
            monitoredFiles[existingFileIndex].preview = preview;
            monitoredFiles[existingFileIndex].moreInfo = moreInfo;
            newMoreInfoAndPreviewUpdateFilesForDatabaseEntry.push({
              id: monitoredFiles[existingFileIndex].id,
              preview: monitoredFiles[existingFileIndex].preview,
              moreInfo: monitoredFiles[existingFileIndex].moreInfo,
              folderId: monitoredFiles[existingFileIndex].folder.id,
              size:stats.size
            });
          }
        }
      }


    }

    for (let i = 0; i < monitoredFiles.length; i++) {
      const monitoredFile = monitoredFiles[i];
      if (!files.includes(monitoredFile.filename)) {

        if (!monitoredFile.deleted) {
          monitoredFile.deleted = true;
          updateDeleteFieldOfMonitoredFilesForDatabaseEntry.push({ id: monitoredFile.id, deleted: true, folderId: monitoredFile.folder.id });

        }
      } else {
        // if file is restored change then it will change deleted status to false
        if (monitoredFile.deleted) {
          monitoredFile.deleted = false;
          updateDeleteFieldOfMonitoredFilesForDatabaseEntry.push({ id: monitoredFile.id, deleted: false, folderId: monitoredFile.folder.id });

        }
      }
    }
    // Sort the monitoredFiles array by creation time
    monitoredFiles.sort((a, b) => b.createdAt - a.createdAt);

    if (newMonitoredFilesForDatabaseEntry.length > 0) {
      let filesinserted = await this.add_files_in_files(server, newMonitoredFilesForDatabaseEntry);


    }
    if (updateDeleteFieldOfMonitoredFilesForDatabaseEntry.length > 0) {
      await this.update_files_deleted_in_files(server, updateDeleteFieldOfMonitoredFilesForDatabaseEntry);
    }
    if (newMoreInfoAndPreviewUpdateFilesForDatabaseEntry.length > 0) {
  
      await this.update_more_info_and_preview(server, newMoreInfoAndPreviewUpdateFilesForDatabaseEntry);
    }

    global.files[folderId] = monitoredFiles;
  },
  scanDirectoryForTest(directory) {
    let monitoredFiles = [];
    const files = fs.readdirSync(directory);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (!stats.isDirectory()) {

        // Check if the file is already monitored

        const birthtimeUnixTimestamp = stats.birthtime.getTime();

        const min = 100;
        const max = 10000;
        const randomNumber = Math.round(Math.random() * (max - min) + min);
        monitoredFiles.push({
          id: randomNumber,
          filename: file,
          fileCreatedTimestamp: birthtimeUnixTimestamp,
          extension: path.extname(file).slice(1),
        });
        //console.log(`File added: ${file}`);

      }


    }

    // Sort the monitoredFiles array by creation time
    monitoredFiles.sort((a, b) => a.createdAt - b.createdAt);
    return monitoredFiles;
  },
  async update_more_info_and_preview(server, newMoreInfoAndPreviewUpdateFilesForDatabaseEntry) {
    try {
      const { data } = await server.executeOperation({
        schema: server.schema,
        contextValue: server.context,

        query: gql`
      mutation UpdateMoreInfoAndPreview($files: [FileUpdateInput]) {
        update_more_info_and_preview(files: $files) {
          success
          error
          result
        }
      }
    `,
        variables: {
          files: newMoreInfoAndPreviewUpdateFilesForDatabaseEntry, // Replace with the desired variable values
        }
      });

     
    } catch (error) {
      console.error('Error: in inserting file', error);
      await this.update_more_info_and_preview(server, newMoreInfoAndPreviewUpdateFilesForDatabaseEntry)
    }

  },
  async add_files_in_files(server, newMonitoredFilesForDatabaseEntry) {
    try {
      const { data } = await server.executeOperation({
        schema: server.schema,
        contextValue: server.context,

        query: gql`
      mutation AddFiles($files: [FileInput]) {
        add_files_in_files(files: $files) {
          id
          preview
          filename
          createdAt
          extension
          truncatedTranscriptionText
          folder {
            id
            path
            folder_name
          }
          moreInfo
          deleted
        }
      }
    `,
        variables: {
          files: newMonitoredFilesForDatabaseEntry, // Replace with the desired variable values
        }
      });

      return data.add_files_in_files;
    } catch (error) {
      console.error('Error: in updating more info and preview', error);

      await this.add_files_in_files(server, newMonitoredFilesForDatabaseEntry)
    }

  },
  async update_files_deleted_in_files(server, updateDeleteFieldOfMonitoredFilesForDatabaseEntry) {
    const status = await server.executeOperation({
      schema: server.schema,
      contextValue: server.context,
      query: gql`
        mutation ($files: [FileDeleteInput]) {
          update_files_deleted_in_files(files: $files){
            success
            error
            result
          }
        }
      `,
      variables: {
        files: updateDeleteFieldOfMonitoredFilesForDatabaseEntry,
      },

    });


  },
  async getPreviewAndMoreInfo(filePath, extension) {
    let preview = null;
    let moreInfo = null;

    if (fileImageMaker.isPdfExtension(extension)) {
      const previewAndInfo = await fileImageMaker.generatePdfPreviewAndPagesCount(filePath);
      if (previewAndInfo) {
        moreInfo = JSON.stringify({
          numPages: previewAndInfo.numPages
        });
        preview = previewAndInfo.thumbnailImageBase64;
      }
    } else if (fileImageMaker.isVideoExtension(extension)) {
      const previewAndInfo = await fileImageMaker.generateVideoPreviewAndGetDuration(filePath);
      if (previewAndInfo) {
        moreInfo = JSON.stringify({
          durationInSeconds: previewAndInfo.durationInSeconds
        });
        preview = previewAndInfo.previewImageBase64;
      }
    } else if (fileImageMaker.isImageExtension(extension)) {
      let previewAndInfo = null;
      if (fileImageMaker.isBMPExtension(extension)) {
        previewAndInfo = await fileImageMaker.resizeAndConvertToBase64AndSize_BMP(filePath);
      } else {
        previewAndInfo = await fileImageMaker.resizeAndConvertToBase64AndSize(filePath);
      }
      if (previewAndInfo) {
        moreInfo = JSON.stringify({
          size: previewAndInfo.size
        });
        preview = previewAndInfo.resizedImageBase64;
      }
    } else if (fileImageMaker.isAudioExtension(extension)) {
      const previewAndInfo = await fileImageMaker.getAudioDurationInSeconds(filePath);
      if (previewAndInfo) {
        moreInfo = JSON.stringify({
          durationInSeconds: previewAndInfo.durationInSeconds
        });
      }
    }else if (fileImageMaker.isOggExtension(extension)) {
      console.log("getting ogg previw");
      const previewAndInfo = await fileImageMaker.checkOggFileTypeAndCreateMoreInfo(filePath);
      console.log(previewAndInfo.customType)
      if (previewAndInfo) {
        moreInfo = JSON.stringify({
          durationInSeconds: previewAndInfo.durationInSeconds,
          customType: previewAndInfo.customType 
        });

        if(previewAndInfo.customType == 'video')
        preview = previewAndInfo.previewImageBase64;
      }
    }

    return { preview, moreInfo };
  }
}