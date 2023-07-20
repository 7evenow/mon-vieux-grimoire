const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token,'#fbZb5dS]Z^NGH&z}$10do""LKtlYL%X>WIz^#AUZ@T+t');
        const userId = decodedToken.userId
        req.auth = {userId}
    next()
    }
    catch (error) {
        res.status(401).json({ error })
    }
};