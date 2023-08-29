const sharp = require('sharp'); 
const fs = require('fs'); 

const optimizeAndConvertToWebP = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const newFilename = req.file.filename.replace(/\.[^/.]+$/, "") + '.webp'
  sharp(req.file.path)
    .webp({ quality: 60 }) 
    .resize(691, 1000)
    .toFile(`images/${newFilename}`, (err, info) => {
      if (err) {
        return next(err);
      }

      fs.unlinkSync(req.file.path);
      req.file.path = `images/${newFilename}`
      req.file.filename = newFilename

      next();
    });
};
module.exports = { optimizeAndConvertToWebP };