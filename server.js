const express = require('express');
const cors = require('cors');
const pool = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Test DB connection on startup ---
(async () => {
    try {
      await pool.query('SELECT 1');
      console.log('PostgreSQL connection successful.');
    } catch (err) {
      console.error('PostgreSQL connection failed:', err);
      process.exit(1); // Exit the app if DB is unavailable
    }
  })();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//testing purposes
app.get('/api/alignments', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM alignments');
      res.json(result.rows);
    } catch (err) {
      console.error('Error querying alignments:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });