import { Request, Response } from "express";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from "fs";
ffmpeg.setFfmpegPath(ffmpegPath!);
import path from "path";
import { FileMetadataModel } from "../Models/FileMeta"; // Import the model
import { execFile } from "child_process";
import { generateMCQ } from "../Utils/generateMCQ";

export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "No file uploaded" }); 
      return;
    }

    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const videoPath = path.join(uploadsDir, file.filename);
    const audioPath = path.join(uploadsDir, `${file.filename}.wav`);

    // 1. Extract audio from video
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec("pcm_s16le")

        //.audioCodec("libmp3lame")
         .format("wav")
        // .format('mp3')            
        .on("end", () => {
          console.log("Audio extracted:", audioPath);
          resolve();
        })
        .on("error", (err) => reject(err))
        .save(audioPath);
    });

    // 2. Split audio into 5-minute chunks
    const chunkDir = path.join(uploadsDir, `${file.filename}_chunks`);
    const chunkFiles = await splitAudioIntoChunks(audioPath, chunkDir);

    // 3. Transcribe each chunk sequentially
    const transcriptions = [];

    for (const chunkFile of chunkFiles) { 
      console.log("Transcribing chunk:", chunkFile);

      // Run transcription for this audio chunk (assumed to return an object with a `.text` property)
      const transcript = await runTranscription(chunkFile);

      console.log("Generating MCQs for chunk text...", transcript.text);

      // generateMCQ returns an array of MCQ strings (because it splits the text internally if needed)
      const mcqsArray = await generateMCQ(transcript.text);

      // Join all MCQs chunks into a single string or handle as needed
      const mcqsCombined = mcqsArray.join("\n\n---\n\n");

      console.log("MCQs generated:", mcqsCombined);

      // Store the transcript and combined MCQs for this chunk
      transcriptions.push({
        chunkFile: path.basename(chunkFile),
        transcript,
        mcqs: mcqsCombined,
      });

      console.log("Transcription and MCQs generated for chunk:", chunkFile);
    }
    

    // 4. Save file metadata + transcription in MongoDB
    const fileMetadata = new FileMetadataModel({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      audioFilename: `${file.filename}.wav`,
      chunks: chunkFiles.map(f => path.basename(f)),
      transcriptions, // store all transcripts by chunk
    });
    
    const data=await fileMetadata.save();

    // 5. Send response
    res.status(200).json({
      message: "Video uploaded, audio extracted, transcribed, and metadata saved",
      file: fileMetadata,
      Databasedata: data,
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};


const runTranscription = (audioFilePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../../../lecture-mcq-ai/venv/transcribe.py");

    execFile("python", [scriptPath, audioFilePath], (error, stdout, stderr) => {
      if (error) {
        console.error("Error running transcription:", error);
        reject(error);
        return;
      }
      if (stderr) {
        console.error("Transcription stderr:", stderr);
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
};
// Utility: split audio into 5-min chunks and return chunk file paths
const splitAudioIntoChunks = (inputAudioPath: string, outputDir: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Delete old chunk files if any
    fs.readdirSync(outputDir).forEach(f => fs.unlinkSync(path.join(outputDir, f)));

    // Use ffmpeg segment feature to split audio into 300s (5 min) chunks
    ffmpeg(inputAudioPath)
      .outputOptions([
        '-f', 'segment',
        '-segment_time', '300', // 300 seconds = 5 minutes
        '-c', 'copy'
      ])
      .output(path.join(outputDir, 'chunk-%03d.wav'))
      .on('end', () => {
        const chunkFiles = fs.readdirSync(outputDir)
          .filter(f => f.endsWith(".wav"))
          .map(f => path.join(outputDir, f));
        resolve(chunkFiles);
      })
      .on('error', (err) => reject(err))
      .run();
  });
};