const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');

exports.signup = async (req, res, next) => {
    try {
         // Hashage du mot de passe de l'utilisateur avant de le stocker en base de données
        const hash = await bcrypt.hash(req.body.password, Number(process.env.HASH_ROUND));
        // Création d'une instance de modèle User avec l'email et le mot de passe hashé
        const user = new User({
            email: req.body.email,
            password: hash,
        });
        // Sauvegarde de l'utilisateur dans la base de données
        await user.save();
        // Réponse de succès en cas de création réussie de l'utilisateur
        res.status(httpStatus.CREATED).json({ message: "Utilisateur créé !" });
    }
    // Gestion des erreurs, notamment les erreurs liées à la base de données ou au hashage
    catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error });
    }
};
exports.login = async (req, res, next) => {
    try {
         // Recherche de l'utilisateur dans la base de données par son email
        const user = await User.findOne({ email: req.body.email });
        // Vérification de l'existence de l'utilisateur
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' });
        }
        // Comparaison du mot de passe saisi avec le mot de passe hashé stocké
        const password = await bcrypt.compare(req.body.password, user.password)
        // Vérification de la correspondance des mots de passe
        if (!password) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' });
        }
        // Création d'un jeton d'authentification (token) pour l'utilisateur et envoi en reponse 
        return res.status(httpStatus.OK).json({
            userId: user._id,
            token: jwt.sign(
                { userId: user._id },
                process.env.TOKEN_SECRET,
                { expiresIn: '24h' }
            )
        });
    }
    // Gestion des erreurs, notamment les erreurs liées à la base de données ou à la comparaison de mots de passe
    catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error });
    }
}