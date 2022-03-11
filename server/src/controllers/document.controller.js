const express = require('express');
const model = require('../model.js');

const router = express.Router();

/**
 * Fetch the list the currently active rooms
 * @returns {void}
 */
router.get('/documentList', (req, res) => {
  const documents = model.getDocuments();
  res.status(200).json({ list: documents });
});

/**
 * Join the specific room.
 * This will allow the user-session to listen to and post messages in the given room.
 * @param {String} req.params.room - The id of the room you would like to join
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
router.get('/document/:documentID/join', (req, res) => {
  const document = model.findDocument(req.params.documentID);
  if (document === undefined) {
    res.status(404).json({
      msg: `No document with ID: ${req.params.documentID}`,
      href_roomList: '/documentList',
    });
    return;
  }

  // Send http response
  res.status(200).json({
    doc: document,
    msg: `Successfully joined room: ${document.id}`,
    href_messages: `/document/${document.id}`,
    href_send_message: `/document/${document.id}/message`,
  });
});

module.exports = { router };
