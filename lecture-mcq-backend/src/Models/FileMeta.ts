import mongoose from "mongoose";

const TranscriptionSchema = new mongoose.Schema({
  chunkFile: String,
  transcript: mongoose.Schema.Types.Mixed,
  mcqs: String,
});

const FileMetadataSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  uploadDate: Date,
  audioFilename: String,
  chunks: [String],
  transcriptions: [TranscriptionSchema],
});

export const FileMetadataModel = mongoose.model(
  "FileMetadata",
  FileMetadataSchema
);

