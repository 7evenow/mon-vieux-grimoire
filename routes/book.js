const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating',multer, bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);
router.post('/',auth, multer, bookCtrl.createBook);
router.post('/:id/rating', auth, multer, bookCtrl.createRating);
router.delete('/:id',auth, bookCtrl.deleteBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);

module.exports = router;
