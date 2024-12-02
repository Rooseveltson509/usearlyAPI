/* // Imports
//var jwt = require('jsonwebtoken');
import jwt from 'jsonwebtoken';

const JWT_SIGN_SECRET = '0sjhfd6ggigb6ojds0ndbmetezfetvwzwzgegzz54dffefedfdzreerh0GHJGD';

// Exported function
module.exports = {
    generateTokenForUser: function(userData) {
        return jwt.sign({
                userId: userData.id,
                email: userData.email
            },
            JWT_SIGN_SECRET, {
                expiresIn: '24h'
            })
    },
    parseAuthorization: function(authorization) {
        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
    },
    getUserId: function(authorization) {
        var userId = -1;
        var token = module.exports.parseAuthorization(authorization);
        if (token != null) {
            try {
                var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
                if (jwtToken != null)
                    userId = jwtToken.userId;
            } catch (err) {}
        }
        return userId;
    }
} */


// Imports
import jwt from 'jsonwebtoken';

const JWT_SIGN_SECRET = '0sjhfd6ggigb6ojds0ndbmetezfetvwzwzgegzz54dffefedfdzreerh0GHJGD';

// Exported functions
export function generateTokenForUser(userData) {
    return jwt.sign({
            userId: userData.id,
            email: userData.email
        },
        JWT_SIGN_SECRET, {
            expiresIn: '24h'
        }
    );
}

export function parseAuthorization(authorization) {
    return (authorization != null) ? authorization.replace('Bearer ', '') : null;
}

export function getUserId(authorization) {
    let userId = -1;
    const token = parseAuthorization(authorization);
    if (token != null) {
        try {
            const jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
            if (jwtToken != null) {
                userId = jwtToken.userId;
            }
        } catch (err) {
            console.error("Error verifying token:", err);
        }
    }
    return userId;
}
