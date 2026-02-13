require('dotenv').config();

const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const publicDir = path.join(__dirname, 'public');

const PORT = Number(process.env.PORT) || 3000;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

app.use(express.static(publicDir));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.get('/', (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/conductores', async (req, res) => {
  try {
    const result = await pool.query('SELECT nombre, edad FROM conductores ORDER BY nombre;');
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar conductores.' });
  }
});

async function getAutomoviles(req, res) {
  try {
    const result = await pool.query('SELECT marca, patente, nombre_conductor FROM automoviles ORDER BY patente;');
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar automoviles.' });
  }
}

app.get(['/automóviles', '/autom%C3%B3viles'], getAutomoviles);

app.get('/conductoressinauto', async (req, res) => {
  const edad = Number(req.query.edad);

  if (!Number.isFinite(edad)) {
    return res.status(400).json({ error: 'Debe enviar el query param edad como numero.' });
  }

  try {
    const query = `
      SELECT c.nombre, c.edad
      FROM conductores c
      LEFT JOIN automoviles a ON a.nombre_conductor = c.nombre
      WHERE c.edad < $1 AND a.nombre_conductor IS NULL
      ORDER BY c.edad, c.nombre;
    `;

    const result = await pool.query(query, [edad]);
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar conductores sin auto por edad.' });
  }
});

app.get('/solitos', async (req, res) => {
  try {
    const conductoresQuery = `
      SELECT c.nombre, c.edad
      FROM conductores c
      LEFT JOIN automoviles a ON a.nombre_conductor = c.nombre
      WHERE a.nombre_conductor IS NULL
      ORDER BY c.nombre;
    `;

    const automovilesQuery = `
      SELECT a.marca, a.patente, a.nombre_conductor
      FROM automoviles a
      LEFT JOIN conductores c ON c.nombre = a.nombre_conductor
      WHERE c.nombre IS NULL
      ORDER BY a.patente;
    `;

    const [conductoresResult, automovilesResult] = await Promise.all([
      pool.query(conductoresQuery),
      pool.query(automovilesQuery)
    ]);

    return res.status(200).json({
      conductoresSinAutomovil: conductoresResult.rows,
      automovilesSinConductor: automovilesResult.rows
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar solitos.' });
  }
});

app.get('/auto', async (req, res) => {
  const { patente, iniciopatente } = req.query;

  if (!patente && !iniciopatente) {
    return res.status(400).json({ error: 'Debe enviar patente o iniciopatente.' });
  }

  if (patente) {
    try {
      const query = `
        SELECT a.marca, a.patente, a.nombre_conductor, c.edad AS edad_conductor
        FROM automoviles a
        LEFT JOIN conductores c ON c.nombre = a.nombre_conductor
        WHERE a.patente = $1;
      `;

      const result = await pool.query(query, [patente]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No existe automovil con esa patente.' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Error al consultar automovil por patente.' });
    }
  }

  try {
    const query = `
      SELECT a.marca, a.patente, a.nombre_conductor, c.edad AS edad_conductor
      FROM automoviles a
      LEFT JOIN conductores c ON c.nombre = a.nombre_conductor
      WHERE a.patente ILIKE $1
      ORDER BY a.patente;
    `;

    const result = await pool.query(query, [`${iniciopatente}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay automoviles que coincidan con ese inicio de patente.' });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar automoviles por inicio de patente.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
