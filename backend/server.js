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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 