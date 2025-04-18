const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authentication = require('./authentication')

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function handleError(res, errObj) {
  res.status(errObj.code).json({error: errObj.message})
}

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

//gets all alignments
app.get('/api/alignments', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM alignments');
      res.json(result.rows);
    } catch (err) {
      console.error('Error querying alignments:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

//adds a new role, requires authentication
app.post('/api/addrole', authenticationMiddleware, async (req, res) => {
  const {role_name, description, team_id, edition_id} = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO roles (role_name, description, team_id, edition_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [role_name, description, team_id, edition_id]
    );

    res.status(201).json(result.rows[0]); // Return the newly created role
  }catch (err) {
      console.error('Error adding role:', err);
      res.status(500).json({ error: 'Database error' });
    }
})

//get list of scripts
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scripts');
    res.json(result.rows);
  } catch (err) {
    console.error('Error querying scripts:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//get a specific script by id
  app.get('/api/scripts/:id', async (req, res) => {
    const scriptId = req.params.id;
    try {
      const script_result = await pool.query('SELECT * FROM scripts WHERE id = $1', [scriptId]);
      if (script_result.rows.length === 0) {
        return res.status(404).json({ error: 'Script not found' });
      }
      const script_roles_result = await pool.query(
        `SELECT
            r.id,
            r.role_name,
            r.description,
            t.team_name,
            a.alignment_name
          FROM roles r
            JOIN script_roles sr ON r.id = sr.role_id
            JOIN role_teams t ON r.team_id = t.id
            JOIN alignments a ON t.alignment_id = a.id
          WHERE sr.script_id = $1;`,
  [scriptId]);
      
      script_result.rows[0].roles = script_roles_result.rows.map(row => ({
        id: row.id,
        role_name: row.role_name,
        description: row.description,
        team_name: row.team_name,
        alignment_name: row.alignment_name
      }));

      res.json(script_result.rows[0]);
      
    } catch (err) {
      console.error('Error querying script:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  //get all roles for role viewer
  //returns all roles with their id, name, description, team name, and alignment name
  app.get('/api/roles/', async (req, res) => {
    const scriptId = req.params.id;
    try {
      const roles_result = await pool.query(
        `SELECT
          r.id,
          r.role_name,
          r.description,
          t.team_name,
          a.alignment_name
        FROM roles r
         JOIN role_teams t ON r.team_id = t.id
         JOIN alignments a ON t.alignment_id = a.id;`);
      res.json(roles_result.rows);     
    } catch (err) {
      console.error('Error querying script:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // authentication endpoints
  app.post('/auth/register/', async (req, res) => {
    
    const username = req.body.username;
    const password = req.body.password;
    
    authentication.register(username, password).then((token) => {
      res.json({token})
    }, (errObj) => handleError(res, errObj))
  });
  
  
  app.post('/auth/login/', async (req, res) => {
    
    const username = req.body.username;
    const password = req.body.password;
    
    authentication.login(username, password).then((token) => {
      res.json({token})
    }, (errObj) => handleError(res, errObj))
  })
  
  
  
  function authenticationMiddleware(req, res, next) {
    
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1]
  
      if (token == null) return res.sendStatus(401)
  
      authentication.validateToken(token).then((user) => {
        req.user = user
        next()
      }, (errObj) => handleError(res, errObj))
  }
