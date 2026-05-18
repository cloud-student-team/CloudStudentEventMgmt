const multer = require('multer');
require('dotenv').config();

let storage;
let getFileUrl;

// Use Azure if credentials exist, otherwise fall back to local
if (
  process.env.AZURE_STORAGE_CONNECTION_STRING &&
  process.env.AZURE_STORAGE_ACCOUNT &&
  process.env.AZURE_STORAGE_ACCESS_KEY &&
  process.env.AZURE_CONTAINER_NAME
) {
  // ✅ Azure Storage (Production)
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

  getFileUrl = (file) => {
    if (!file) return null;
    return file.url;
  };

} else {
  // ✅ Local Storage (Development fallback)
  console.log('⚠️  Azure credentials not found — using local storage for uploads');

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
      cb(null, uniqueName);
    }
  });

  getFileUrl = (file) => {
    if (!file) return null;
    return `http://localhost:5001/uploads/${file.filename}`;
  };
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

module.exports = upload;
module.exports.getFileUrl = getFileUrl;