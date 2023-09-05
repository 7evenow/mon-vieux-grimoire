const sharp = require('sharp'); 
const fs = require('fs'); 

const optimizeAndConvertToWebP = (req, res, next) => {
  // Vérification si un fichier a été téléchargé
  if (!req.file) {
    // Si aucun fichier n'a été téléchargé, passez à la prochaine étape
    return next();
  }
// Génération d'un nouveau nom de fichier avec l'extension ".webp"
  const newFilename = req.file.filename.replace(/\.[^/.]+$/, "") + '.webp'
  // Utilisation de Sharp pour effectuer l'optimisation et la conversion
  sharp(req.file.path)
    .webp({ quality: 60 }) // Conversion en format WebP avec une qualité de 60%
    .resize(691, 1000)// Redimensionnement de l'image (largeur x hauteur)
    .toFile(`images/${newFilename}`, (err, info) => {
      if (err) {
        return next(err);// Gestion des erreurs en cas de problème avec Sharp
      }
      // Suppression de l'ancien fichier
      fs.unlinkSync(req.file.path);
      // Mise à jour du chemin et du nom du fichier dans l'objet 'req.file'
      req.file.path = `images/${newFilename}`
      req.file.filename = newFilename
      
      // Passez à la prochaine étape du middleware
      next();
    });
};
// Export du middleware 'optimizeAndConvertToWebP'
module.exports = { optimizeAndConvertToWebP };