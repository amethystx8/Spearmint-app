const express = require('express');
const cors = require('cors'); // <-- add this
const app = express();
const port = 3000;

app.use(cors()); // <-- add this
app.use(express.json()); // <-- add this

const usersRouter = require('./routes/users');

// Define a basic route
app.get('/', (req, res) => {
  res.send('Hello from Express.js!');
});

app.use('/users', usersRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});