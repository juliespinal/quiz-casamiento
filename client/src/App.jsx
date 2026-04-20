import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { io } from 'socket.io-client'

// Nos conectamos al servidor
const socket = io(`http://${window.location.hostname}:3300`)

// --- ZONA INVITADO ---
const Invitado = () => {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [registrado, setRegistrado] = useState(false)
  const [fase, setFase] = useState('lobby') 

  useEffect(() => {
    socket.on('cambio_fase', (nuevaFase) => {
      setFase(nuevaFase)
    })
    return () => socket.off('cambio_fase')
  }, [])

  const handleRegistro = (e) => {
    e.preventDefault()
    if (nombre && apellido) {
      socket.emit('jugador_listo', { nombre, apellido })
      setRegistrado(true)
    }
  }

  if (registrado && fase === 'jugando') {
    return (
      <div className="flex h-screen items-center justify-center bg-yellow-400 p-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 animate-bounce">
          ¡PREPARATE! EL JUEGO COMIENZA...
        </h1>
      </div>
    )
  }

  if (registrado && fase === 'lobby') {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-100 p-4 text-center">
        <h1 className="text-2xl font-bold text-blue-700 animate-pulse">
          ¡Listo {nombre}! Mirá la pantalla gigante y esperá a que arranque el juego...
        </h1>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleRegistro} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm flex flex-col gap-5">
        <h2 className="text-2xl font-extrabold text-center text-gray-800">¡Sumate al juego!</h2>
        <input type="text" placeholder="Tu Nombre" required className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input type="text" placeholder="Tu Apellido" required className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition">Estoy listo</button>
      </form>
    </div>
  )
}

// --- ZONA ADMIN ---
const Admin = () => {
  const lanzarJuego = () => {
    socket.emit('iniciar_juego')
  }

  return (
    <div className="flex h-screen items-center justify-center bg-red-100 flex-col gap-8">
      <h1 className="text-4xl font-bold text-red-700 uppercase tracking-wider">Panel de Control</h1>
      <button 
        onClick={lanzarJuego}
        className="bg-red-600 text-white px-10 py-5 rounded-2xl font-extrabold text-2xl hover:bg-red-700 transition shadow-2xl transform hover:scale-105 active:scale-95"
      >
        ▶ COMENZAR JUEGO
      </button>
    </div>
  )
}

// --- ZONA HALL --- (Esta era la que faltaba)
const Hall = () => {
  const [jugadores, setJugadores] = useState([])

  useEffect(() => {
    socket.emit('pedir_jugadores')

    socket.on('actualizar_jugadores', (listaActualizada) => {
      setJugadores(listaActualizada)
    })

    return () => {
      socket.off('actualizar_jugadores')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-5xl font-extrabold text-center text-yellow-400 mb-10 tracking-widest uppercase">
        Sala de Espera
      </h1>
      
      <div className="flex flex-wrap gap-6 justify-center">
        {jugadores.length === 0 ? (
          <p className="text-white text-2xl animate-pulse">Esperando a que se sumen los invitados...</p>
        ) : (
          jugadores.map((jugador) => (
            <div 
              key={jugador.id} 
              className="bg-gray-800 border-2 border-yellow-400 rounded-xl p-6 shadow-2xl w-64 text-center transform transition duration-500 hover:scale-105"
            >
              <p className="text-2xl font-bold text-white uppercase">{jugador.nombre}</p>
              <p className="text-xl text-gray-400">{jugador.apellido}</p>
            </div>
          ))
        )}
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