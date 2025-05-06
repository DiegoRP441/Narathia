require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Verificar variables de entorno
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL no está definida en .env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET no está definida en .env');
  process.exit(1);
}

// Conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conexión a la base de datos establecida');
  release();
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Registro
app.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    // Validaciones
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el email ya existe
    const userCheck = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo.toLowerCase()]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar usuario
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING id, nombre, correo',
      [nombre.trim(), correo.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.json({
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(contrasena, user.contrasena);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Generar token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.json({
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta protegida de ejemplo
app.get('/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, correo FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});

// Guardar partida
app.post('/save-game', authenticateToken, async (req, res) => {
  try {
    console.log('Recibida petición de guardar partida');
    console.log('Usuario:', req.user);
    console.log('Datos recibidos:', req.body);

    const { gameState, gameName } = req.body;
    
    if (!gameState || !gameName) {
      console.log('Faltan datos requeridos:', { gameState, gameName });
      return res.status(400).json({ error: 'Estado del juego y nombre son requeridos' });
    }

    console.log('Intentando guardar en la base de datos...');
    const result = await pool.query(
      'INSERT INTO partidas (usuario_id, nombre, estado, ultima_modificacion) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [req.user.id, gameName, JSON.stringify(gameState)]
    );

    console.log('Partida guardada exitosamente:', result.rows[0]);
    res.json({ 
      success: true, 
      gameId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Error detallado al guardar partida:', error);
    if (error.code === '23503') { // Error de clave foránea
      res.status(400).json({ error: 'Usuario no encontrado' });
    } else if (error.code === '23505') { // Error de duplicado
      res.status(400).json({ error: 'Ya existe una partida con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error al guardar la partida: ' + error.message });
    }
  }
});

// Ruta para sobrescribir una partida existente
app.post('/save-game/:id', authenticateToken, async (req, res) => {
  try {
    const { gameState, gameName } = req.body;
    const gameId = req.params.id;
    
    // Verificar que la partida existe y pertenece al usuario
    const gameCheck = await pool.query(
      'SELECT * FROM partidas WHERE id = $1 AND usuario_id = $2',
      [gameId, req.user.id]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    // Actualizar la partida existente
    await pool.query(
      'UPDATE partidas SET estado = $1, ultima_modificacion = NOW() WHERE id = $2',
      [JSON.stringify(gameState), gameId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error al sobrescribir partida:', error);
    res.status(500).json({ error: 'Error al sobrescribir la partida' });
  }
});

// Cargar partidas del usuario
app.get('/games', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, ultima_modificacion FROM partidas WHERE usuario_id = $1 ORDER BY ultima_modificacion DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al cargar partidas:', error);
    res.status(500).json({ error: 'Error al cargar las partidas' });
  }
});

// Cargar una partida específica
app.get('/game/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Recibida petición de cargar partida:', req.params.id);
    console.log('Usuario:', req.user);

    const result = await pool.query(
      'SELECT estado FROM partidas WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      console.log('Partida no encontrada');
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    console.log('Partida encontrada:', result.rows[0]);
    const gameState = result.rows[0].estado;
    console.log('Estado del juego:', gameState);

    res.json({ 
      gameState: gameState
    });
  } catch (error) {
    console.error('Error detallado al cargar partida:', error);
    res.status(500).json({ error: 'Error al cargar la partida: ' + error.message });
  }
});

// Eliminar partida
app.delete('/game/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM partidas WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar partida:', error);
    res.status(500).json({ error: 'Error al eliminar la partida' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 