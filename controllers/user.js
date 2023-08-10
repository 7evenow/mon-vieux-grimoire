const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');

exports.signup = (req, res, next) => {
    bcrypt
        .hash(req.body.password, Number(process.env.HASH_ROUND))
        .then((hash) => {
            const user = new User({
                email: req.body.email,
                password: hash,
            });
            user.save()
                .then(() => res.status(201).json({ message: "Utilisateur crée !" }))
                .catch((err) => res.status(500).json({ message: err }));
            })
        .catch((err) => res.status(500).json({ message: err.message }));
};
exports.login = (req, res, next) => {
    console.log(req.body.email)
    User.findOne({ email: req.body.email })
       .then(user => {
           if (!user) {
               return res.status(401).json({ message: 'Paire login/mot de passe incorrecte'});
           }
           bcrypt.compare(req.body.password, user.password)
               .then(valid => {
                   if (!valid) {
                       return res.status(401).json({ message: 'Paire login/mot de passe incorrecte' });
                   }
                   return res.status(200)({
                       userId: user._id,
                       token: jwt.sign(
                           { userId: user._id },
                           process.env.RAMDOM_TOKEN_SECRET,
                           { expiresIn: '24h' }
                       )
                   });
               })
               .catch(() => res.status(httpStatus.INTERNAL_SERVER_ERROR));
       })
       .catch(() => res.status(httpStatus.INTERNAL_SERVER_ERROR));
};
