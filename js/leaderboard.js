import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAt2IUIJ7k_UKmBbfU-qTzxaWu1moC2w0A",
    authDomain: "typingtest-7d91e.firebaseapp.com",
    databaseURL: "https://typingtest-7d91e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typingtest-7d91e",
    storageBucket: "typingtest-7d91e.firebasestorage.app",
    messagingSenderId: "527312928803",
    appId: "1:527312928803:web:4e77e0ae826778dda67196",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function getUrlRoomId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room');
}

function updateUrlWithRoom(roomId) {
    const newUrl = roomId
        ? `${window.location.pathname}?room=${roomId}`
        : window.location.pathname;
    window.history.pushState({ roomId }, '', newUrl);
}

class RaceTrack {
    constructor(container) {
        this.container = container;
        this.racers = new Map();
        this.maxWPM = 100;
        this.nameOccurrences = new Map();
        this.countdownInterval = null;
    }

    formatUserName(userId, name) {
        const suffix = userId.slice(-4);
        const count = this.nameOccurrences.get(name) || 0;
        this.nameOccurrences.set(name, count + 1);

        return count > 0 ? `${name} #${suffix}` : name;
    }

    createRacerElement(userData, userId, index) {
        const racer = document.createElement('div');
        racer.className = 'racer';
        racer.style.top = `${index * 60 + 15}px`;

        const avatar = document.createElement('div');
        avatar.className = 'racer-avatar';

        if (userData.profilePic) {
            avatar.style.backgroundImage = `url(${userData.profilePic})`;
        } else {
            avatar.textContent = userData.name.charAt(0).toUpperCase();
        }

        const nameContainer = document.createElement('div');
        nameContainer.className = 'racer-name';
        nameContainer.textContent = this.formatUserName(userId, userData.name);

        const wpm = document.createElement('span');
        wpm.className = 'racer-wpm';
        wpm.textContent = userData.wpm;

        nameContainer.appendChild(wpm);
        racer.appendChild(avatar);
        racer.appendChild(nameContainer);

        return racer;
    }

    createCountdown() {
        const countdown = document.createElement('div');
        countdown.className = 'countdown';
        countdown.id = 'countdown';
        this.container.appendChild(countdown);
    }

    updateCountdown(startTime, endTime) {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return;

        clearInterval(this.countdownInterval);

        this.countdownInterval = setInterval(() => {
            const now = Date.now();
            let timeLeft;
            let text;

            if (now < startTime) {
                timeLeft = Math.ceil((startTime - now) / 1000);
                text = `Starting in: ${timeLeft}s`;
            } else if (now < endTime) {
                timeLeft = Math.ceil((endTime - now) / 1000);
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                text = `Time left: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                text = 'Race Complete';
                clearInterval(this.countdownInterval);
            }

            countdownElement.textContent = text;
        }, 1000);
    }

    updateRacer(userId, userData) {
        if (!this.racers.has(userId)) {
            const racerElement = this.createRacerElement(userData, userId, this.racers.size);
            this.container.appendChild(racerElement);
            this.racers.set(userId, racerElement);
        }

        // Check if we need to increase maxWPM
        if (userData.wpm > this.maxWPM * 0.9) {  // Increase track when someone reaches 90% of max
            this.maxWPM = Math.ceil(userData.wpm * 1.2);  // Increase by 20%
            // Update all racers' positions with new maxWPM
            this.racers.forEach((element, id) => {
                const racer = element;
                const racerData = id === userId ? userData : this.racers.get(id)._userData;
                const position = (racerData.wpm / this.maxWPM) * (this.container.offsetWidth - 150);
                racer.style.left = `${Math.min(position, this.container.offsetWidth - 150)}px`;
            });
        } else {
            const racerElement = this.racers.get(userId);
            const position = (userData.wpm / this.maxWPM) * (this.container.offsetWidth - 150);
            racerElement.style.left = `${Math.min(position, this.container.offsetWidth - 150)}px`;
        }

        // Store the userData for future reference
        this.racers.get(userId)._userData = userData;
        // Update WPM display
        this.racers.get(userId).querySelector('.racer-wpm').textContent = userData.wpm;
    }

    reset() {
        clearInterval(this.countdownInterval);
        this.racers.clear();
        this.nameOccurrences.clear();
        this.container.innerHTML = '<div class="finish-line"></div>';
        this.createCountdown();
    }
}




const roomsRef = ref(db, 'rooms');


// Modify the hideRaceTrack function
function hideRaceTrack() {
    document.getElementById('room-list').style.display = 'grid';
    document.getElementById('race-track').style.display = 'none';
    document.querySelector('.room-filters').style.display = 'flex';
    updateUrlWithRoom(null);
}

window.hideRaceTrack = hideRaceTrack;
window.showRaceTrack = showRaceTrack;

let currentFilter = 'today';

function isWithinTimeRange(timestamp, filter) {
    const now = Date.now();
    const date = new Date(timestamp);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (filter) {
        case 'today':
            return date >= today;
        case 'week':
            return date >= weekStart;
        case 'month':
            return date >= monthStart;
        default:
            return true;
    }
}

// Add filter click handler
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;

        // Refresh the room list with the new filter
        const roomsRef = ref(db, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const rooms = snapshot.val();
            createRoomList(rooms);
        }, { onlyOnce: true });
    });
});

// Update the createRoomList function to show all rooms
function createRoomList(rooms) {
    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';

    if (!rooms) return;

    // Convert rooms object to array and filter by time range
    const sortedRooms = Object.entries(rooms)
        .map(([id, room]) => ({ id, ...room }))
        .filter(room => isWithinTimeRange(room.startTime, currentFilter))
        .sort((a, b) => b.startTime - a.startTime);

    if (sortedRooms.length === 0) {
        roomList.innerHTML = `<p>No rooms found for the selected time period</p>`;
        return;
    }

    sortedRooms.forEach((room) => {
        const card = document.createElement('div');
        card.className = 'room-card';

        const status = Date.now() > room.endTime ? 'Completed' : 'In Progress';
        const buttonText = Date.now() > room.endTime ? 'View Results' : 'View Race';
        const date = new Date(room.startTime).toLocaleDateString();
        const time = new Date(room.startTime).toLocaleTimeString();

        // <p>Date: ${date} at ${time}</p>
        card.innerHTML = `
            <h3>${room.name}</h3>
            <p>Status: ${status}</p>
            <button onclick="showRaceTrack('${room.id}')" class="primary-btn">${buttonText}</button>
        `;

        if (Date.now() > room.endTime) {
            card.classList.add('completed');
        }

        roomList.appendChild(card);
    });
}

// Update the onValue listener to use createRoomList
onValue(roomsRef, (snapshot) => {
    const rooms = snapshot.val();
    createRoomList(rooms);
});

// Modify the showRaceTrack function
function showRaceTrack(roomId) {
    const raceTrackElement = document.getElementById('race-track');
    const roomListElement = document.getElementById('room-list');
    const roomFilters = document.querySelector('.room-filters');

    roomListElement.style.display = 'none';
    raceTrackElement.style.display = 'block';
    roomFilters.style.display = 'none';

    updateUrlWithRoom(roomId);

    const raceTrack = new RaceTrack(raceTrackElement);
    raceTrack.reset();

    // Remove the separate status element since we'll use countdown for all status messages
    const existingStatus = document.getElementById('race-status');
    if (existingStatus) {
        existingStatus.remove();
    }

    // Listen for real-time updates
    const roomRef = ref(db, `rooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
        const roomData = snapshot.val();
        if (!roomData || !roomData.users) return;

        // Update countdown with all status messages
        raceTrack.updateCountdown(roomData.startTime, roomData.endTime);


        Object.entries(roomData.users).forEach(([userId, userData]) => {
            raceTrack.updateRacer(userId, userData);
        });
    });
}

function toggleFullscreen() {
    const raceTrack = document.getElementById('race-track');
    const isFullscreen = raceTrack.classList.contains('fullscreen');

    if (!isFullscreen) {
        if (raceTrack.requestFullscreen) {
            raceTrack.requestFullscreen();
        } else if (raceTrack.webkitRequestFullscreen) {
            raceTrack.webkitRequestFullscreen();
        } else if (raceTrack.msRequestFullscreen) {
            raceTrack.msRequestFullscreen();
        }
        raceTrack.classList.add('fullscreen');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        raceTrack.classList.remove('fullscreen');
    }
}

// Add fullscreen change event listener
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
    const raceTrack = document.getElementById('race-track');
    const fullscreenBtn = document.querySelector('.fullscreen-button');

    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {
        raceTrack.classList.remove('fullscreen');
        fullscreenBtn.textContent = 'Fullscreen';
    } else {
        fullscreenBtn.textContent = 'Exit Fullscreen';
    }
}

// Make toggleFullscreen available globally
window.toggleFullscreen = toggleFullscreen;

// Add initialization code at the bottom of the file
function initialize() {
    const roomId = getUrlRoomId();
    if (roomId) {
        showRaceTrack(roomId);
    } else {
        hideRaceTrack();
    }
}

// Call initialize when the page loads
document.addEventListener('DOMContentLoaded', initialize);

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const roomId = getUrlRoomId();
    if (roomId) {
        showRaceTrack(roomId);
    } else {
        hideRaceTrack();
    }
});



