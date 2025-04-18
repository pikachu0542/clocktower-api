const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db');


const saltRounds = 10;

const USERNAME_OR_PASSWORD_INCORRECT = "Username or password incorrect."
const USERNAME_ALREADY_IN_USE = "This username is already in use."

function generateAccessToken(username) {
    return jwt.sign({username}, process.env.TOKEN_SECRET, { expiresIn: '2h' }); // 2hr token
}

function authenticationMiddleware(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        
        if (err) {
            console.error(err)
            return res.sendStatus(403)
        }

        req.user = user

        next()
    })
}

function register(username, password) {
    
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                reject({code: 401, message: ""})
            }
            
            return pool.query(
                'INSERT INTO users(username, password_hash) VALUES ($1, $2);',
                [username, hash]
            ).then(() => {
                resolve(login(username, password))
            }, (err) => {
                if (err.code == 23505) {
                    reject({code: 409, message: USERNAME_ALREADY_IN_USE})
                }
                reject({code: 500, message: ""})
            })
        });
    })
}

async function login(username, password) {
    
    return new Promise((resolve, reject) => {
        pool.query(
            'SELECT users.password_hash FROM users WHERE username = $1;',
            [username]
        ).then((val) => {
            if (val.rowCount == 0) {
                reject({code: 403, message: USERNAME_OR_PASSWORD_INCORRECT})
            } else {
                bcrypt.compare(password, val.rows[0].password_hash, (err, result) => {
                    if (err || !result) {
                        reject({code: 403, message: USERNAME_OR_PASSWORD_INCORRECT})
                    } else {
                        resolve(generateAccessToken(username))
                    }
                });
            }
        }, () => reject({code: 500, message: ""}))
    })
    
}

module.exports = {
    authenticationMiddleware,
    register,
    login
}
