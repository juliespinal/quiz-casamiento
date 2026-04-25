const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const preguntas = require('./preguntas');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Actualizamos nuestra memoria
let estadoJuego = {
  fase: 'lobby',
  jugadores: [],
  preguntaActualIndex: 0,
  tiempoRestante: 10, // Segundos por pregunta
  intervaloReloj: null // Acá guardaremos el motor del reloj
};

function iniciarReloj() {
  clearInterval(estadoJuego.intervaloReloj);
  estadoJuego.tiempoRestante = 10;

  const preguntaActual = preguntas[estadoJuego.preguntaActualIndex];

  // 1. Mandamos la pregunta
  io.emit('nueva_pregunta', {
    pregunta: preguntaActual.pregunta,
    opciones: preguntaActual.opciones,
    tiempo: estadoJuego.tiempoRestante
  });

  estadoJuego.intervaloReloj = setInterval(() => {
    estadoJuego.tiempoRestante--;
    io.emit('tic_tac', estadoJuego.tiempoRestante);

    if (estadoJuego.tiempoRestante <= 0) {
      clearInterval(estadoJuego.intervaloReloj);

      // 2. ¡TIEMPO FUERA! Avisamos a todos cuál era la correcta
      io.emit('mostrar_resultado', preguntaActual.respuestaCorrecta);
      io.emit('actualizar_jugadores', estadoJuego.jugadores);
      console.log(`📢 Fin de pregunta. La correcta era: ${preguntaActual.respuestaCorrecta}`);

      // 3. Pausa de 4 segundos para que los invitados vean si acertaron
      setTimeout(() => {
        estadoJuego.preguntaActualIndex++;

        if (estadoJuego.preguntaActualIndex < preguntas.length) {
          iniciarReloj(); // Siguiente pregunta
        } else {
          estadoJuego.fase = 'finalizado';
          io.emit('cambio_fase', 'finalizado');
          console.log('🏁 Juego Terminado');
        }
      }, 4000);
    }
  }, 1000);
}

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

  socket.on('enviar_respuesta', (indiceElegido) => {
    // 1. Buscamos al jugador por su ID de socket
    const jugador = estadoJuego.jugadores.find(j => j.id === socket.id);
    const preguntaActual = preguntas[estadoJuego.preguntaActualIndex];

    console.log(`📩 Respuesta recibida de ${jugador ? jugador.nombre : 'Desconocido'}: opción ${indiceElegido}`);

    if (jugador && preguntaActual) {
      // 2. Verificamos si es correcta (OJO: usamos == por si uno es string y otro número)
      if (indiceElegido == preguntaActual.respuestaCorrecta) {
        jugador.puntos += 113;
        console.log(`✅ ¡CORRECTO! ${jugador.nombre} ahora tiene ${jugador.puntos} puntos.`);
      } else {
        console.log(`❌ INCORRECTO para ${jugador.nombre}. La correcta era ${preguntaActual.respuestaCorrecta}`);
      }

      // 3. ¡ESTA LÍNEA ES VITAL! Avisamos a todos (especialmente al Hall) que cambian los puntos
      //io.emit('actualizar_jugadores', estadoJuego.jugadores);
    } else {
      console.log("⚠️ No se pudo procesar la respuesta: jugador o pregunta no encontrados.");
    }
  });

  socket.on('iniciar_juego', () => {
    estadoJuego.fase = 'jugando';
    estadoJuego.preguntaActualIndex = 0; // Nos aseguramos de arrancar en la 1
    console.log('🎮 ¡El administrador inició el juego!');



    io.emit('cambio_fase', estadoJuego.fase);

    // Llamamos al director de orquesta
    iniciarReloj();
  });

socket.on('pausar_juego', () => {
    if (estadoJuego.fase === 'jugando') {
      estadoJuego.fase = 'pausa';
      clearInterval(estadoJuego.intervaloReloj); // Congelamos el tiempo
      io.emit('cambio_fase', 'pausa');
      console.log('⏸️ Juego Pausado');
    } else if (estadoJuego.fase === 'pausa') {
      estadoJuego.fase = 'jugando';
      io.emit('cambio_fase', 'jugando');
      console.log('▶️ Juego Reanudado');
      
      // Volvemos a arrancar el reloj desde donde se quedó
      estadoJuego.intervaloReloj = setInterval(() => {
        estadoJuego.tiempoRestante--;
        io.emit('tic_tac', estadoJuego.tiempoRestante);

        if (estadoJuego.tiempoRestante <= 0) {
          clearInterval(estadoJuego.intervaloReloj);
          const preguntaActual = preguntas[estadoJuego.preguntaActualIndex];
          io.emit('mostrar_resultado', preguntaActual.respuestaCorrecta);
          io.emit('actualizar_jugadores', estadoJuego.jugadores);
          
          setTimeout(() => {
            estadoJuego.preguntaActualIndex++;
            if (estadoJuego.preguntaActualIndex < preguntas.length) {
              iniciarReloj();
            } else {
              estadoJuego.fase = 'finalizado';
              io.emit('cambio_fase', 'finalizado');
            }
          }, 4000); 
        }
      }, 1000);
    }
  });

  // 2. FINALIZAR ABRUPTAMENTE
  socket.on('finalizar_juego', () => {
    estadoJuego.fase = 'finalizado';
    clearInterval(estadoJuego.intervaloReloj); // Matamos el reloj
    io.emit('cambio_fase', 'finalizado');
    console.log('🛑 El Admin finalizó el juego de emergencia');
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