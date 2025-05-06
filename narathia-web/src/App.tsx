import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Game {
  id: number;
  nombre: string;
  ultima_modificacion: string;
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

// Función para formatear el texto con HTML básico
const formatText = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita
    .replace(/\n/g, '<br />') // Saltos de línea
    .replace(/<hr>/g, '<hr />') // Líneas horizontales
    .replace(/<h3>(.*?)<\/h3>/g, '<h3 style="margin: 1em 0 0.5em 0;">$1</h3>') // Encabezados
    .replace(/<ol>([\s\S]*?)<\/ol>/g, (match, content) => {
      // Listas numeradas
      const items = content.split(/<li>/).filter(Boolean);
      return `<ol style="margin: 0.5em 0; padding-left: 2em;">${items.map((item: string) => 
        `<li style="margin: 0.5em 0;">${item.replace('</li>', '')}</li>`
      ).join('')}</ol>`;
    });
};

// Función para formatear la respuesta de n8n
const formatResponse = (data: any): string => {
  try {
    if (Array.isArray(data) && data[0]?.output) {
      return data[0].output;
    }
    if (data?.output) {
      return data.output;
    }
    if (typeof data === 'string') {
      return data;
    }
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error formateando respuesta:', error);
    return 'Error al procesar la respuesta';
  }
};

// Función para validar email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const API_URL = 'http://localhost:5000';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [gameName, setGameName] = useState('');

  // Cargar partidas al iniciar sesión
  useEffect(() => {
    if (currentUser) {
      loadGames();
    }
  }, [currentUser]);

  const loadGames = async () => {
    try {
      const response = await axios.get(`${API_URL}/games`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGames(response.data);
    } catch (error) {
      console.error('Error al cargar partidas:', error);
    }
  };

  const saveGame = async () => {
    try {
      console.log('Intentando guardar partida...');
      console.log('Token:', localStorage.getItem('token'));
      console.log('GameName:', gameName);
      console.log('Messages:', messages);

      const gameState = {
        messages,
        timestamp: new Date()
      };

      const response = await axios.post(
        `${API_URL}/save-game`,
        { gameState, gameName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      console.log('Respuesta del servidor:', response.data);

      setShowSaveDialog(false);
      setGameName('');
      loadGames();
    } catch (error: any) {
      console.error('Error al guardar partida:', error);
      console.error('Detalles del error:', error.response?.data);
      setError(error.response?.data?.error || 'Error al guardar la partida');
    }
  };

  const loadGame = async (gameId: number) => {
    try {
      console.log('Intentando cargar partida:', gameId);
      const response = await axios.get(`${API_URL}/game/${gameId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.gameState && response.data.gameState.messages) {
        const messagesWithDates = response.data.gameState.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(messagesWithDates);
      } else {
        setError('No se encontraron mensajes en la partida');
      }
    } catch (error: any) {
      console.error('Error al cargar partida:', error);
      setError(error.response?.data?.error || 'Error al cargar la partida');
    }
  };

  const deleteGame = async (gameId: number) => {
    try {
      await axios.delete(`${API_URL}/game/${gameId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      loadGames();
    } catch (error) {
      console.error('Error al eliminar partida:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLogin = async () => {
    try {
      setError(null);
      if (!loginData.email || !loginData.password) {
        setError('Por favor ingresa email y contraseña');
        return;
      }

      const response = await axios.post(`${API_URL}/login`, {
        correo: loginData.email,
        contrasena: loginData.password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setCurrentUser({
          id: response.data.id,
          username: response.data.nombre,
          email: response.data.correo
        });
        setTabValue(0);
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      if (!registerData.username || !registerData.email || !registerData.password) {
        setError('Por favor completa todos los campos');
        return;
      }

      // Añadir validación de email
      if (!isValidEmail(registerData.email)) {
        setError('Por favor ingresa un email válido');
        return;
      }

      const response = await axios.post(`${API_URL}/register`, {
        nombre: registerData.username,
        correo: registerData.email,
        contrasena: registerData.password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setCurrentUser({
          id: response.data.id,
          username: response.data.nombre,
          email: response.data.correo
        });
        setTabValue(0);
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      setError(error.response?.data?.error || 'Error al registrar usuario');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setTabValue(1);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentUser) return;

    const userMessage: Message = {
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('https://boni443.app.n8n.cloud/webhook/chat', {
        message: input,
        userId: currentUser.id
      });
      
      const formattedResponse = formatResponse(response.data);

      const aiMessage: Message = {
        text: formattedResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage: Message = {
        text: 'Error al procesar la respuesta. Por favor, intenta de nuevo.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar nuevo chat
  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
  };

  if (!currentUser) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Iniciar Sesión" />
              <Tab label="Registrarse" />
            </Tabs>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {tabValue === 0 && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLogin}
                >
                  Iniciar Sesión
                </Button>
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre de usuario"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleRegister}
                >
                  Registrarse
                </Button>
              </Box>
            )}
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(30,30,44,0.95) 50%, rgba(63,81,181,0.2) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Imagen izquierda con overlay */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '45%',
            height: '100%',
            backgroundImage: 'url(/images/left-image.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
            display: { xs: 'none', md: 'block' },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(30,30,44,0.95) 100%)'
            }
          }}
        />
        
        {/* Contenido principal */}
        <Container 
          maxWidth="lg" 
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            py: 4,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1,
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: 'rgba(30,30,44,0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255,255,255,0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(63,81,181,0.1) 100%)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #ffd700 0%, #90caf9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Narathia
                </Typography>
                <img 
                  src="/images/logo.png" 
                  alt="Narathia Logo" 
                  style={{ 
                    height: '40px',
                    width: 'auto',
                    filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.5))'
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={startNewChat}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Nuevo Chat
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowSaveDialog(true)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Guardar Partida
                </Button>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500
                }}>
                  {currentUser.username}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleLogout}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Cerrar Sesión
                </Button>
              </Box>
            </Box>
            
            {/* Lista de partidas guardadas */}
            {games.length > 0 && (
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
                  Partidas Guardadas
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {games.map((game) => (
                    <Paper
                      key={game.id}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.08)'
                        }
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                          {game.nombre}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {new Date(game.ultima_modificacion).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => loadGame(game.id)}
                          sx={{
                            borderColor: 'rgba(144,202,249,0.5)',
                            color: 'rgba(144,202,249,0.9)',
                            '&:hover': {
                              borderColor: 'rgba(144,202,249,0.7)',
                              backgroundColor: 'rgba(144,202,249,0.1)'
                            }
                          }}
                        >
                          Cargar
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => deleteGame(game.id)}
                          sx={{
                            borderColor: 'rgba(255,0,0,0.5)',
                            color: 'rgba(255,0,0,0.9)',
                            '&:hover': {
                              borderColor: 'rgba(255,0,0,0.7)',
                              backgroundColor: 'rgba(255,0,0,0.1)'
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.sender === 'user' 
                        ? 'rgba(144,202,249,0.2)' 
                        : 'rgba(30,30,44,0.6)',
                      borderRadius: 2,
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {message.sender === 'ai' ? (
                      <div dangerouslySetInnerHTML={{ __html: formatText(message.text) }} />
                    ) : (
                      <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        {message.text}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    El agente está escribiendo...
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Escribe tu mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)'
                      },
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(144,202,249,0.5)'
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  sx={{
                    background: 'linear-gradient(45deg, #ffd700 30%, #90caf9 90%)',
                    color: '#000',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #ffd700 10%, #90caf9 70%)',
                    },
                    '&:disabled': {
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  Enviar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>

        {/* Imagen derecha con overlay */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '45%',
            height: '100%',
            backgroundImage: 'url(/images/right-image.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
            display: { xs: 'none', md: 'block' },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(-90deg, transparent 0%, rgba(30,30,44,0.95) 100%)'
            }
          }}
        />
      </Box>

      {/* Diálogo para guardar partida */}
      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30,30,44,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Guardar Partida
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la partida"
            fullWidth
            value={gameName}
            onChange={(e) => {
              setGameName(e.target.value);
              setError(null);
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'rgba(255,255,255,0.9)',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.1)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,255,255,0.2)'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.7)'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowSaveDialog(false);
              setError(null);
            }}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => saveGame()}
            disabled={!gameName.trim()}
            sx={{
              background: 'linear-gradient(45deg, #ffd700 30%, #90caf9 90%)',
              color: '#000',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(45deg, #ffd700 10%, #90caf9 70%)'
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
