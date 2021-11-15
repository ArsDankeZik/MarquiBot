const words = ['manzana', 'pepino'];
let chances = 10;
let selectedWord = pickRandom(words); 
let wrong = 0;
let wrongChoices = [];

function adivinar(char){
    if(indexAll(selectedWord, char).length == 0 && !wrongChoices.includes(char)) {
        wrongChoices.push(char);
        wrong++;
    }
}

function pickRandom(arr) {
    const min = 0;
    const max = arr ? arr.length-1 : 0;
    const rand = () => (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;
    
    return arr[rand()];
}

function indexAll(word, char){
    return word.split('').map((c, i) => c === char ? i : -1).filter(v => { if(v >= 0) return v; });
}