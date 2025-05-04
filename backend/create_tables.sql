-- Crear tabla de partidas
CREATE TABLE IF NOT EXISTS partidas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    estado JSONB NOT NULL,
    ultima_modificacion TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
); 