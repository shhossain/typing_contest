const WORD_LIST_URL = "https://raw.githubusercontent.com/first20hours/google-10000-english/refs/heads/master/google-10000-english-no-swears.txt";
export class WordGenerator {
    constructor() {
        this.words = [];
    }

    async initialize() {
        const response = await fetch(WORD_LIST_URL);
        const text = await response.text();
        this.words = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
    }

    generateText({ minLength = 0, maxLength = Infinity, wordCount = 50, random = true }) {
        let filteredWords = this.words.filter(word =>
            word.length >= minLength && word.length <= maxLength
        );

        if (random) {
            filteredWords = filteredWords.sort(() => Math.random() - 0.5);
        }

        return filteredWords.slice(0, wordCount).join(' ');
    }
}
