@echo off
color 0A
echo ===================================================
echo     PREPARANDO EL JUEGO PARA LA BODA DE M^&J
echo ===================================================
echo.

:: 1. Instalar dependencias del Servidor
echo [1/4] Instalando paquetes del servidor...
cd server
call npm install
cd ..
echo.

:: 2. Instalar dependencias del Cliente
echo [2/4] Instalando paquetes del cliente...
cd client
call npm install
cd ..
echo.

echo ===================================================
echo     TODO INSTALADO. ENCENDIENDO MOTORES...
echo ===================================================
echo.

:: 3. Levantar el Servidor en una nueva terminal
echo [3/4] Arrancando el Servidor Central...
cd server
start "SERVIDOR M&J" cmd /k "npm run dev"
cd ..

:: 4. Levantar el Cliente (Hall/Admin/Invitados) exponiendo la IP
echo [4/4] Arrancando la Interfaz Grafica...
cd client
start "CLIENTE M&J" cmd /k "npm run dev -- --host"
cd ..

echo.
echo ===================================================
echo ¡EXITO! YA PODES MINIMIZAR ESTA VENTANA.
echo No cierres las dos ventanas negras que se abrieron.
echo ===================================================
pause