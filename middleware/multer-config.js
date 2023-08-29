const multer = require('multer');
const sharp = require('sharp'); 
const fs = require('fs'); 

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname
    .replace(/\.[^/.]+$/, "")
    .split(' ')
    .join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    const isValidMimeType = Object.keys(MIME_TYPES).includes(file.mimetype);
    if (isValidMimeType) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type'));
    }
  }
}).single('image');


const optimizeAndConvertToWebP = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  sharp(req.file.path)
    .webp({ quality: 60 }) 
    .resize(691, 1000)
    .toFile(`images/${req.file.filename.replace(/\.[^/.]+$/, "")}.webp`, (err, info) => {
      if (err) {
        return next(err);
      }

      fs.unlinkSync(req.file.path);

      next();
    });
};

module.exports = { upload, optimizeAndConvertToWebP };