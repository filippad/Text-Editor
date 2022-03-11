const express = require('express');
const db = require('../database');
const model = require('../model.js');

const router = express.Router();

router.post('/addDocument', (req, res) => {
  db.serialize(() => {
    const checkString = 'SELECT name FROM documents WHERE createdBy=?';
    const checkStatement = db.prepare(checkString);
    checkStatement.get([`${req.body.currentUser}`], (checkErr, row) => {
      if (checkErr) {
        res.status(404).json({
          msg: 'Unable to save document',
        });
      } else if (row !== undefined && row.name === req.body.docName) {
        res.status(400).json({
          msg: 'A document with the same name already exists',
        });
      } else {
        console.log(`Currentuser: ${req.body.currentUser}`);
        const insertString = 'INSERT INTO documents (name, createdBy) VALUES (?,?);';
        const insertStatement = db.prepare(insertString);
        insertStatement.run([`${req.body.docName}`, `${req.body.currentUser}`], (err) => {
          if (err) {
            res.status(404).json({
              msg: 'Unable to save document',
            });
          } else {
            const getString = 'SELECT * from documents WHERE name = ? AND createdBy = ? ';
            const getStatement = db.prepare(getString);
            getStatement.get([req.body.docName, req.body.currentUser], (getErr, getRow) => {
              if (getErr) {
                res.status(404).json({
                  msg: 'Unable to fetch timeslots',
                });
              } else {
                model.addDocument(getRow, true);
                model.getSockets().forEach((socket) => {
                  socket.on(`document${getRow.id}ChangeFromClient`, (data) => {
                    console.log('listening on client websocket emit signal');
                    console.log(getRow.id);
                    const { docID, content } = data;
                    model.updateDocument(docID, content);
                  });
                });
                res.status(200).json({
                  msg: 'Success',
                });
              }
            });
          }
        });
      }
    });
  });
});

router.post('/deleteDocuments', (req, res) => {
  let argsString = '';
  const args = [];
  let resMessage = 'Success';
  const { currentUser, documents } = req.body;
  for (let i = 0; i < documents.length; i += 1) {
    const doc = documents[i];
    if (doc.createdBy.toString() === currentUser.toString()) {
      if (argsString === '') {
        argsString += '?';
      } else {
        argsString += ',?';
      }
      args.push(doc.id);
    } else {
      resMessage = 'Unauthorized operation';
    }
  }

  db.serialize(() => {
    const deleteString = `DELETE FROM documents WHERE id IN (${argsString})`;
    console.log(`insertString: ${deleteString}`);
    console.log(`args: ${args}`);
    const deleteStatement = db.prepare(deleteString);
    deleteStatement.run(args, (err) => {
      if (err) {
        res.status(404).json({
          msg: 'Unable to delete documents',
        });
      } else {
        for (let i = 0; i < args.length; i += 1) {
          const id = args[i];
          model.removeDocument(id, req.body.currentUser);
        }
        res.status(200).json({
          msg: resMessage,
        });
      }
    });
    deleteStatement.finalize();
  });
});

router.post('/getMyDocuments', (req, res) => {
  db.serialize(() => {
    const selectString = 'SELECT * from documents WHERE createdBy = ?';
    const selectStatement = db.prepare(selectString);
    selectStatement.all(`${req.body.currentUser}`, (err, rows) => {
      if (err) {
        res.status(404).json({
          msg: 'Unable to fetch documents',
        });
      } else {
        res.status(200).json({
          msg: 'Success',
          myDocuments: rows,
        });
      }
    });
    selectStatement.finalize();
  });
});

module.exports = { router };
