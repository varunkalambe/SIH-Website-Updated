import multer from "multer";
import path from "path";
import fs from "fs";

// Correct folder name
const uploadPath = "uploads/originals"; 
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4","video/avi","video/quicktime","video/x-ms-wmv"];
  cb(null, allowedTypes.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter });
export default upload;
