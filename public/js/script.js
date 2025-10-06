const socket = io();

const statusEl = document.getElementById('status');
const enableBtn = document.getElementById('enableLocation');

function setStatus(message){
    if(statusEl){
        statusEl.textContent = message;
    }
}

function startWatchingLocation(){
    if(!navigator.geolocation){
        setStatus('Geolocation is not supported by your browser');
        return;
    }
    setStatus('Requesting location...');
    navigator.geolocation.watchPosition((position)=>{
        const {latitude, longitude} = position.coords;
        socket.emit('send-location', {latitude, longitude});
        setStatus('Location active');
    }, (error)=>{
        console.error(error);
        if(error.code === error.PERMISSION_DENIED){
            setStatus('Permission denied. Enable location in browser settings.');
        } else if(error.code === error.POSITION_UNAVAILABLE){
            setStatus('Location unavailable. Move outdoors or check GPS.');
        } else if(error.code === error.TIMEOUT){
            setStatus('Location request timed out.');
        } else {
            setStatus('Location error.');
        }
    },{
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    });
}

if(enableBtn){
    enableBtn.addEventListener('click', startWatchingLocation);
}

const map = L.map("map").setView([0,0], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "OpenStreetMap"
}).addTo(map);

const markers = {};

socket.on('receive-location', (data) => {
    const {id, latitude, longitude} = data;
    map.setView([latitude, longitude]);
    if(markers[id]){
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

socket.on('user-disconnected', (id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});