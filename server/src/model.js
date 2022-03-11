const Document = require('./models/document.model');
// const User = require('./models/user.model');
const db = require('./database');

/**
 * documents & users are effectively hash maps with the name of the entry serving as a unique key.
 */
let documents = {};
let users = {};
const sockets = [];

/**
 * unregisteredSockets is used as a temporary pool of sockets
 * that belonging to users who are yet to login.
 */
let nextUnregisteredSocketID = 0;
let unregisteredSockets = {};

// Will be initialized in the exports.init function
exports.io = undefined;

/**
 * Initialize the model
 * @param { { io: SocketIO.Server} } config - The configurations needed to initialize the model.
 * @returns {void}
 */
exports.init = ({ io }) => {
  exports.io = io;
  db.serialize(() => {
    const statement = db.prepare('SELECT * FROM loggedInUsers;');
    statement.all((dbErr, rows) => {
      if (dbErr) {
        console.error('Unable to load user info');
      } else {
        rows.forEach((row) => {
          users[row.id] = row;
        });
      }
    });
    statement.finalize();
  });
};

/**
 * Add a socket.io socket to the pool of unregistered sockets
 * @param {SocketIO.Socket} socket - The socket.io socket to add to the pool.
 * @returns {Number} The ID of the socket in the pool of unregistered sockets.
 */
exports.addUnregisteredSocket = (socket) => {
  const socketID = nextUnregisteredSocketID;
  nextUnregisteredSocketID += 1;

  unregisteredSockets[socketID] = socket;
  return socketID;
};
const assignUnregisteredSocket = (socketID) => {
  const socket = unregisteredSockets[socketID];
  unregisteredSockets = Object.keys(unregisteredSockets)
    .filter((sockID) => sockID !== socketID)
    .reduce((res, sockID) => ({ ...res, [sockID]: unregisteredSockets[sockID] }), {});

  return socket;
};

/**
 * Add a message to a room & push out the message to all connected clients
 * @param {String} roomName - The name of the room to add the message to.
 * @param {String} message - The message to add.
 * @returns {void}
 */
exports.addMessage = (roomName, message) => {
  exports.findDocument(roomName).addMessage(message);
  exports.io.in(roomName).emit('msg', message);
  console.log(roomName, message);
};

/**
 * Creates a user with the given id and name.
 * @param user - The new user to be added.
 * @param {Number} socketID - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @see model.addUnregisteredSocket
 * @returns {void}
 */
exports.addUser = (user, socketID = undefined) => {
  users[user.id] = user;
  if (socketID !== undefined) {
    // same user can log in multiple times on different browsers
    // if this isn't taken into consideration, then the socket will be overwritten
    // each time, meaning that web socket will not work properly when updating
    // the document content
    console.log(`socketID: ${socketID}, userID: ${user.id}`);
    users[user.id].socket = assignUnregisteredSocket(socketID);
  }
};

exports.addDocument = (document, doEmit = false) => {
  if (document.content === undefined) {
    document.content = '';
  }
  const docObject = new Document(document.id, document.name, document.createdBy, document.content);
  documents[document.id] = docObject;
  if (doEmit) {
    exports.io.emit('addNewDocument', docObject);
    exports.io.emit(`user${document.createdBy}newDoc`, document);
  }
};

/**
 * Updated the socket associated with the user with the given name.
 * @param {String} id - The id of the user.
 * @param {SocketIO.Socket} socket - A socket.io socket.
 * @returns {void}
 */
exports.updateUserSocket = (id, socket) => {
  users[id].socket = socket;
  // users[id].socket[nextUnregisteredSocketID] = socket;
};

exports.getSocketID = () => nextUnregisteredSocketID;

exports.incrementSocketID = () => { nextUnregisteredSocketID += 1; };
/**
 * Returns the user object with the given name.
 * @param {integer} id - The id of the user.
 * @returns {User}
 */
exports.findUser = (id) => users[id];

exports.getUsers = () => users;

/**
 * Removes the room object with the matching name.
 * @param {String} id - The name of the room.
 * @returns {void}
 */
exports.removeUser = (id) => {
  users = Object.values(users)
    .filter((user) => user.name !== id)
    .reduce((res, user) => ({ ...res, [user.id]: user }), {});
};

/**
 * Returns list of all documents.
 * @returns {Document[]}
 */
exports.getDocuments = () => Object.values(documents);

/**
 * Removes the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {void}
 */
exports.removeDocument = (documentID, user) => {
  documents = Object.values(documents)
    .filter((doc) => doc.id !== documentID)
    .reduce((res, doc) => ({ ...res, [doc.id]: doc }), {});
  exports.io.emit('removeDocument', documentID);
  exports.io.emit(`user${user}deleteDoc`, documentID);
};

/**
 * Return the room object with the matching name.
 * @param {String} name - The name of the room.
 * @returns {Room}
 */
exports.findDocument = (name) => documents[name];

const updateDbContent = (documentId, newContent) => {
  db.serialize(() => {
    const statement = db.prepare('UPDATE documents SET content = ? where id = ?;');
    statement.run([`${newContent}`, `${documentId}`], (dbErr) => {
      if (dbErr) {
        console.error('Unable to save new document content');
      }
    });
    statement.finalize();
  });
};

exports.updateDocument = (documentID, payload) => {
  console.log(documentID);
  console.log(documents[documentID]);
  console.log(`payload is: ${payload}`);
  if (documents[documentID] !== undefined) {
    documents[documentID].changeContent(payload);
    exports.io.emit(`serverUpdateDocument${documentID}`, payload);
    updateDbContent(documentID, payload);
  } else {
    // if document is removed send signal to client to kick everyone out of the document
    exports.io.emit(`serverErrorDocument${documentID}`, 'document removed');
  }
};

exports.addSocket = (socket) => { sockets.push(socket); };
exports.getSockets = () => sockets;
