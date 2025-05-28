import { Request, Response } from "express";
import { FileMetadataModel } from "../Models/FileMeta";

export const fetchFiles = async (_req: Request, res: Response) => {
  try {
    const files = await FileMetadataModel.distinct("originalname");
    res.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const fetchFileByName = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const file = await FileMetadataModel.findOne({ originalname:filename });
console.log("Fetching file by name:", file);
    if (!file) {
        res.status(404).json({ error: "File not found" });
        return; 
    }

      res.status(200).json({ Databasedata: file });
  } catch (error) {
    console.error("Error fetching file by name:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
