import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

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

document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('user-id').value;
    const userData = {
        name: document.getElementById('username').value,
        id: userId,
        profilePic: document.getElementById('profile-pic').value || null
    };

    try {
        await set(ref(db, `users/${userId}`), userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        window.location.href = 'index.html'; // This page now shows room list
    } catch (error) {
        alert('Error creating user: ' + error.message);
    }
});
