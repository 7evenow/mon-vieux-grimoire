const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');

exports.signup = async (req, res, next) => {
    try {
        const hash = await bcrypt.hash(req.body.password, Number(process.env.HASH_ROUND));
        const user = new User({
            email: req.body.email,
            password: hash,
        });
        await user.save();
        res.status(httpStatus.CREATED).json({ message: "Utilisateur créé !" });
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};
exports.login = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' });
        }
        const password = await bcrypt.compare(req.body.password, user.password)
        if (!password) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Paire login/mot de passe incorrecte' });
        }
        return res.status(httpStatus.OK).json({
            userId: user._id,
            token: jwt.sign(
                { userId: user._id },
                process.env.TOKEN_SECRET,
                { expiresIn: '24h' }
            )
        });
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}