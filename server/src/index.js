// enhances log messages with timestamps etc
const betterLogging = require('better-logging');

const { Theme } = betterLogging;
betterLogging(console, {
  color: Theme.green,
});

const path = require('path'); // helper library for resolving relative paths
const expressSession = require('express-session');
const socketIOSession = require('express-socket.io-session');
const express = require('express');
// const http = require('http');
const https = require('https');
const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const helmet = require('helmet');

console.logLevel = 4; // Enables debug output
const publicPath = path.join(__dirname, '..', '..', 'client', 'dist');
const privateKey = fs.readFileSync(path.join(__dirname, '..', '..', 'key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, '..', '..', 'server.crt'), 'utf8');
const credentials = { key: privateKey, cert: certificate };
const port = 8989; // The port that the server will listen to
const app = express(); // Creates express app
console.log(__dirname);

// const httpServer = http.Server(app);
const httpsServer = https.Server(credentials, app);
// eslint-disable-next-line import/order
const io = require('socket.io').listen(httpsServer); // Creates socket.io app
const model = require('./model.js');

// Setup middleware
app.use(betterLogging.expressMiddleware(console, {
  ip: { show: true, color: Theme.green.base },
  method: { show: true, color: Theme.green.base },
  header: { show: false },
  path: { show: true },
  body: { show: true },
}));
app.use(express.json()); /*
This is a middleware that parses the body of the request into a javascript object.
It's basically just replacing the body property like this:
req.body = JSON.parse(req.body)
*/
app.use(express.urlencoded({ extended: true }));

// Setup session
const session = expressSession({
  secret: 'Super secret! Shh! Do not tell anyone...',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: { maxAge: 5 * 60 * 1000 },
});
app.use(session);
io.use(socketIOSession(session, {
  autoSave: true,
  saveUninitialized: true,
}));

// Serve client
app.use(express.static(publicPath));/*
express.static(absolutePathToPublicDirectory)
This will serve static files from the public directory, starting with index.html
*/

// Setup helmet for security purposes
app.use(helmet());

// Bind REST controllers to /api/*
const auth = require('./controllers/auth.controller.js');
const user = require('./controllers/user.controller.js');
const document = require('./controllers/document.controller.js');

app.use('/api', auth.router);
app.use('/api', auth.requireAuth, document.router);
app.use('/api', auth.userRequireAuth, user.router);

model.init({ io });

// Handle connected socket.io sockets
io.on('connection', (socket) => {
  // This function serves to bind socket.io connections to user models
  if (socket.handshake.session.userID
    && model.findUser(socket.handshake.session.userID) !== undefined
  ) {
    // If the current user already logged in and then reload the page
    model.updateUserSocket(socket.handshake.session.userID, socket);
    console.log('user already logged in so update the socket!');
  } else {
    socket.handshake.session.socketID = model.addUnregisteredSocket(socket);
    socket.handshake.session.save((err) => {
      if (err) console.error(err);
      else console.debug(`Saved socketID: ${socket.handshake.session.socketID}`);
    });
  }

  model.getDocuments().forEach((doc) => {
    socket.on(`document${doc.id}ChangeFromClient`, (data) => {
      console.log('listening on client websocket emit signal');
      console.log(doc.id);
      const { docID, content } = data;
      model.updateDocument(docID, content);
    });
  });

  model.addSocket(socket);
});

// Start server
// httpServer.listen(port, () => {
//   console.log(`Listening on http://localhost:${port}`);
// });
httpsServer.listen(port, () => {
  console.log(`Listening on https://localhost:${port}`);
});
