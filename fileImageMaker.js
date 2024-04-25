const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { Poppler } = require("node-poppler");
const sharp = require('sharp');
const util = require('util');
const pdf = require('pdf-parse');
ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
const ffprobeAsync = util.promisify(ffmpeg.ffprobe);
const Jimp = require('jimp');
module.exports = {
  isImageExtension(extension) {
    const allowedImageExtensions = ["bmp", "jpg", "jpeg", "png", "webp"];
    return allowedImageExtensions.includes(extension.toLowerCase());
  },
  isBMPExtension(extension) {
    const allowedImageExtensions = ["bmp"];
    return allowedImageExtensions.includes(extension.toLowerCase());
  },
  isOggExtension(extension) {
    const allowedVideoExtensions = ["ogg"];
    return allowedVideoExtensions.includes(extension.toLowerCase());
  },
  isVideoExtension(extension) {
    const allowedVideoExtensions = ["mp4", "webm"];
    return allowedVideoExtensions.includes(extension.toLowerCase());
  },

  isAudioExtension(extension) {
    const allowedAudioExtensions = ["mp3", "wav"];
    return allowedAudioExtensions.includes(extension.toLowerCase());
  },
   isPdfExtension(extension) {
    const allowedPdfExtensions = ["pdf" ];
    return allowedPdfExtensions.includes(extension.toLowerCase());
  },
  async checkOggFileTypeAndCreateMoreInfo(filePath) {
    var previewAndInfo = null;
    try {
      const metadata = await ffprobeAsync(filePath);
  
      if (metadata.streams && metadata.streams.length > 0) {
        const firstStream = metadata.streams[0];
        console.log("firstStream.codec_type",firstStream.codec_type)
        if (firstStream.codec_type === 'audio') {
          previewAndInfo = await this.getAudioDurationInSeconds(filePath);
          if(previewAndInfo)
          previewAndInfo.customType = 'audio';
        } else if (firstStream.codec_type === 'video') {
         previewAndInfo = await this.generateVideoPreviewAndGetDuration(filePath);
         if(previewAndInfo)
         previewAndInfo.customType = 'video';
        } 
      } else {
        console.log('No streams found in the Ogg file.');
      }
    } catch (err) {
      console.error('Error:', err);
    }
    return previewAndInfo;
  },
  async  resizeAndConvertToBase64AndSize_BMP(inputFilePath) {
    try {
      const imageBuffer = fs.readFileSync(inputFilePath);
      const targetHeight = 100; // Fixed target height
      const image = await Jimp.read(imageBuffer);
      const originalWidth = image.getWidth();
      const originalHeight = image.getHeight();
  
      // Calculate the new width based on the aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      const targetWidth = Math.round(targetHeight * aspectRatio);
  
      // Resize the image
      image.resize(targetWidth, targetHeight);
  
      // Get the resized image as a base64-encoded string
      const resizedImageBase64 = (await image.getBase64Async(Jimp.MIME_PNG)).replace(/^data:image\/png;base64,/, '');
  
      return {
        resizedImageBase64,
        size: {
          width: originalWidth,
          height: originalHeight,
        },
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        resizedImageBase64: null,
        size: {
          width: 0,
          height: 0,
        }
    }
  }
  },
  async resizeAndConvertToBase64AndSize(inputFilePath) {

    try {
      // Read the input image
      const imageBuffer = fs.readFileSync(inputFilePath);
      const resizedImageBufferSharp = await sharp(imageBuffer);
      const metadata = await resizedImageBufferSharp.metadata();
      // Resize the image to a height of 300 pixels while maintaining aspect ratio
      const resizedImageBuffer = await  resizedImageBufferSharp
        .resize({ height: 100 })
        .toBuffer();

      // Convert the resized image to base64
      const resizedImageBase64 = resizedImageBuffer.toString('base64');
   
      return { resizedImageBase64: resizedImageBase64, size: { width: metadata.width, height: metadata.height } };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        resizedImageBase64: null,
        size: {
          width: 0,
          height: 0,
        }
    }
    }
  },


  async generateVideoPreviewAndGetDuration(inputVideoPath) {

    try {
      // Get the video duration asynchronously
      const metadata = await ffprobeAsync(inputVideoPath);
      const durationInSeconds = metadata.format.duration;
      const middleTimeInSeconds = durationInSeconds / 2;

      // Generate a video preview from the middle of the video asynchronously
      const previewOutputPath = 'preview.jpg';

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(inputVideoPath)
          .inputOption(`-ss ${middleTimeInSeconds}`)
          .frames(1)
          .frames(1) 
          .output(previewOutputPath)
          .videoFilters('scale=100:100')
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .run();
      });

      // Read the generated preview image
      const previewImageBuffer = fs.readFileSync(previewOutputPath);

      // Convert the preview image to base64
      const previewImageBase64 = previewImageBuffer.toString('base64');

      // Remove the temporary preview image file
      fs.unlinkSync(previewOutputPath);

      return { previewImageBase64: previewImageBase64, durationInSeconds: durationInSeconds };
    } catch (error) {
      console.error('Error processing video:', error);
      return null;
    }
  },
  async getAudioDurationInSeconds(inputAudioPath) {
    try {
      // Get the audio duration asynchronously
      const metadata = await ffprobeAsync(inputAudioPath);
      const durationInSeconds = metadata.format.duration;
  
      return {durationInSeconds:durationInSeconds};
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return null;
    }
  },
  async generatePdfPreviewAndPagesCount(inputPdfPath) {
    try {
      // Create a new Poppler instance.
      const poppler = new Poppler();
      const dataBufferPDF = fs.readFileSync(inputPdfPath);
      const data = await pdf(dataBufferPDF);
    
      const numPages = data.numpages;

      const options = {
        firstPageToConvert: 1,
        singleFile: true,
        pngFile: true,
        scalePageTo:100,
        resolutionYAxis:-1,
      };
      const document = await poppler.pdfToCairo(dataBufferPDF,undefined,options);
  
      const binaryBuffer = Buffer.from(document, 'binary');
  
      // Convert the PNG preview to base64.
      const previewBase64 = binaryBuffer.toString('base64');

      return { thumbnailImageBase64:previewBase64,numPages:numPages };
    } catch (error) {
      console.error('Error processing PDF:', error);
      return null;
    }
  }
}