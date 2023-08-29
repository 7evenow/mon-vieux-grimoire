const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating',multer.upload, sharp.optimizeAndConvertToWebP, bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);
router.post('/',auth, multer.upload, sharp.optimizeAndConvertToWebP, bookCtrl.createBook);
router.post('/:id/rating', auth, multer.upload,sharp.optimizeAndConvertToWebP, bookCtrl.createRating);
router.delete('/:id',auth, bookCtrl.deleteBook);
router.put('/:id', auth,multer.upload, sharp.optimizeAndConvertToWebP, bookCtrl.modifyBook);

module.exports = router;
