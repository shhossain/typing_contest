import { WordGenerator } from './wordGenerator.js';

const wordGenerator = new WordGenerator();
await wordGenerator.initialize();

let isRunning = false;
let startTime;
let wordIndex = 0;
let currentText = '';
let totalCharacters = 0;
let wrongCharacters = 0;
let timerInterval;
let userAttempts = [];

const elements = {
    timer: document.getElementById('timer'),
    wordBox: document.getElementById('word-box'),
    inputBox: document.getElementById('input-box'),
    generateBtn: document.getElementById('generate-btn'),
    retryBtn: document.getElementById('retry-btn'),
    resultText: document.getElementById('result-text'),
    stats: document.getElementById('stats'),
    wpmStat: document.getElementById('wpm-stat'),
    accuracyStat: document.getElementById('accuracy-stat'),
    errorStat: document.getElementById('error-stat')
};

function getSettings() {
    return {
        duration: parseInt(document.getElementById('time-select').value),
        minLength: parseInt(document.getElementById('min-length').value),
        maxLength: parseInt(document.getElementById('max-length').value),
        wordCount: parseInt(document.getElementById('word-count').value),
        random: document.getElementById('random-order').checked
    };
}

function generateText() {
    const settings = getSettings();
    currentText = wordGenerator.generateText(settings);
    wordIndex = 0;
    totalCharacters = 0;
    wrongCharacters = 0;
    userAttempts = [];
    updateWordBox(currentText.split(' '), false);
    resetUI();
    elements.inputBox.focus();
}

function resetUI() {
    isRunning = false;
    elements.inputBox.value = '';
    elements.inputBox.disabled = false;
    elements.timer.textContent = getSettings().duration;
    elements.resultText.style.display = 'none';
    elements.stats.style.display = 'none';
    elements.retryBtn.style.display = 'none';
    elements.wordBox.scrollTop = 0;
    clearInterval(timerInterval);

    // Reset statistics
    wordIndex = 0;
    totalCharacters = 0;
    wrongCharacters = 0;
    userAttempts = [];
}

function updateWordBox(words, currentInput = '') {
    elements.wordBox.innerHTML = words.map((word, index) => {
        if (index < wordIndex) {
            const wasCorrect = userAttempts[index] === word;
            return `<span class="${wasCorrect ? 'completed' : 'incorrect'}">${word}</span>`;
        }
        if (index === wordIndex) {
            const errorClass = (currentInput && currentInput.length > 0 && !word.startsWith(currentInput)) ? ' incorrect' : '';
            return `<span class="current-word${errorClass}">${word}</span>`;
        }
        return `<span>${word}</span>`;
    }).join(' ');

    // Add scrolling logic
    const currentWordElement = elements.wordBox.querySelector('.current-word');
    if (currentWordElement) {
        const wordBoxRect = elements.wordBox.getBoundingClientRect();
        const wordRect = currentWordElement.getBoundingClientRect();
        const relativeTop = wordRect.top - wordBoxRect.top;

        if (relativeTop > wordBoxRect.height - 40) {
            elements.wordBox.scrollTop += relativeTop - (wordBoxRect.height / 2);
        }
    }
}

function calculateStats() {
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    const totalWords = totalCharacters / 5;
    const wpm = Math.round(totalWords / timeElapsed);
    const accuracy = Math.round(((totalCharacters - wrongCharacters) / totalCharacters) * 100) || 0;

    elements.wpmStat.textContent = wpm;
    elements.accuracyStat.textContent = `${accuracy}%`;
    elements.errorStat.textContent = wrongCharacters;
    elements.stats.style.display = 'flex';

    return { wpm, accuracy };
}

function endTest() {
    isRunning = false;
    elements.inputBox.disabled = true;
    clearInterval(timerInterval);

    const stats = calculateStats();
    elements.resultText.textContent = `Test completed! WPM: ${stats.wpm} | Accuracy: ${stats.accuracy}%`;
    elements.resultText.style.display = 'block';
    elements.retryBtn.style.display = 'block';
}

elements.inputBox.addEventListener('input', function (e) {
    if (!isRunning) {
        startTest();
    }

    const words = currentText.split(' ');
    const currentWord = words[wordIndex];
    const currentInput = e.target.value;

    if (currentInput.endsWith(' ')) {
        const inputWord = currentInput.trim();

        userAttempts[wordIndex] = inputWord;

        let wordErrors = 0;
        for (let i = 0; i < Math.max(inputWord.length, currentWord.length); i++) {
            if (i >= inputWord.length || i >= currentWord.length || inputWord[i] !== currentWord[i]) {
                wordErrors++;
            }
        }
        wrongCharacters += wordErrors;

        wordIndex++;
        totalCharacters += currentWord.length + 1;

        updateWordBox(words);
        calculateStats();
        e.target.value = '';
    } else {
        updateWordBox(words, currentInput);
    }
});

function startTest() {
    isRunning = true;
    startTime = Date.now();
    const duration = getSettings().duration;

    timerInterval = setInterval(() => {
        const timeLeft = Math.max(0, duration - Math.floor((Date.now() - startTime) / 1000));
        elements.timer.textContent = timeLeft;

        if (timeLeft === 0) {
            endTest();
        }
    }, 1000);
}

elements.generateBtn.addEventListener('click', generateText);
elements.retryBtn.addEventListener('click', () => {
    resetUI();
    updateWordBox(currentText.split(' '), false);
    elements.inputBox.focus();
});

// Initialize
generateText();
document.addEventListener('DOMContentLoaded', () => {
    elements.inputBox.focus();
});
