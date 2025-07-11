const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT; // Solo usa el puerto de Render

// Sirve multiplayer.html como página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'multiplayer.html'));
});

// Configurar Express para servir archivos estáticos (incluyendo multiplayer.html)
app.use(express.static(path.join(__dirname, '.')));

// Crear el servidor HTTP
const server = app.listen(port, () => {
    console.log(`Servidor HTTP corriendo en el puerto ${port}`);
});

// Crear el servidor WebSocket
const wss = new WebSocket.Server({ server });
const rooms = new Map();

wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const id = urlParams.get('id');
    const [roomId, playerId] = id.split(':');

    console.log(`Nuevo jugador conectado: ${playerId} en la sala ${roomId}`);

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    const room = rooms.get(roomId);
    room.add(ws);

    const playerNumber = room.size === 1 ? 1 : 2;
    ws.send(JSON.stringify({ type: 'playerId', id: playerId, playerNumber: playerNumber }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log(`Mensaje recibido en la sala ${roomId}:`, data);

        room.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on('close', () => {
        console.log(`Jugador ${playerId} desconectado de la sala ${roomId}`);
        room.delete(ws);
        if (room.size === 0) {
            rooms.delete(roomId);
        }
    });
});

console.log(`Servidor WebSocket configurado`);
