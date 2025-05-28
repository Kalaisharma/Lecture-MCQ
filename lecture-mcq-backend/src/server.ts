import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./Routes/Routes";
import connectDB from "./Database/db"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
connectDB(); // Connect to MongoDB
app.use("/api", router); // All grouped routes

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
