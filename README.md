# Narathia - Juego de Rol por Chat

Narathia es un juego de rol basado en chat que permite a los usuarios crear personajes y vivir aventuras en diferentes mundos de ficción.

## Requisitos Previos

Antes de comenzar, necesitarás instalar:

1. [Node.js](https://nodejs.org/) (versión 18 o superior)
2. [ngrok](https://ngrok.com/) (para exponer el servidor localmente)

## Configuración del Entorno

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/narathia.git
cd narathia
```

2. Instala las dependencias del frontend:
```bash
cd narathia-web
npm install
```

3. Instala las dependencias del backend:
```bash
cd ../backend
npm install
```

## Ejecución del Proyecto

1. Inicia el backend:
```bash
cd backend
npm start
```

2. En otra terminal, inicia el frontend:
```bash
cd narathia-web
npm start
```

3. Inicia ngrok (Deberia ser automatico, pero por si acaso):
```bash
ngrok http 5000
```

## Estructura del Proyecto

- `narathia-web/`: Frontend en React
- `backend/`: Servidor Node.js
  - `server.js`: Punto de entrada del servidor
  - `schema.sql`: Esquema de la base de datos

## Características

- Sistema de autenticación de usuarios
- Creación y gestión de personajes
- Guardado y carga de partidas
- Sistema de combate basado en dados
- Mundos de ficción dinámicos

## Tecnologías Utilizadas

- Frontend: React, Material-UI
- Backend: Node.js, Express
- Base de datos: PostgreSQL
- Autenticación: JWT
- Túnel: ngrok


## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
