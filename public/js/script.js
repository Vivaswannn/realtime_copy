const socket = io();

const statusEl = document.getElementById('status');
const enableBtn = document.getElementById('enableLocation');
const followBtn = document.getElementById('followMe');
const showAllBtn = document.getElementById('showAll');
let watchId = null;
let followMe = false;
let mySocketId = null;

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
let hasCenteredOnce = false;

// Track user interactions to disable follow
map.on('dragstart zoomstart', () => {
    if(followMe){
        followMe = false;
        if(followBtn){ followBtn.textContent = 'Follow Me: Off'; }
        setStatus('Follow disabled due to map interaction');
    }
});

// Socket connection id
socket.on('connect', () => {
    mySocketId = socket.id;
});

socket.on('receive-location', (data) => {
    const {id, latitude, longitude} = data;
    if(markers[id]){
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
    // Initial center only once, prefer centering to my own location first
    if(!hasCenteredOnce){
        if(id === mySocketId){
            map.setView([latitude, longitude]);
            hasCenteredOnce = true;
        }
    }
    // Follow only my own position if toggle is on
    if(followMe && id === mySocketId){
        map.setView([latitude, longitude]);
    }
});

socket.on('user-disconnected', (id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// Follow button toggle
if(followBtn){
    followBtn.addEventListener('click', () => {
        followMe = !followMe;
        followBtn.textContent = `Follow Me: ${followMe ? 'On' : 'Off'}`;
        if(followMe && mySocketId && markers[mySocketId]){
            const ll = markers[mySocketId].getLatLng();
            map.setView([ll.lat, ll.lng]);
        }
    });
}

// Fit to show all users
function fitAllUsers(){
    const ids = Object.keys(markers);
    if(ids.length === 0){ return; }
    if(ids.length === 1){
        const ll = markers[ids[0]].getLatLng();
        map.setView([ll.lat, ll.lng]);
        return;
    }
    const bounds = L.latLngBounds(ids.map(id => markers[id].getLatLng()));
    map.fitBounds(bounds, { padding: [40, 40] });
}

if(showAllBtn){
    showAllBtn.addEventListener('click', () => {
        fitAllUsers();
        // Turning follow off when user chooses to view all
        if(followMe){
            followMe = false;
            if(followBtn){ followBtn.textContent = 'Follow Me: Off'; }
        }
    });
}