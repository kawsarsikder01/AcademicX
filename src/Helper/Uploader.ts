import fs from "fs";
import path from "path";
import multer from "multer";
import { ServerResponse } from "http";

// ------------------ Configuration ------------------
const ACTIVE_DISK = process.env.ACTIVE_DISK || "local"; // local | s3
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

if (ACTIVE_DISK === "local" && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ------------------ Multer Setup (only for local) ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

export const upload =
  ACTIVE_DISK === "local" ? multer({ storage }) : undefined;

// ------------------ File Operations ------------------
export const saveFile = async (
  file?: any // Multer or PersistentFile
) => {
  if (!file) throw new Error("No file provided");

  // Multer DiskStorage
  if ("path" in file && file.path) {
    const relativePath = path.relative(UPLOAD_DIR, file.path).replace(/\\/g, "/");
    return { path: relativePath, driver: ACTIVE_DISK };
  }

  // Multer MemoryStorage
  if ("buffer" in file && file.buffer) {
    const filePath = path.join(UPLOAD_DIR, Date.now() + "-" + file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    const relativePath = path.relative(UPLOAD_DIR, filePath).replace(/\\/g, "/");
    return { path: relativePath, driver: ACTIVE_DISK };
  }

  // PersistentFile (formidable, etc)
  if ("filepath" in file && "originalFilename" in file) {
    const destPath = path.join(UPLOAD_DIR, Date.now() + "-" + file.originalFilename);
    fs.copyFileSync(file.filepath, destPath);
    const relativePath = path.relative(UPLOAD_DIR, destPath).replace(/\\/g, "/");
    return { path: relativePath, driver: ACTIVE_DISK };
  }

  throw new Error("Invalid file object");
};


export const deleteFile = (fileUrlOrPath: string) => {
  if (ACTIVE_DISK === "local") {
    try {
      let filePath = fileUrlOrPath;
      if (fileUrlOrPath.startsWith(BASE_URL))
        filePath = fileUrlOrPath.replace(`${BASE_URL}/`, "");
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete file error:", error);
      return false;
    }
  }
  if (ACTIVE_DISK === "s3") {
    // TODO: implement S3 delete
    return true;
  }
  return false;
};

export const getFile = (filePathOrUrl: string) => {
  if (ACTIVE_DISK === "local") {
    try {
      let filePath = filePathOrUrl;
      if (filePathOrUrl.startsWith(BASE_URL))
        filePath = filePathOrUrl.replace(`${BASE_URL}/`, "");
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) return null;
      const stats = fs.statSync(fullPath);
      return {
        name: path.basename(fullPath),
        size: stats.size,
        extension: path.extname(fullPath),
        url: `${BASE_URL}/uploads/${path.relative(UPLOAD_DIR, fullPath).replace(
          /\\/g,
          "/"
        )}`,
      };
    } catch (error) {
      console.error("Get file error:", error);
      return null;
    }
  }
  if (ACTIVE_DISK === "s3") {
    return {
      name: "file.jpg",
      size: 1024,
      extension: ".jpg",
      url: "https://s3.example.com/file.jpg",
    };
  }
  return null;
};

export const downloadFile = (res: ServerResponse, filePathOrUrl: string) => {
  if (ACTIVE_DISK === "local") {
    try {
      let filePath = filePathOrUrl;
      if (filePathOrUrl.startsWith(BASE_URL))
        filePath = filePathOrUrl.replace(`${BASE_URL}/`, "");
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "File not found" }));
        return;
      }

      const fileStream = fs.createReadStream(fullPath);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(fullPath)}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");
      fileStream.pipe(res);
      fileStream.on("error", (err) => {
        console.error("File stream error:", err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: "Error downloading file" }));
        }
      });
    } catch (error) {
      console.error("Download file error:", error);
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.end(JSON.stringify({ message: "Error downloading file" }));
      }
    }
  }
  if (ACTIVE_DISK === "s3") {
    // TODO: implement S3 download
  }
};
