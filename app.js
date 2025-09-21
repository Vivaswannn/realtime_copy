    const express = require('express');
const app = express();
const path = require('path');


const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app);

const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
    console.log('a user connected');
})

app.get('/' , function(req, res) {
    res.render('index');
})

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

