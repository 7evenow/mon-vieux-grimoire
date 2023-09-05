const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');// Middleware d'authentification personnalisé
const multer = require('../middleware/multer-config'); // Middleware pour la gestion des fichiers multipart/form-data
const sharp = require('../middleware/sharp-config');// Middleware pour la manipulation d'images avec Sharp
const bookCtrl = require('../controllers/book'); //Contrôleur pour les actions sur les livres

router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);
router.post('/',auth, multer.upload, sharp.optimizeAndConvertToWebP, bookCtrl.createBook);
router.post('/:id/rating', auth, multer.upload,sharp.optimizeAndConvertToWebP, bookCtrl.createRating);
router.delete('/:id',auth, bookCtrl.deleteBook);
router.put('/:id', auth,multer.upload, sharp.optimizeAndConvertToWebP, bookCtrl.modifyBook);

module.exports = router;
