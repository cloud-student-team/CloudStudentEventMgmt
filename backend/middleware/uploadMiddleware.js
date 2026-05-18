require('dotenv').config();
const multer = require('multer');
const path = require('path');

const hasAzure = !!(process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_ACCESS_KEY);

let storage;

if (hasAzure) {
  const { MulterAzureStorage } = require('multer-azure-blob-storage');
  storage = new MulterAzureStorage({
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    accountName: process.env.AZURE_STORAGE_ACCOUNT,
    accessKey: process.env.AZURE_STORAGE_ACCESS_KEY,
    containerName: process.env.AZURE_CONTAINER_NAME,
    containerAccessLevel: 'blob',
    blobName: (req, file) => {
      return new Promise((resolve) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        resolve(uniqueName);
      });
    },
  });
} else {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
      cb(null, uniqueName);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function getFileUrl(file) {
  if (!file) return null;
  if (hasAzure) return file.url;
  return `/uploads/${file.filename}`;
}

module.exports = upload;
module.exports.getFileUrl = getFileUrl;
