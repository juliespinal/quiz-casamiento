const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Nuestra "Base de datos" en la memoria RAM
let estadoJuego = {
  fase: 'lobby', 
  jugadores: [] // Acá vamos a meter a los que pongan "Estoy listo"
};

io.on('connection', (socket) => {
  console.log('🟢 Conexión entrante. ID:', socket.id);

  // 1. Cuando un nuevo cliente (como el Hall) se conecta, puede pedir la lista actual
  socket.on('pedir_jugadores', () => {
    socket.emit('actualizar_jugadores', estadoJuego.jugadores);
  });

  socket.on('jugador_listo', (datos) => {
    const nuevoJugador = {
      id: socket.id,
      nombre: datos.nombre,
      apellido: datos.apellido,
      puntos: 0
    };
    
    estadoJuego.jugadores.push(nuevoJugador);
    console.log(`👤 Se unió: ${nuevoJugador.nombre} ${nuevoJugador.apellido}`);
    
    // 2. Le avisamos A TODOS que la lista cambió
    io.emit('actualizar_jugadores', estadoJuego.jugadores);
  });

  socket.on('iniciar_juego', () => {
    estadoJuego.fase = 'jugando';
    console.log('🎮 ¡El administrador inició el juego!');
    
    // Le gritamos a todos los conectados que la fase cambió
    io.emit('cambio_fase', estadoJuego.fase);
  });

  socket.on('disconnect', () => {
    const jugadorQueSeFue = estadoJuego.jugadores.find(j => j.id === socket.id);
    if (jugadorQueSeFue) {
      console.log(`🔴 Se desconectó: ${jugadorQueSeFue.nombre} ${jugadorQueSeFue.apellido}`);
    }
    
    estadoJuego.jugadores = estadoJuego.jugadores.filter(j => j.id !== socket.id);
    
    // 3. Si alguien se fue, también le avisamos A TODOS para sacarlo de la pantalla
    io.emit('actualizar_jugadores', estadoJuego.jugadores);
  });
});

const PORT = 3300;
server.listen(PORT, () => {
  console.log(`🚀 Servidor central corriendo en http://localhost:${PORT}`);
});