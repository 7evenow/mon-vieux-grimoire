const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
         // Extraction du token JWT de l'en-tête Authorization
        const token = req.headers.authorization.split(' ')[1];
        // Vérification et décodage du token JWT à l'aide de la clé secrète
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        // Récupération de l'identifiant de l'utilisateur depuis le token décodé
        const userId = decodedToken.userId
        // Ajout des informations d'authentification à l'objet `req` pour être accessible dans les routes suivantes
        req.auth = { userId }
    next()
    }
    // En cas d'erreur lors de la vérification du token ou si le token est manquant
    // Une réponse d'erreur d'authentification est renvoyée
    catch (error) {
        res.status(httpStatus.UNAUTHORIZED).json({ error })
    }
};