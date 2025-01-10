const { validationResult } = require('express-validator');

/**
 * Since express-validator doesn't automatically return a 400 error, we use this middleware to do so.
 * @param {*} req - The request object.
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = validateRequest;