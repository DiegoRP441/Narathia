# Narathia – Juego de Rol por Chat con IA

**Narathia** es una plataforma de **rol narrativo por chat** que permite a los usuarios crear personajes y vivir aventuras personalizadas en mundos de ficción, todo orquestado por un **game master inteligente** impulsado por inteligencia artificial.

La experiencia se ejecuta a través de una web interactiva, con un backend que gestiona personajes, partidas y eventos narrativos de forma dinámica. El sistema integra flujos de trabajo automáticos mediante **n8n en la nube**, que permite coordinar la IA, el motor de juego y la base de datos sin intervención manual.

---

## ¿Qué hace especial a Narathia?

-  **Game master con IA**: Genera y adapta la narrativa en tiempo real en función de las acciones del jugador.
-  **Sistema de combate con dados**: Resolución de enfrentamientos y eventos mediante tiradas simuladas.
-  **Mundos de ficción vivos**: Las tramas y escenarios evolucionan dinámicamente.
-  **Gestión de personajes**: Creación, atributos y evolución del personaje guardados en base de datos.
-  **Autenticación segura**: Sistema de usuarios basado en JWT.
-  **Automatización con n8n**: Automatiza tareas complejas del agente narrativo (gestión de eventos, acciones, respuestas, etc).
-  **Frontend accesible**: Interfaz moderna y funcional hecha en React.
- **Persistencia y carga de partidas**: Guarda el estado de la partida y permite retomarla.

---

##  Tecnologías Utilizadas

| Área | Tecnología |
|------|------------|
| **Frontend** | React, Material-UI |
| **Backend** | Node.js, Express |
| **Base de datos** | PostgreSQL |
| **Autenticación** | JWT |
| **IA & Automatización** | n8n (en la nube) |
| **Túnel local** | ngrok |

---

##  Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

1. [Node.js](https://nodejs.org/) (versión 18 o superior)
2. [ngrok](https://ngrok.com/) (para exponer el servidor local)

---

##  Configuración del Entorno

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/narathia.git
cd narathia

# 2. Instala las dependencias del frontend
cd narathia-web
npm install

# 3. Instala las dependencias del backend
cd ../backend
npm install

```

## Ejecución del proyecto
```bash 
# Inicia el backend
cd backend
npm start
# En otra terminal, inicia el frontend
cd narathia-web
npm start
# Inicia ngrok para exponer el backend (puerto 5000)
ngrok http 5000
```

## Estructura del proyecto
```bash 
narathia/
├── backend/          → Servidor Express + lógica del juego
│   ├── server.js     → Punto de entrada del backend
│   └── schema.sql    → Esquema de la base de datos PostgreSQL
└── narathia-web/     → Interfaz en React para jugadores
```

## Demostración

Si experimentas algún error inesperado durante la instalación o el uso, puedes consultar el  **video de demostración** donde se muestra el funcionamiento completo del sistema.

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.
