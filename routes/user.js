const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');// Contrôleur pour les actions sur les utilisateurs

router.post('/signup',userCtrl.signup)
router.post('/login',userCtrl.login)

module.exports = router;