const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating',multer.upload, multer.optimizeAndConvertToWebP, bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);
router.post('/',auth, multer.upload, multer.optimizeAndConvertToWebP, bookCtrl.createBook);
router.post('/:id/rating', auth, multer.upload, multer.optimizeAndConvertToWebP, bookCtrl.createRating);
router.delete('/:id',auth, bookCtrl.deleteBook);
router.put('/:id', auth,multer.upload, multer.optimizeAndConvertToWebP, bookCtrl.modifyBook);

module.exports = router;
