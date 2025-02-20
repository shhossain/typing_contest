import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

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

const serverTimeOffset = {
    offset: 0
};

// Get server time offset
const timeRef = ref(db, '.info/serverTimeOffset');
onValue(timeRef, (snapshot) => {
    serverTimeOffset.offset = snapshot.val();
});

function getServerTime() {
    return Date.now() + serverTimeOffset.offset;
}

let currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'create-user.html';
}

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id');
const roomRef = ref(db, `rooms/${roomId}`);

let startTime;
let isRunning = false;
let wordIndex = 0;
let totalCharactersTyped = 0;
let wrongCharactersTyped = 0;  // Add counter for wrong characters

let roomData = null;
let currentSnapshot = null;

onValue(roomRef, (snapshot) => {
    const currentInput = document.getElementById('input-box');
    const wasFocused = document.activeElement === currentInput;
    
    currentSnapshot = snapshot;
    roomData = snapshot.val();
    if (!roomData) return;

    document.getElementById('room-name').textContent = roomData.name;
    updateWordBox(roomData.text.split(' '), false);
    document.getElementById('input-box').disabled = true;

    startTime = roomData.startTime;
    updateGameState();
    
    if (wasFocused) {
        currentInput.focus();
    }

    if (Date.now() < roomData.startTime) {
        document.getElementById('word-box').classList.add('text-blur');
    }
});

function updateGameState() {
    const serverNow = getServerTime();
    const input = document.getElementById('input-box');
    const timer = document.getElementById('timer');
    const wordBox = document.getElementById('word-box');

    if (!roomData || !roomData.startTime || !roomData.endTime) return;  // Add null checks

    if (serverNow < roomData.startTime) {
        const timeLeft = Math.ceil((roomData.startTime - serverNow) / 1000);
        timer.textContent = `Starting in: ${timeLeft}s`;
        input.disabled = true;
        input.placeholder = "Wait for race to start...";
        wordBox.classList.add('text-blur');
        if (timeLeft > 0) {
            requestAnimationFrame(updateGameState);
        }
    } else if (serverNow >= roomData.endTime) {
        timer.textContent = 'Race ended';
        input.disabled = true;
        input.placeholder = "Race is over";
        isRunning = false;
        wordBox.classList.remove('text-blur');
        // Add delay before redirect to show final state
        setTimeout(() => {
            window.location.href = `leaderboard.html?roomId=${roomId}`;
        }, 2000);
    } else {
        const timeRemaining = Math.ceil((roomData.endTime - serverNow) / 1000);
        timer.textContent = `Time remaining: ${timeRemaining}s`;
        wordBox.classList.remove('text-blur');
        if (!isRunning) {
            input.disabled = false;
            input.placeholder = "Start typing...";
            startTime = roomData.startTime; // Use server start time
            startTest();
        }
        if (timeRemaining > 0) {
            requestAnimationFrame(updateGameState);
        }
    }
}

function startTest() {
    if (isRunning) return;
    isRunning = true;
    inputBox.focus();
    const timerInterval = setInterval(() => {
        if (!isRunning || Date.now() > roomData.endTime) {
            clearInterval(timerInterval);
            return;
        }
        updateGameState();
    }, 1000);
}

function updateWPM(accuracy = 1) {
    if (!isRunning || getServerTime() > roomData.endTime) return;

    const serverNow = getServerTime();
    const elapsed = (serverNow - startTime) / 1000 / 60; // minutes

    // Calculate raw WPM
    const rawWPM = Math.round((totalCharactersTyped / 5) / elapsed);

    // Apply accuracy penalty to WPM
    const adjustedWPM = Math.round(rawWPM * accuracy);

    // Only update database if WPM is valid
    if (adjustedWPM >= 0 && adjustedWPM < 500) {
        update(ref(db, `rooms/${roomId}/users/${currentUser.id}`), {
            name: currentUser.name,
            wpm: adjustedWPM,
            accuracy: Math.round(accuracy * 100),
            errors: wrongCharactersTyped,
            profilePic: currentUser.profilePic,
            startedAt: startTime
        });
    }
}

// Initialize array to store user's word attempts
let userAttempts = [];

function updateWordBox(words, currentInput = '') {
    const wordBox = document.getElementById('word-box');
    const currentInputElement = document.getElementById('input-box');
    const wasFocused = document.activeElement === currentInputElement;
    
    wordBox.innerHTML = words.map((word, index) => {
        if (index < wordIndex) {
            // Compare with stored attempt to determine if word was correct
            const wasCorrect = userAttempts[index] === word;
            return `<span class="${wasCorrect ? 'completed' : 'incorrect'}">${word}</span>`;
        }
        if (index === wordIndex) {
            // For current word, only show error state if needed
            const errorClass = (currentInput && currentInput.length > 0 && !word.startsWith(currentInput)) ? ' incorrect' : '';
            return `<span class="current-word${errorClass}">${word}</span>`;
        }
        return `<span>${word}</span>`;
    }).join(" ");
    
    // Keep scroll logic
    const currentWordElement = wordBox.querySelector('.current-word');
    if (currentWordElement) {
        const wordBoxRect = wordBox.getBoundingClientRect();
        const wordRect = currentWordElement.getBoundingClientRect();
        const relativeTop = wordRect.top - wordBoxRect.top;
        
        if (relativeTop > wordBoxRect.height - 40) {
            wordBox.scrollTop += relativeTop - (wordBoxRect.height / 2);
        }
    }
    
    if (wasFocused) {
        currentInputElement.focus();
    }
}

document.getElementById('input-box').addEventListener('input', function (e) {
    if (!isRunning || getServerTime() > roomData.endTime) return;
    
    const words = roomData.text.split(' ');
    const currentWord = words[wordIndex];
    const currentInput = e.target.value;

    if (currentInput.endsWith(' ')) {
        const inputWord = currentInput.trim();

        // Store the attempt
        userAttempts[wordIndex] = inputWord;

        // Count errors in the word
        let wordErrors = 0;
        for (let i = 0; i < Math.max(inputWord.length, currentWord.length); i++) {
            if (i >= inputWord.length || i >= currentWord.length || inputWord[i] !== currentWord[i]) {
                wordErrors++;
            }
        }
        wrongCharactersTyped += wordErrors;

        // Always move to next word
        wordIndex++;
        totalCharactersTyped += currentWord.length + 1; // +1 for space

        // Calculate accuracy
        const accuracy = Math.max(0, 1 - (wrongCharactersTyped / totalCharactersTyped));

        updateWordBox(words);
        updateWPM(accuracy);
        e.target.value = '';
    } else {
        // Show real-time errors for current word
        updateWordBox(words, currentInput);
    }
});

// Add user interface handling
function updateUserInterface() {
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser) {
        logoutBtn.style.display = 'block';
        if (currentUser.profilePic) {
            userAvatar.style.backgroundImage = `url(${currentUser.profilePic})`;
        } else {
            userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        }
        userAvatar.style.display = 'block';
    }
}

// Add logout functionality
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Update room.html to include user info section
document.body.insertAdjacentHTML('afterbegin', `
    <div id="user-info" class="user-info">
        <div id="user-avatar" class="avatar"></div>
        <button id="logout-btn" style="display: none;">Logout</button>
    </div>
`);

updateUserInterface();

const inputBox = document.getElementById('input-box');
const wordBox = document.getElementById('word-box');
const roomName = document.getElementById('room-name');

onValue(roomRef, (snapshot) => {
    const room = snapshot.val();
    if (!room) {
        window.location.href = 'rooms.html';
        return;
    }

    roomName.textContent = room.name;
    
    const now = Date.now();
    if (now >= room.startTime && now <= room.endTime) {
        inputBox.disabled = false;
        inputBox.placeholder = "Type here...";
        if (!wordBox.textContent) {
            wordBox.textContent = room.text || "Sample text to type...";
        }
    } else if (now < room.startTime) {
        inputBox.placeholder = "Race hasn't started yet...";
    } else {
        inputBox.placeholder = "Race has ended";
    }
});

inputBox.addEventListener('input', (e) => {
    const currentText = e.target.value;
    // Here you can add logic to check typing progress
    // and update the user's position in the race
});

inputBox.addEventListener('blur', () => {
    // Refocus input if game is running
    if (isRunning && Date.now() <= roomData.endTime) {
        setTimeout(() => inputBox.focus(), 0);
    }
});
