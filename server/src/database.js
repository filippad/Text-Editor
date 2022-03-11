const path = require('path'); //  Helps resolve relative paths, into absolute baths, independent of operating system
const { Database } = require('sqlite3').verbose();
const model = require('./model.js');

const databasePath = path.join(__dirname, '..', 'db.sqlite');
const db = new Database(databasePath);
const userinfoTableName = 'userinfo';
const documentTableName = 'documents';

db.serialize(() => {
  const checkString = 'SELECT * FROM sqlite_master WHERE name = ? AND type=\'table\';';
  const checkStatement = db.prepare(checkString);
  checkStatement.all(`${userinfoTableName}`, (err, rows) => {
    if (err) {
      console.error('Problem occurred when trying to connect to the database.');
    } else if (rows.length === 0) {
      const creatString = `CREATE TABLE ${userinfoTableName} (id INTEGER PRIMARY KEY, username TEXT NOT NULL, 
        password TEXT NOT NULL);`;
      const createStatement = db.prepare(creatString);
      createStatement.run((dbErr) => {
        if (dbErr) {
          console.error('Problem occurred when trying to create new database table for userinfo.');
        } else {
          console.log('Database table for userinfo has been created.');
        }
      });
      createStatement.finalize();
    }
  });
  checkStatement.finalize();

  const checkDocString = 'SELECT * FROM sqlite_master WHERE name = ? AND type=\'table\';';
  const checkDocStatement = db.prepare(checkDocString);
  checkDocStatement.all(`${documentTableName}`, (err, rows) => {
    if (err) {
      console.error('Problem occurred when trying to connect to the database.');
    } else if (rows.length === 0) {
      const creatString = `CREATE TABLE ${documentTableName} (id INTEGER PRIMARY KEY, name TEXT NOT NULL, 
        createdBy TEXT NOT NULL, content TEXT);`;
      const createStatement = db.prepare(creatString);
      createStatement.run((dbErr) => {
        if (dbErr) {
          console.error('Problem occurred when trying to create new database table for documents.');
        } else {
          console.log('Database table for documents has been created.');
        }
      });
      createStatement.finalize();
    } else {
      const getString = 'SELECT * from documents';
      const getStatement = db.prepare(getString);
      getStatement.all((getErr, docRows) => {
        if (getErr) {
          console.error('Unable to load rooms from the database');
        } else {
          docRows.forEach((row) => {
            model.addDocument(row);
          });
        }
      });
      getStatement.finalize();
    }
  });
  checkDocStatement.finalize();

  const loggedInUsers = 'loggedInUsers';
  const checkUsers = 'SELECT * FROM sqlite_master WHERE name = ? AND type=\'table\';';
  const checkUsersStatement = db.prepare(checkUsers);
  checkUsersStatement.all(`${loggedInUsers}`, (err, rows) => {
    if (err) {
      console.error('Problem occurred when trying to connect to the database.');
    } else if (rows.length === 0) {
      const creatString = `CREATE TABLE ${loggedInUsers} (id INTEGER PRIMARY KEY, username TEXT NOT NULL);`;
      const createStatement = db.prepare(creatString);
      createStatement.run((dbErr) => {
        if (dbErr) {
          console.error('Problem occurred when trying to create new database table for logged in users.');
        } else {
          console.log('Database table for logged in users has been created.');
        }
      });
      createStatement.finalize();
    }
  });
  checkUsersStatement.finalize();
});


module.exports = db;
