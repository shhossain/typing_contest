import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAt2IUIJ7k_UKmBbfU-qTzxaWu1moC2w0A",
    authDomain: "typingtest-7d91e.firebaseapp.com",
    databaseURL: "https://typingtest-7d91e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typingtest-7d91e",
    storageBucket: "typingtest-7d91e.firebasestorage.app",
    messagingSenderId: "527312928803",
    appId: "1:527312928803:web:4e77e0ae826778dda67196",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function updateUserInterface() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'create-user.html';
        return;
    }

    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser.profilePic) {
        userAvatar.style.backgroundImage = `url(${currentUser.profilePic})`;
    } else {
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
    userAvatar.style.display = 'block';
    logoutBtn.style.display = 'block';

    // Move logout event listener here
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function formatTimeLeft(startTime, endTime) {
    const now = Date.now();
    if (now < startTime) {
        const minutes = Math.floor((startTime - now) / 60000);
        return `Starts in ${minutes} minutes`;
    } else if (now > endTime) {
        return 'Ended';
    } else {
        const minutes = Math.floor((endTime - now) / 60000);
        return `${minutes} minutes left`;
    }
}

let currentFilter = 'active';

function getRoomStatus(startTime, endTime) {
    const now = Date.now();
    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'completed';
    return 'active';
}

// Modify the click event listener
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update current filter
        currentFilter = button.dataset.filter;

        // Get the latest rooms data and refresh display
        const roomsRef = ref(db, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const rooms = snapshot.val();
            displayRooms(rooms);
        }, { onlyOnce: true });
    });
});

function displayRooms(rooms) {
    if (!rooms) return;

    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';

    Object.entries(rooms).forEach(([roomId, room]) => {
        const status = getRoomStatus(room.startTime, room.endTime);

        // Only display rooms matching the current filter
        if (status === currentFilter) {
            const timeLeft = formatTimeLeft(room.startTime, room.endTime);
            const card = document.createElement('div');
            card.className = 'room-card';
            // <button onclick="window.location.href='room.html?id=${roomId}'">${currentFilter === 'completed' ? 'View Results' : 'Join Room'}</button>
            card.innerHTML = `
                <h3>${room.name}</h3>
                <p>${timeLeft}</p>
            `;
            roomList.appendChild(card);
            card.addEventListener('click', () => {
                window.location.href = `room.html?id=${roomId}`;
            });
        }
    });

    // Show message if no rooms match the filter
    if (roomList.children.length === 0) {
        roomList.innerHTML = `<p>No ${currentFilter} rooms available</p>`;
    }
}

// Update the initial rooms listener
const roomsRef = ref(db, 'rooms');
onValue(roomsRef, (snapshot) => {
    const rooms = snapshot.val();
    displayRooms(rooms);
});

updateUserInterface();
