const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for a user.
 * @param {Object} user - The user object.
 * @returns {string} - The JWT token.
 */
function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

module.exports = {
    generateToken
}