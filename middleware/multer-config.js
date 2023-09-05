const multer = require('multer');
const fs = require('fs'); 

// Types MIME autorisés et leurs extensions correspondantes
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};
// Configuration du stockage des fichiers téléchargés
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // Spécification du répertoire de destination pour les fichiers téléchargés
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    // Génération d'un nom de fichier unique pour éviter les conflits
    const name = file.originalname
    .replace(/\.[^/.]+$/, "")// Suppression de l'extension du nom original
    .split(' ')
    .join('_'); // Remplacement des espaces par des underscores
    const extension = MIME_TYPES[file.mimetype];//Obtention de l'extension du fichier à partir du type MIME
    callback(null, name + Date.now() + '.' + extension);// Formatage du nom de fichier final
  }
});

const upload = multer({
  // Utilisation de la configuration de stockage définie ci-dessus
  storage: storage,

  fileFilter: (req, file, callback) => {
    // Vérification du type MIME du fichier téléchargé par rapport aux types MIME autorisés
    const isValidMimeType = Object.keys(MIME_TYPES).includes(file.mimetype);
    if (isValidMimeType) {
      callback(null, true);// Fichier valide
    } else {
      callback(new Error('Invalid file type'));// Fichier invalide
    }
  }
}).single('image'); // Le champ 'image' dans la requête est utilisé pour spécifier le fichier téléchargé


// Export du middleware 'upload'
module.exports = { upload };