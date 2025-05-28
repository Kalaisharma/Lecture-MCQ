import express from "express";
import { upload } from "../Middleware/multer.config";
import { uploadVideo } from "../Controllers/UploadController";
import { fetchFileByName, fetchFiles } from "../Controllers/DataFetchController";
const router = express.Router();

router.post("/upload", upload.single("video"), uploadVideo);
// server/routes/files.js
router.get("/files", fetchFiles);
router.get("/filesbyname/:filename", fetchFileByName);

  
export default router;
