const { expressjwt: expressJwt } = require('express-jwt');
require('dotenv').config(); // Load environment variables

function authJwt() {
    const api = process.env.API_URL;

    return expressJwt({
        secret: process.env.secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked,
    }).unless({
        path: [
            { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/category(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/v1\/orders(.*)/, methods: ['GET', 'OPTIONS'] },
            `${api}/users/login`,
            `${api}/users/register`,
        ],
    });
}

async function isRevoked(req, payload, done) {
    try {
        if (!payload.isAdmin) {
            return done(null, true);
        }

        done(null, false);
    } catch (error) {
        done(error, true);
    }
}

module.exports = authJwt;
