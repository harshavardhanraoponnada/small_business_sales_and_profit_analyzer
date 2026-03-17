const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/expense_uploads");
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf"
]);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const { category, amount } = req.body;

    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const formattedDate = date.split("-").reverse().join("-"); // DD-MM-YYYY

    const safeCategory = category.toLowerCase().replace(/\s+/g, "_");
    const ext = path.extname(file.originalname);

    cb(null, `${safeCategory}_${amount}_${formattedDate}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024)
  }
});
