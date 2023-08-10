const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
require('dotenv').config();

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token,process.env.RAMDOM_TOKEN_SECRET);
        const userId = decodedToken.userId
        req.auth = {userId}
    next()
    }
    catch (error) {
        res.status(httpStatus.UNAUTHORIZED).json({ error })
    }
};