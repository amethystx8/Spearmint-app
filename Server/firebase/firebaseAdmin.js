// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json'); // downloaded from Firebase

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();
// module.exports = { db };


const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
module.exports = { db };