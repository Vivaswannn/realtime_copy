const socket = io();

const statusEl = document.getElementById('status');
const enableBtn = document.getElementById('enableLocation');
let watchId = null;

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
    if(watchId !== null){
        setStatus('Location already active');
        return;
    }
    setStatus('Requesting location...');
    watchId = navigator.geolocation.watchPosition((position)=>{
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

// Auto-start if permission already granted
if(navigator.permissions && navigator.permissions.query){
    try{
        navigator.permissions.query({name: 'geolocation'}).then((result) => {
            if(result.state === 'granted'){
                startWatchingLocation();
                if(enableBtn){ enableBtn.disabled = true; }
            } else if(result.state === 'prompt'){
                setStatus('Tap Enable Location to start');
            } else {
                setStatus('Location blocked. Enable in browser settings.');
            }
            result.onchange = () => {
                if(result.state === 'granted' && watchId === null){
                    startWatchingLocation();
                }
            };
        });
    } catch(e){
        // permissions API not available or blocked; ignore
    }
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