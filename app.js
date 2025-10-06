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

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('send-location', function(data){
        console.log('Location received:', data);
        io.emit('receive-location', {id: socket.id, ...data});
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
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

