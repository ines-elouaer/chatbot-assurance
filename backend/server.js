require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET est manquant dans le fichier .env');
}
const fs = require('fs');

pool.connect()
  .then(() => console.log("âœ… Connexion PostgreSQL rÃ©ussie"))
  .catch(err => console.error("âŒ Erreur PostgreSQL:", err.message));

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(bodyParser.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
}
function isAgent(req, res, next) {
  if (req.user?.role === 'agent') {
    return next();
  }
  return res.status(403).json({ error: 'AccÃ¨s rÃ©servÃ© aux agents' });
}

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'AccÃ¨s rÃ©servÃ© aux administrateurs' });
}



app.post('/api/register', async (req, res) => {
  const { username, password, region, agent_id, role = 'client' } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password, role, region, agent_id) VALUES ($1, $2, $3, $4, $5)',
      [username, hashedPassword, role, region, agent_id]
    );
    res.status(201).json({ message: 'Utilisateur inscrit avec succÃ¨s' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password, role: selectedRole } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND $2 = ANY(roles)',
    [username, selectedRole]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Utilisateur / rÃ´le non trouvÃ©' });
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  const token = jwt.sign(
    { id: user.id, roles: user.roles, role: selectedRole }, // ðŸŸ¢ rÃ´le choisi ajoutÃ©
    SECRET_KEY,
    { expiresIn: '2h' }
  );

  res.json({
    message: 'Connexion rÃ©ussie',
    token,
    username: user.username,
    roles: user.roles,
    role: selectedRole
  });
});

function isAgent(req, res, next) {
  if (req.user?.roles?.includes('agent')) return next();
  return res.status(403).json({ error: 'AccÃ¨s rÃ©servÃ© aux agents' });
}

function isAdmin(req, res, next) {
  if (req.user?.roles?.includes('admin')) return next();
  return res.status(403).json({ error: 'AccÃ¨s rÃ©servÃ© aux administrateurs' });
}

const messageRouter = require('./messageRouter');


app.post('/api/chat', authenticateToken, async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.user.id;

  try {
    // Appel intelligent  NLP
    const botResponse = await messageRouter(userMessage);


    await pool.query(
      'INSERT INTO messages (sender, text, user_id) VALUES ($1, $2, $3)',
      ['user', userMessage, userId]
    );


    await pool.query(
      'INSERT INTO messages (sender, text, user_id) VALUES ($1, $2, $3)',
      ['bot', botResponse, userId]
    );


res.json({ reply: botResponse.reply, source: botResponse.source });


  } catch (error) {
    console.error('Erreur dans /api/chat :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});


app.get('/api/messages', authenticateToken, async (req, res) => {
  console.log('Utilisateur connectÃ©:', req.user);
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  try {
    let result;
let totalMessages;
    if (user.role === 'admin') {
  result = await pool.query(`
    SELECT m.id, m.sender, m.text, m.created_at, u.username, m.user_id, u.agent_id
    FROM messages m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  console.log("Messages admin:", result.rows);




    } else if (user.role === 'client') {
         totalMessages = await pool.query('SELECT COUNT(*) FROM messages WHERE user_id = $1', [user.id]);

      result = await pool.query(`
        SELECT m.id, m.sender, m.text, m.created_at, u.username, m.user_id
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.user_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `, [user.id, limit, offset]);

    } else if (user.role === 'agent') {
  const resultClients = await pool.query(
    'SELECT id FROM users WHERE role = $1 AND agent_id = $2',
    ['client', user.id]
  );
  const clientIds = resultClients.rows.map(row => row.id);
  console.log("ðŸ“‹ Clients de l'agent :", clientIds);
  if (clientIds.length === 0) return res.json({ messages: [], hasMore: false });
result = await pool.query(`
  SELECT m.id, m.sender, m.text, m.created_at, u.username, m.user_id
  FROM messages m
  JOIN users u ON m.user_id = u.id
  WHERE m.user_id = ANY($1::int[])
  ORDER BY m.created_at DESC
`, [clientIds]);

console.log("ðŸ“© Messages renvoyÃ©s Ã  lâ€™agent :", result.rows); // ðŸ‘ˆ ajoute ceci aussi

}

 else {
      return res.status(403).json({ error: 'RÃ´le non reconnu' });
    }

    res.json({
      messages: result.rows,
      hasMore: result.rows.length === limit
    });
  } catch (err) {
    console.error('Erreur dans /api/messages :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`âœ… Backend dÃ©marrÃ© sur http://localhost:${PORT}`);
});
app.get('/api/agent/clients', authenticateToken, isAgent, async (req, res) => {
  const agentId = req.user.id;
  const result = await pool.query(
    `SELECT id, username FROM users WHERE agent_id = $1 AND 'client' = ANY(roles)`,
    [agentId]
  );
  res.json({ clients: result.rows });
});

app.get('/api/messages/client/:id', authenticateToken, isAgent, async (req, res) => {
  const clientId = parseInt(req.params.id);
  const start = req.query.start;
  const end = req.query.end;

  console.log("ðŸ” Agent", req.user.id, "demande historique du client", clientId, "entre", start, "et", end);

  try {
    if (!start || !end) {
      return res.status(400).json({ error: "Dates start et end requises" });
    }

    const result = await pool.query(`
      SELECT m.id, m.sender, m.text, m.created_at, u.username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $1
      AND m.created_at::date BETWEEN $2 AND $3
      ORDER BY m.created_at DESC
    `, [clientId, start, end]);

    res.json({ messages: result.rows });

  } catch (err) {
    console.error("âŒ ERREUR historique client :", err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration de lâ€™historique' });
  }
});



//intentions
function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'AccÃ¨s rÃ©servÃ© aux administrateurs' });
}
app.get('/api/intentions', authenticateToken, isAdmin, async (req, res) => {
  const result = await pool.query('SELECT * FROM intentions_RAG ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/intentions', authenticateToken, isAdmin, async (req, res) => {
  const { keyword, response,link } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO intentions_RAG (keyword, response,link) VALUES ($1, $2,$3) RETURNING *',
      [keyword, response,link]
    );

    const ligne = `Q: ${keyword}\nR: ${response}\n\n`;
    fs.appendFile('docs/faq_assurance.txt', ligne, (err) => {
      if (err) console.error('Erreur ajout fichier :', err);
      else console.log('âœ… Intention ajoutÃ©e au fichier RAG.');
    });

    console.log("ðŸ”¥ Intention ajoutÃ©e :", result.rows[0]);
    res.status(201).json(result.rows[0]); // ðŸŸ¢ Renvoie bien la ligne insÃ©rÃ©e
  } catch (err) {
    console.error('âŒ Erreur ajout intention :', err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout' });
  }
});



app.delete('/api/intentions/:id', authenticateToken, isAdmin, async (req, res) => {
  await pool.query('DELETE FROM intentions_RAG WHERE id = $1', [req.params.id]);
  res.json({ message: 'Intention supprimÃ©e' });
});

app.put('/api/intentions/:id', authenticateToken, isAdmin, async (req, res) => {
  const { keyword, response,link } = req.body;
  await pool.query(
  'UPDATE intentions_RAG SET keyword = $1, response = $2, link=$3 WHERE id = $4',
  [keyword, response, link, req.params.id]
);

  res.json({ message: 'Intention mise Ã  jour' });
});
app.get('/api/sensibles', authenticateToken, isAdmin, async (req, res) => {
  const result = await pool.query('SELECT * FROM sensitive_words ORDER BY id DESC');
  res.json(result.rows);
});


app.post('/api/sensibles', authenticateToken, isAdmin, async (req, res) => {
  const { word } = req.body;

  await pool.query('INSERT INTO sensitive_words (word) VALUES ($1)', [word]);

  res.status(201).json({ message: 'Mot sensible ajoutÃ©' });
});
app.put('/api/sensibles/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { word } = req.body;

  try {
    const result = await pool.query(
      'UPDATE sensitive_words SET word = $1 WHERE id = $2',
      [word, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Mot non trouvÃ©' });
    }

    res.json({ message: 'Mot modifiÃ© avec succÃ¨s' });
  } catch (err) {
    console.error('Erreur lors de la modification du mot:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }

});
app.delete('/api/sensibles/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM sensitive_words WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Mot non trouvÃ©' });
    }

    res.json({ message: 'Mot supprimÃ© avec succÃ¨s' });
  } catch (err) {
    console.error('Erreur lors de la suppression du mot:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


app.get('/api/agent/stats', authenticateToken, isAgent, async (req, res) => {
  const periode = req.query.periode || 'jour';

  let dateCondition = '';
  if (periode === 'jour') {
    dateCondition = "AND created_at >= CURRENT_DATE";
  } else if (periode === 'semaine') {
    dateCondition = "AND created_at >= date_trunc('week', CURRENT_DATE)";
  } else if (periode === 'mois') {
    dateCondition = "AND created_at >= date_trunc('month', CURRENT_DATE)";
  }

  try {
    // âœ… Active la locale franÃ§aise pour la session PostgreSQL
    await pool.query("SET lc_time = 'fr_FR.UTF-8'");

    // ðŸ” Clients de lâ€™agent
    const clientsResult = await pool.query(`
      SELECT id, username FROM users WHERE agent_id = $1
    `, [req.user.id]);
    const clientIds = clientsResult.rows.map(c => c.id);
    console.log("ðŸŸ¢ Clients liÃ©s :", clientIds);

    // ðŸ” Top questions posÃ©es (clients uniquement)
   // ðŸ” Mots sensibles dÃ©tectÃ©s dans les questions des clients de l'agent
// ðŸ” Mots sensibles dÃ©tectÃ©s dans les questions des clients de l'agent
let motsSensiblesDetectes = [];
if (clientIds.length > 0) {
  // RÃ©cupÃ©rer la liste des mots sensibles existants
  const motsSensiblesDB = await pool.query('SELECT word FROM sensitive_words');
  const mots = motsSensiblesDB.rows.map(r => r.word.toLowerCase());

  // VÃ©rifier leur prÃ©sence dans les messages des clients
  const messagesClients = await pool.query(`
    SELECT text
    FROM messages
    WHERE sender = 'user'
    AND user_id = ANY($1::int[])
    ${dateCondition}
  `, [clientIds]);

  // Grouper et compter les mots sensibles dÃ©tectÃ©s
  const motsCountMap = new Map();

  messagesClients.rows.forEach(msg => {
    mots.forEach(mot => {
      if (msg.text.toLowerCase().includes(mot)) {
        if (motsCountMap.has(mot)) {
          motsCountMap.set(mot, motsCountMap.get(mot) + 1);
        } else {
          motsCountMap.set(mot, 1);
        }
      }
    });
  });

  // Convertir en tableau [{ word, count }]
  motsSensiblesDetectes = Array.from(motsCountMap.entries()).map(([word, count]) => ({ word, count }));
}

console.log("ðŸŸ¢ Mots sensibles dÃ©tectÃ©s :", motsSensiblesDetectes);


      topQuestionsResult = await pool.query(`
        SELECT text, COUNT(*) as count
        FROM messages
        WHERE sender = 'user'
        AND user_id = ANY($1::int[])
        ${dateCondition}
        GROUP BY text
        ORDER BY count DESC
        LIMIT 5
      `, [clientIds]);

    console.log("ðŸŸ¢ Top questions :", topQuestionsResult.rows);

    // ðŸ” Mots sensibles
    const motsSensiblesResult = await pool.query(`
      SELECT word, created_at
      FROM sensitive_words
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // ðŸ” Evolution des questions (clients uniquement)
    let questionsByDay = { labels: [], data: [] };
    if (clientIds.length > 0) {
      let format;

      if (periode === 'jour') {
        format = 'HH24h'; // Heure pour aujourd'hui
      } else if (periode === 'semaine') {
        format = 'TMDay'; // Jour complet en franÃ§ais abrÃ©gÃ©
      } else if (periode === 'mois') {
        format = 'DD TMMonth'; // Date et mois abrÃ©gÃ©
      }

      const questionsByDayResult = await pool.query(`
        SELECT to_char(created_at, '${format}') as label, COUNT(*) as count
        FROM messages
        WHERE sender = 'user'
        AND user_id = ANY($1::int[])
        ${dateCondition}
        GROUP BY label
        ORDER BY MIN(created_at)
      `, [clientIds]);

      questionsByDay.labels = questionsByDayResult.rows.map(r => r.label.trim());
      questionsByDay.data = questionsByDayResult.rows.map(r => Number(r.count));
    }

    res.json({
      clientsCount: clientsResult.rowCount,
      topQuestions: topQuestionsResult.rows,
      motsSensibles: motsSensiblesDetectes,
      clients: clientsResult.rows,
      questionsByDay: questionsByDay
    });

  } catch (err) {
    console.error("âŒ ERREUR stats agent :", err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration des stats' });
  }
});
app.get('/api/messages/me', authenticateToken, async (req, res) => {
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit * 2;

  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let dateCondition = '';
  if (startDate && endDate) {
    dateCondition = `AND m.created_at BETWEEN '${startDate}' AND '${endDate} 23:59:59'`;
  } else if (startDate) {
    dateCondition = `AND m.created_at::date = '${startDate}'`;
  }

  try {
    const result = await pool.query(`
      SELECT m.id, m.sender, m.text, m.created_at, u.username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $1
      ${dateCondition}
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [user.id, limit * 2, offset]);

    const rows = result.rows;
    const pairs = [];
    let currentBot = null;

    for (let msg of rows) {
      if (msg.sender === 'bot') {
        if (currentBot) {
          pairs.push({ user: { text: '' }, bot: currentBot });
        }
        currentBot = msg;
      } else if (msg.sender === 'user') {
        if (currentBot) {
          pairs.push({ user: msg, bot: currentBot });
          currentBot = null;
        } else {
          pairs.push({ user: msg, bot: { text: '' } });
        }
      }
    }

    if (currentBot) {
      pairs.push({ user: { text: '' }, bot: currentBot });
    }
const totalResult = await pool.query('SELECT COUNT(*) FROM messages WHERE user_id = $1', [user.id]);
const totalMessages = parseInt(totalResult.rows[0].count);
const totalPages = Math.ceil(totalMessages / (limit * 2));

    res.json({ pairs, hasMore: rows.length === limit * 2, totalPages });


  } catch (err) {
    console.error("âŒ ERREUR historique client :", err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration de lâ€™historique' });
  }
});

app.get('/api/messages/historyByDate', authenticateToken, async (req, res) => {
  const date = req.query.date;
  const userId = req.user.id;

  const result = await pool.query(`
    SELECT * FROM messages
    WHERE user_id = $1 AND DATE(created_at) = $2
    ORDER BY created_at DESC
  `, [userId, date]);

  res.json({ pairs: result.rows });
});

app.get('/api/messages/historyByRange', authenticateToken, async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user.id;

  console.log("ðŸ” Filtre dates :", start, end);

  try {
    const result = await pool.query(`
      SELECT *
      FROM messages
      WHERE user_id = $1
      AND DATE(created_at) BETWEEN $2 AND $3
      ORDER BY created_at DESC
    `, [userId, start, end]);

    res.json({ pairs: result.rows });
  } catch (err) {
    console.error("âŒ ERREUR filtre date :", err);
    res.status(500).json({ error: "Erreur lors du filtrage par date" });
  }
});
app.get('/api/messages/me/all', authenticateToken, async (req, res) => {
  const user = req.user;
  const result = await pool.query(`
    SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at DESC
  `, [user.id]);

  res.json({ messages: result.rows });
});



app.get('/api/admin/agents', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT id, username FROM users WHERE 'agent' = ANY(roles)
`);

    res.json(result.rows);
  } catch (err) {
    console.error('Erreur rÃ©cupÃ©ration agents:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.get('/api/admin/clients', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT id, username FROM users WHERE 'client' = ANY(roles)
`);

    res.json(result.rows);
  } catch (err) {
    console.error('Erreur rÃ©cupÃ©ration clients:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.get('/api/admin/clients/by-agent/:agentId', authenticateToken, isAdmin, async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  try {
    const result = await pool.query(
  `SELECT id, username FROM users WHERE agent_id = $1 AND 'client' = ANY(roles)`,
  [agentId]
);

    res.json(result.rows);
  } catch (err) {
    console.error('Erreur rÃ©cupÃ©ration clients par agent:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.get('/api/messages/filter', authenticateToken, async (req, res) => {
  const { agentId, clientId, startDate, endDate } = req.query;

  try {
    const result = await pool.query(`
      SELECT m.id, m.sender, m.text, m.created_at, u.username, u.agent_id
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE ($1::int IS NULL OR u.agent_id = $1)
      AND ($2::int IS NULL OR m.user_id = $2)
      AND ($3::date IS NULL OR m.created_at >= $3)
      AND ($4::date IS NULL OR m.created_at <= $4)
      ORDER BY m.created_at DESC
    `, [agentId || null, clientId || null, startDate || null, endDate || null]);

    res.json({ messages: result.rows });

  } catch (err) {
    console.error('Erreur filtre messages:', err);
    res.status(500).json({ error: 'Erreur filtre messages' });
  }
});
app.get('/api/agent/history/:id', authenticateToken, isAgent, async (req, res) => {
  const clientId = parseInt(req.params.id);

  try {
    const result = await pool.query(`
      SELECT m.id, m.sender, m.text, m.created_at, u.username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `, [clientId]);

    res.json({ messages: result.rows });
  } catch (err) {
    console.error("âŒ ERREUR historique client :", err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration de lâ€™historique' });
  }
});
