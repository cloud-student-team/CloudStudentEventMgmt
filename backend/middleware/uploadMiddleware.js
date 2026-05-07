const { MulterAzureStorage } = require('multer-azure-blob-storage');
require('dotenv').config();

const azureStorage = new MulterAzureStorage({
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

const multer = require('multer');

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: azureStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function getFileUrl(file) {
  if (!file) return null;
  return file.url;
}

module.exports = upload;
module.exports.getFileUrl = getFileUrl;
