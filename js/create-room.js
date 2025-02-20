import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";
import { WordGenerator } from './wordGenerator.js';

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
const wordGenerator = new WordGenerator();

// Initialize word generator
wordGenerator.initialize().catch(console.error);

// Handle text source selection
document.getElementById('text-source').addEventListener('change', (e) => {
    const generatorOptions = document.getElementById('generator-options');
    generatorOptions.style.display = e.target.value === 'generated' ? 'block' : 'none';
});

// Handle generate button click
document.getElementById('generate-btn').addEventListener('click', () => {
    const minLength = parseInt(document.getElementById('min-length').value);
    const maxLength = parseInt(document.getElementById('max-length').value);
    const wordCount = parseInt(document.getElementById('word-count').value);
    const random = document.getElementById('random-order').checked;

    const generatedText = wordGenerator.generateText({
        minLength,
        maxLength,
        wordCount,
        random
    });

    document.getElementById('room-text').value = generatedText;
});

// Auto calculate word count based on time difference
function updateWordCount() {
    const startTime = new Date(document.getElementById('start-time').value).getTime();
    const endTime = new Date(document.getElementById('end-time').value).getTime();

    if (startTime && endTime && endTime > startTime) {
        const diffMinutes = Math.round((endTime - startTime) / (1000 * 60));
        const wordCount = diffMinutes * 200;
        document.getElementById('word-count').value = Math.min(Math.max(wordCount, 10), 500);
    }
}

document.getElementById('start-time').addEventListener('change', updateWordCount);
document.getElementById('end-time').addEventListener('change', updateWordCount);

document.getElementById('room-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const roomName = document.getElementById('room-name').value;
    const roomData = {
        name: roomName,
        startTime: new Date(document.getElementById('start-time').value).getTime(),
        endTime: new Date(document.getElementById('end-time').value).getTime(),
        text: document.getElementById('room-text').value,
        users: {}
    };

    try {
        const roomId = Date.now().toString();
        await set(ref(db, `rooms/${roomId}`), roomData);
        window.location.href = `room.html?id=${roomId}`;
    } catch (error) {
        alert('Error creating room: ' + error.message);
    }
});
