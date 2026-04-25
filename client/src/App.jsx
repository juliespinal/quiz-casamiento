import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { io } from 'socket.io-client'
import Confetti from 'react-confetti'

// Nos conectamos al servidor
const socket = io(`http://${window.location.hostname}:3300`)
  
const Invitado = () => {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [registrado, setRegistrado] = useState(false)
  const [fase, setFase] = useState('lobby')
  
  const [preguntaActual, setPreguntaActual] = useState(null)
  const [tiempo, setTiempo] = useState(10)
  const [eleccion, setEleccion] = useState(null)
  const [resultadoRound, setResultadoRound] = useState(null)

  useEffect(() => {
    socket.on('cambio_fase', (nuevaFase) => setFase(nuevaFase))
    socket.on('nueva_pregunta', (datos) => {
      setPreguntaActual(datos)
      setTiempo(datos.tiempo)
      setEleccion(null)
      setResultadoRound(null)
    })
    socket.on('tic_tac', (segundos) => setTiempo(segundos))
    socket.on('mostrar_resultado', (indiceCorrecto) => {
      if (eleccion === null) setResultadoRound('lento')
      else if (eleccion === indiceCorrecto) setResultadoRound('correcto')
      else setResultadoRound('incorrecto')
    })
    return () => {
      socket.off('cambio_fase')
      socket.off('nueva_pregunta')
      socket.off('tic_tac')
      socket.off('mostrar_resultado')
    }
  }, [eleccion])

  const handleRegistro = (e) => {
    e.preventDefault()
    if (nombre && apellido) {
      socket.emit('jugador_listo', { nombre, apellido })
      setRegistrado(true)
    }
  }

  const enviarRespuesta = (indiceOpcion) => {
    if (eleccion === null && tiempo > 0) {
      setEleccion(indiceOpcion)
      socket.emit('enviar_respuesta', indiceOpcion)
    }
  }

  // 1. Pantalla de Juego Activo
  if (registrado && fase === 'jugando') {
    // Colores sólidos y legibles para el celular
    let containerColor = "bg-[#1E2D3D] border-2 border-[#D4B996]"; // Azul marino por defecto
    if (resultadoRound === 'correcto') containerColor = "bg-[#154734] border-2 border-green-400"; // Verde sólido
    if (resultadoRound === 'incorrecto') containerColor = "bg-[#6C1B1F] border-2 border-red-400"; // Borgoña sólido
    if (resultadoRound === 'lento') containerColor = "bg-gray-700 border-2 border-gray-400"; // Gris

    return (
      // min-h-[100dvh] y py-12 aseguran que SIEMPRE haya margen arriba y abajo
      <div className="flex min-h-[100dvh] bg-wedding items-center justify-center p-6 py-12 text-center transition-colors duration-1000 overflow-y-auto">
        {preguntaActual ? (
          <div className={`w-full max-w-md my-auto p-8 rounded-[2rem] shadow-2xl transition-all duration-500 ${containerColor}`}>
            
            <div className={`text-6xl font-black mb-4 drop-shadow-lg ${resultadoRound ? 'text-white' : 'text-[#D4B996]'}`}>
              {tiempo}s
            </div>

            {resultadoRound ? (
              <div className="text-white py-8 animate-fade-in">
                <h2 className="text-5xl font-boda mb-4">
                  {resultadoRound === 'correcto' ? '¡SÍII! 🎉' :
                    resultadoRound === 'incorrecto' ? '¡NOOO! ❌' : '¡MUY LENTO! ⏱️'}
                </h2>
                <p className="text-xl font-bold uppercase tracking-widest text-[#D4B996]">
                  {resultadoRound === 'correcto' ? '+113 Puntos' : 'Más suerte la próxima'}
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/20 pb-6 leading-tight drop-shadow-md">
                  {preguntaActual.pregunta}
                </h2>
                <div className="flex flex-col gap-4">
                  {preguntaActual.opciones.map((opcion, index) => (
                    <button
                      key={index}
                      disabled={eleccion !== null}
                      onClick={() => enviarRespuesta(index)}
                      className={`p-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                        eleccion === index 
                          ? 'bg-[#D4B996] text-[#154734] scale-95 border-2 border-transparent' 
                          : 'bg-[#154734] text-white border border-[#D4B996]/50 hover:bg-[#9A9B6A] active:scale-95'
                      } ${eleccion !== null && eleccion !== index ? 'opacity-40 grayscale' : ''}`}
                    >
                      {eleccion === index ? 'ENVIADA...' : opcion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-[#154734] p-10 rounded-3xl text-center border-2 border-[#D4B996]">
            <h1 className="text-5xl font-boda text-[#D4B996] animate-pulse">¡PREPARATE!</h1>
          </div>
        )}
      </div>
    )
  }

  // 2. Pantalla de Pausa
  if (registrado && fase === 'pausa') {
    return (
      <div className="flex h-screen bg-wedding items-center justify-center p-6 text-center grayscale transition-all duration-1000">
        <div className="bg-[#1E2D3D] p-10 rounded-[2rem] shadow-2xl border-2 border-[#D4B996]">
          <h1 className="text-5xl font-boda text-[#D4B996] mb-4 animate-pulse">⏸ PAUSA</h1>
          <p className="text-xl font-light text-white tracking-wide">Por favor, presten atención al animador...</p>
        </div>
      </div>
    )
  }

  // 3. Pantalla Finalizado
  if (registrado && fase === 'finalizado') {
    return (
      <div className="flex h-screen bg-wedding items-center justify-center p-6 text-center">
        <div className="bg-[#154734] p-10 rounded-[2rem] shadow-2xl border-2 border-[#D4B996]">
          <div className="text-6xl font-boda text-[#D4B996] mb-2">M&J</div>
          <h1 className="text-4xl font-black text-white mb-6 tracking-widest uppercase">🏁 ¡FIN DEL JUEGO!</h1>
          <p className="text-xl text-[#D4B996] font-light italic">¡No cierres esto y mirá la pantalla hasta que el juego termine!</p>
        </div>
      </div>
    )
  }

  // 4. Pantalla de Espera (Lobby)
  if (registrado && fase === 'lobby') {
    return (
      <div className="flex h-screen bg-wedding items-center justify-center p-6 text-center">
        <div className="bg-[#1E2D3D] p-10 rounded-[2rem] shadow-2xl w-full max-w-md border-2 border-[#D4B996]/50">
          <div className="text-7xl font-boda text-[#D4B996] mb-6 drop-shadow-lg">M&J</div>
          <h1 className="text-2xl font-light text-white animate-pulse leading-relaxed">
            ¡Listo <span className="font-bold text-[#D4B996]">{nombre}</span>!<br/> Mirá la pantalla del salón y esperá...
          </h1>
        </div>
      </div>
    )
  }

  // 5. Pantalla de Registro Inicial
  return (
    <div className="flex min-h-[100dvh] bg-wedding items-center justify-center p-6 py-12 text-white overflow-y-auto">
      <div className="bg-[#154734] w-full max-w-md my-auto p-10 shadow-2xl rounded-[2.5rem] border-2 border-[#D4B996] relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[5.5rem] font-boda text-center text-[#D4B996] leading-none mb-2 drop-shadow-md">M&J</div>
          <p className="text-[#D4B996] text-center italic mb-8 font-light tracking-wide text-lg">
            "Vamos a ver cuánto conocés a los novios..."
          </p>
          
          <form onSubmit={handleRegistro} className="flex flex-col gap-6">
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Tu Nombre" 
                className="w-full bg-white/10 border border-[#D4B996]/50 p-4 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#D4B996] transition-all"
                value={nombre} onChange={(e) => setNombre(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Tu Apellido" 
                className="w-full bg-white/10 border border-[#D4B996]/50 p-4 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#D4B996] transition-all"
                value={apellido} onChange={(e) => setApellido(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="bg-[#D4B996] text-[#154734] p-4 rounded-2xl font-black text-xl hover:bg-[#9A9B6A] hover:text-white transition-all shadow-lg active:scale-95 mt-2">
              ESTOY LISTO
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// --- ZONA ADMIN ---
const Admin = () => {
  const lanzarJuego = () => socket.emit('iniciar_juego')
  const pausarJuego = () => socket.emit('pausar_juego')
  const finalizarJuego = () => socket.emit('finalizar_juego')

  return (
    <div className="min-h-screen bg-wedding p-6 flex flex-col items-center justify-center">
      <div className="glass-dark w-full max-w-xl p-8 border-2 border-[#D4B996]/30">
        <div className="text-5xl font-boda text-[#D4B996] text-center mb-4">M&J</div>
        
        <div className="bg-white/5 p-4 rounded-lg mb-8 text-white/80 text-sm leading-relaxed border border-white/10">
          <p className="font-bold text-[#D4B996] mb-2">Instrucciones para el Animador:</p>
          Una vez que los invitados estén listos, presioná "COMENZAR". Podés pausar en cualquier momento para hablar.
        </div>

        <div className="flex flex-col gap-6">
          <button onClick={() => socket.emit('iniciar_juego')} 
            className="h-24 bg-[#154734] border-2 border-[#9A9B6A] text-white rounded-2xl text-3xl font-black shadow-xl active:translate-y-1">
            ▶ COMENZAR JUEGO
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => socket.emit('pausar_juego')} 
              className="h-20 bg-[#D4B996] text-[#154734] rounded-2xl text-xl font-bold shadow-lg">
              ⏸ PAUSAR
            </button>
            <button onClick={() => socket.emit('finalizar_juego')} 
              className="h-20 bg-[#6C1B1F] text-white rounded-2xl text-xl font-bold shadow-lg">
              🛑 FINALIZAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Hall = () => {
  const [jugadores, setJugadores] = useState([])
  const [fase, setFase] = useState('lobby')
  const [preguntaActual, setPreguntaActual] = useState(null)
  const [tiempo, setTiempo] = useState(10)
  const [correctaIndex, setCorrectaIndex] = useState(null)

  useEffect(() => {
    socket.emit('pedir_jugadores')
    
    socket.on('actualizar_jugadores', (listaActualizada) => {
      const listaOrdenada = [...listaActualizada].sort((a, b) => b.puntos - a.puntos);
      setJugadores(listaOrdenada);
    });
    
    socket.on('cambio_fase', (nuevaFase) => setFase(nuevaFase))
    
    socket.on('nueva_pregunta', (datos) => {
      setPreguntaActual(datos)
      setTiempo(datos.tiempo)
      setCorrectaIndex(null) 
    })
    
    socket.on('tic_tac', (segundos) => setTiempo(segundos))

    socket.on('mostrar_resultado', (indiceCorrecto) => {
      setCorrectaIndex(indiceCorrecto)
    })

    return () => {
      socket.off('actualizar_jugadores')
      socket.off('cambio_fase')
      socket.off('nueva_pregunta')
      socket.off('tic_tac')
      socket.off('mostrar_resultado')
    }
  }, [])

  // 1. Vista durante el juego
  if (fase === 'jugando') {
    return (
      <div className="flex h-screen bg-wedding font-sans overflow-hidden p-[2vh] gap-[2vh]">
        
        {/* Lado Izquierdo: La Pregunta */}
        <div className="w-[40%] bg-[#154734]/95 border-2 border-[#D4B996] rounded-3xl flex flex-col p-[4vh] shadow-2xl h-full transition-all duration-700">
          
          <div className="flex flex-col items-center shrink-0">
            <div className="text-[4vh] font-boda text-[#D4B996] mb-[1vh] opacity-80">M&J</div>
            <div className={`text-[12vh] leading-none font-black mb-[2vh] drop-shadow-2xl transition-colors duration-500 ${correctaIndex !== null ? 'text-green-400' : 'text-white'}`}>
              {tiempo}<span className="text-[5vh] text-[#D4B996]">s</span>
            </div>
            <h2 className="text-[4.5vh] font-extrabold text-white text-center leading-tight mb-[3vh] drop-shadow-md">
              {preguntaActual?.pregunta}
            </h2>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center gap-[1.5vh] overflow-hidden px-4 py-4">
            {preguntaActual?.opciones.map((op, i) => {
              const isCorrect = correctaIndex === i;
              const isRevealed = correctaIndex !== null;
              
              let estilosExtra = "bg-[#1E2D3D] text-white border-[#D4B996]/50"; 
              
              if (isRevealed) {
                if (isCorrect) {
                  estilosExtra = "bg-[#154734] border-green-400 text-green-300 scale-[1.02] shadow-[0_0_30px_rgba(74,222,128,0.5)] z-10 animate-pulse";
                } else {
                  estilosExtra = "bg-[#0B151F] text-gray-500 border-gray-800 opacity-40 grayscale scale-95";
                }
              }

              return (
                <div 
                  key={i} 
                  className={`px-4 py-[1.5vh] rounded-2xl text-[2.5vh] font-semibold text-center border shadow-lg min-h-[80px] flex items-center justify-center shrink-0 transition-all duration-700 ease-in-out transform ${estilosExtra}`}
                >
                  {op}
                </div>
              )
            })}
          </div>
        </div>

        {/* Lado Derecho: Ranking */}
        <div className="w-[60%] bg-[#1E2D3D]/95 border-2 border-[#D4B996] rounded-3xl flex flex-col p-[3vh] shadow-2xl h-full">
          <h3 className="text-[#D4B996] text-[5vh] font-boda text-center mb-[2vh] shrink-0 border-b border-[#D4B996]/30 pb-[1vh]">
            Posiciones
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1vh] overflow-y-auto custom-scrollbar content-start flex-1 pr-2">
            {jugadores.map((j, i) => (
              <div key={j.id} className="bg-[#154734] border border-[#D4B996]/50 rounded-lg p-[1vh] flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-[1vh] overflow-hidden w-full">
                  <span className="text-[#D4B996] font-black text-[2vh] w-[3vh]">{i+1}</span>
                  <span className="text-white font-bold text-[1.8vh] uppercase truncate flex-1">{j.nombre}</span>
                </div>
                <span className="text-green-400 font-black text-[2vh] ml-1">{j.puntos}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 2. VISTA FINAL (PODIO O EMPATE)
  if (fase === 'finalizado') {
    const puntajeMaximo = jugadores[0]?.puntos || 0;
    const empatados = jugadores.filter(j => j.puntos === puntajeMaximo && puntajeMaximo > 0);
    
    // CASO A: SI HAY EMPATE
    if (empatados.length > 1) {
      return (
        <div className="flex flex-col h-screen bg-[#1E2D3D] items-center justify-center p-[5vh] relative font-sans overflow-hidden">
          <Confetti numberOfPieces={400} recycle={true} gravity={0.08} />

          <div className="text-center z-10 border-4 border-[#D4B996] p-[8vh] rounded-[4rem] bg-[#154734]/95 shadow-[0_0_80px_rgba(212,185,150,0.3)] max-w-[90vw]">
            <div className="text-[6vh] font-boda text-[#D4B996] mb-[2vh]">M&J</div>
            <h1 className="text-[10vh] font-black text-white uppercase tracking-tighter mb-[2vh] leading-none drop-shadow-2xl">
              ¡HAY UN EMPATE!
            </h1>
            <p className="text-[4.5vh] text-[#D4B996] font-light mb-[8vh] italic tracking-widest">
              El primer puesto se define entre:
            </p>

            <div className="flex flex-wrap justify-center gap-[6vh]">
              {empatados.map(j => (
                <div key={j.id} className="flex flex-col items-center animate-bounce">
                  <span className="text-[8vh] font-black text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {j.nombre}
                  </span>
                  <span className="text-[4vh] text-green-400 font-black mt-[-1vh]">
                    {j.puntos} PTS
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-[10vh] text-white/50 text-[2.5vh] uppercase tracking-[0.5em] animate-pulse">
              NO CIERRES LA PANTALLA HASTA QUE TERMINE EL DESEMPATE
            </div>
          </div>
        </div>
      );
    }

    // CASO B: SI NO HAY EMPATE (Podio Normal)
    const podio = jugadores.slice(0, 3);
    return (
      <div className="flex flex-col h-screen bg-[#1E2D3D] items-center justify-between py-[5vh] relative font-sans overflow-hidden">
        <Confetti numberOfPieces={600} recycle={false} gravity={0.12} />

        <div className="text-center z-10 shrink-0 w-full px-4 mt-[4vh]">
            <div className="text-[6vh] font-boda text-[#D4B996] mb-[1vh]">M&J</div>
            <h1 className="text-[6vh] md:text-[8vh] font-black text-white uppercase tracking-widest drop-shadow-2xl">
              ¡TENEMOS GANADORES!
            </h1>
        </div>

        <div className="flex items-end gap-[2vw] z-10 flex-1 justify-center w-full px-4 pb-[5vh]">
          {/* SEGUNDO PUESTO */}
          {podio[1] && (
            <div className="flex flex-col items-center w-[20vw] max-w-[200px]">
              <span className="text-[3vh] font-bold text-white mb-1 uppercase text-center truncate w-full">{podio[1].nombre}</span>
              <span className="text-green-400 font-black text-[2.5vh] mb-2">{podio[1].puntos} pts</span>
              <div className="bg-[#D4B996] w-full h-[35vh] flex justify-center items-start pt-[2vh] text-[8vh] font-black text-[#154734] rounded-t-2xl shadow-lg border-t-8 border-white/50">2</div>
            </div>
          )}
          {/* PRIMER PUESTO */}
          {podio[0] && (
            <div className="flex flex-col items-center z-20 w-[25vw] max-w-[250px]">
              <span className="text-[4vh] font-black text-yellow-400 mb-1 uppercase text-center truncate w-full drop-shadow-lg">{podio[0].nombre}</span>
              <span className="text-green-400 font-black text-[3vh] mb-2 drop-shadow-md">{podio[0].puntos} pts</span>
              <div className="bg-yellow-500 w-full h-[45vh] flex justify-center items-start pt-[3vh] text-[10vh] font-black text-yellow-900 rounded-t-2xl shadow-[0_0_60px_rgba(234,179,8,0.6)] border-t-8 border-yellow-200">1</div>
            </div>
          )}
          {/* TERCER PUESTO */}
          {podio[2] && (
            <div className="flex flex-col items-center w-[20vw] max-w-[200px]">
              <span className="text-[3vh] font-bold text-white mb-1 uppercase text-center truncate w-full">{podio[2].nombre}</span>
              <span className="text-green-400 font-black text-[2.5vh] mb-2">{podio[2].puntos} pts</span>
              <div className="bg-[#9A9B6A] w-full h-[25vh] flex justify-center items-start pt-[2vh] text-[8vh] font-black text-[#154734] rounded-t-2xl shadow-lg border-t-8 border-white/30">3</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Vista Lobby
  return (
    <div className="h-screen bg-wedding flex flex-col items-center justify-center p-[6vh] overflow-hidden">
       <div className="bg-[#154734]/95 border-2 border-[#D4B996] rounded-[3rem] p-[6vh] text-center max-w-6xl w-full shadow-2xl flex flex-col h-full max-h-[90vh]">
          <div className="text-[12vh] font-boda text-[#D4B996] leading-none mb-[2vh] shrink-0 drop-shadow-lg">M&J</div>
          <h1 className="text-[5vh] font-light text-white uppercase tracking-[0.3em] mb-[4vh] shrink-0">Esperando Jugadores</h1>
          
          <div className="flex flex-wrap justify-center gap-[1vh] overflow-y-auto custom-scrollbar p-2 flex-1 content-start">
            {jugadores.map(j => (
              <div key={j.id} className="bg-[#1E2D3D] border border-[#D4B996]/50 px-[2vh] py-[1vh] rounded-xl text-white text-[2.5vh] font-medium shadow-md">
                {j.nombre} {j.apellido}
              </div>
            ))}
          </div>
       </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Invitado />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/hall" element={<Hall />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App