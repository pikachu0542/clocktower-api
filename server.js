const express = require('express');
const cors = require('cors');
const pool = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log("testing testing testing");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
