import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, callback) => {
    callback(null, uploadDir);
  },

  filename: (_, file, callback) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-");

    callback(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image uploaded",
    });
  }

  return res.json({
    path: `/uploads/${req.file.filename}`,
  });
});

export default router;