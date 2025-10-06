    const express = require('express');
const app = express();
const path = require('path');


const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Cache latest location per connected socket id
const latestLocations = new Map();

io.on('connection', function(socket){
    console.log('a user connected');

    // Send all known locations to the newly connected client
    for (const [id, loc] of latestLocations.entries()) {
        // Skip sending back own location; will arrive when client emits
        if (id !== socket.id) {
            socket.emit('receive-location', { id, ...loc });
        }
    }

    socket.on('send-location', function(data){
        console.log('Location received:', data);
        latestLocations.set(socket.id, data);
        io.emit('receive-location', {id: socket.id, ...data});
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
        latestLocations.delete(socket.id);
        io.emit('user-disconnected', socket.id);
    });
})



app.get('/' , function(req, res) {
    res.render('index');
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});

