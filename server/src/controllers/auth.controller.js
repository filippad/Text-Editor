const bcrypt = require('bcrypt');
const express = require('express');
const db = require('../database');
const model = require('../model.js');

const router = express.Router();
const saltRounds = 10;

/**
 * requireAuth is an endpoint guard for logged in users.
 * aka: A middle ware used to limit access to an endpoint to authenticated users
 * @param {Request} req
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @param {Response} res
 * @param {Function} next
 * @returns {void}
 */
const requireAuth = (req, res, next) => {
  const maybeUser = model.findUser(req.session.userID);

  // "auth" check
  if (maybeUser === undefined) {
    console.log(`Undefined user, Id: ${req.session.userID}`);
    res.status(401).json({
      msg: 'Unauthorized. Please make sure you are logged in before attempting this action again.',
    });
    return;
  }

  next();
};

const userRequireAuth = (req, res, next) => {
  const maybeUser = model.findUser(req.session.userID);
  console.log(`User require auth: ${req.session.userID}, maybeuser: ${maybeUser === undefined}`);
  if (maybeUser === undefined || req.session.userID !== req.body.currentUser) {
    res.status(401).json({
      msg: 'Unauthorized operation.',
    });
    return;
  }

  next();
};

router.post('/register', (req, res) => {
  console.log(req.body);
  const query = req.body;
  const { username, password, repeatedPassword } = query;
  let statusMessage = '';
  let validUserInfo = true;

  if (username.length < 5) {
    statusMessage += 'Username must be longer than 5 characters. \n ';
    validUserInfo = false;
  }

  if (password !== repeatedPassword) {
    validUserInfo = false;
    statusMessage += 'Password does not match \n';
  } else if (password.length < 5) {
    validUserInfo = false;
    statusMessage += 'Password must be at least 5 characters long. \n';
  }

  const regExpression = /^(?=.*[0-9])(?=.*[a-zA-Z])(.+)$/;
  if (!regExpression.test(password)) {
    validUserInfo = false;
    statusMessage += 'Password must contain at least a character and a number. \n';
  }

  if (validUserInfo) {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      bcrypt.hash(password, salt, (hashErr, hash) => {
        db.serialize(() => {
          const statement = db.prepare('INSERT INTO userinfo (username, password) VALUES (?, ?);');
          statement.run([`${username}`, `${hash}`], (dbErr) => {
            if (dbErr) {
              res.status(400).json({
                msg: 'Username already exists',
              });
            } else {
              res.status(201).json({
                msg: 'Success',
              });
            }
          });
          statement.finalize();
        });
      });
    });
  } else {
    res.status(400).json({
      msg: statusMessage,
    });
  }
});

/**
 * Tells the client if they are in an authenticated user-session.
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
router.get('/isAuthenticated', (req, res) => {
  const maybeUser = model.findUser(req.session.userID);

  if (maybeUser === undefined) {
    res.status(200).json({
      isAuthenticated: false,
      currentUser: 'N/A',
    });
  } else {
    const statement = db.prepare('SELECT * FROM userinfo WHERE id=?;');
    statement.get(`${req.session.userID}`, (err, row) => {
      if (err) {
        res.status(200).json({
          isAuthenticated: false,
          currentUser: 'N/A',
        });
      } else {
        row.password = '';
        res.status(200).json({
          isAuthenticated: true,
          currentUser: row,
        });
      }
    });
    statement.finalize();
  }
});

/**
 * Attempts to authenticate the user-session
 * @param {String} req.body.username - The username of the user attempting to authenticate
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
router.post('/authenticate', (req, res) => {
  console.log('In authenticate');
  db.serialize(() => {
    const statement = db.prepare('SELECT * FROM userinfo WHERE username=?;');
    statement.get(`${req.body.username}`, (err, row) => {
      if (err) {
        res.status(403).json({
          msg: 'Bad credentials: username does not exists.',
        });
      } else if (row) {
        bcrypt.compare(req.body.password, row.password, (bcryptErr, result) => {
          if (bcryptErr) {
            res.status(403).json({
              msg: 'Bad credentials',
            });
          } else if (result) {
            const statement2 = db.prepare('INSERT INTO loggedInUsers (id, username) VALUES (?, ?);');
            statement2.run([`${row.id}`, `${row.username}`], (dbErr) => {
              if (dbErr) {
                console.log('User is already logged in. Database is not updated.');
              }
              console.log(`socketID: ${req.body.socketID}`);
              model.addUser(row, req.body.socketID);
              req.session.userID = row.id;
              row.password = '';
              res.status(200).json({
                msg: 'Success',
                currentUser: row,
              });
            });
          } else {
            res.status(403).json({
              msg: 'Bad credentials: password is incorrect.',
            });
          }
        });
      } else {
        res.status(403).json({
          msg: 'Bad credentials',
        });
      }
    });
    statement.finalize();
  });
});

const deleteLoggedInUser = (userId) => {
  db.serialize(() => {
    const deleteString = 'DELETE FROM loggedInUsers WHERE id = ?';
    const deleteStatement = db.prepare(deleteString);
    deleteStatement.run(`${userId}`, (dbErr) => {
      if (dbErr) {
        console.error('Problem occurred when trying to delete logged out user.');
      }
    });
    deleteStatement.finalize();
  });
};

router.get('/signout', (req, res) => {
  console.log('Signing out...');
  const { userID } = req.session;
  const maybeUser = model.findUser(req.session.userID);
  console.log(`User require auth: ${req.session.userID}, maybeuser: ${maybeUser === undefined}`);
  if (maybeUser === undefined) {
    res.status(401).json({
      msg: 'Unauthorized operation.',
    });
  } else {
    req.session.destroy((err) => {
      if (err) {
        console.log('Unable to destroy session');
        res.status(403).json({
          msg: 'Unable to sign out',
        });
      } else {
        deleteLoggedInUser(userID);
        model.removeUser(userID);
        res.status(200).json({
          msg: 'Success',
        });
      }
    });
  }
});

module.exports = { router, requireAuth, userRequireAuth };
