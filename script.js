const holes = document.querySelectorAll('.hole');
const scoreBoard = document.getElementById('score');
const timeBoard = document.getElementById('time-left');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startOverlay = document.getElementById('start-overlay');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreDisplay = document.getElementById('final-score');

let lastHole;
let timeUp = false;
let score = 0;
let time = 30;
let timerId;
let bugTimerId;

// Audio Context for synthesized sounds
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'crunch') {
        // Crunch/Pop sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'start') {
        // Start game chime
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    // Random time between 0.5s and 1s as per prompt logic roughly
    // Prompt said "pops up... for 1 second", but varying it slightly makes game feel better
    // We'll stick to mostly 1 second pace but slightly randomized for natural feel
    const time = randomTime(800, 1000); 
    const hole = randomHole(holes);
    const bug = hole.querySelector('.bug');
    
    bug.classList.remove('caught');
    bug.classList.add('up');
    
    // Auto hide after time
    setTimeout(() => {
        bug.classList.remove('up');
        if (!timeUp) peep();
    }, time);
}

function startGame() {
    playSound('start');
    scoreBoard.textContent = 0;
    timeBoard.textContent = 30;
    timeUp = false;
    score = 0;
    time = 30;
    
    // UI Updates
    startOverlay.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    
    // Start Game Loop
    peep();
    
    // Start Countdown
    timerId = setInterval(() => {
        time--;
        timeBoard.textContent = time;
        
        if (time <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    timeUp = true;
    clearInterval(timerId);
    
    // Wait a moment for last animation to finish
    setTimeout(() => {
        gameOverModal.classList.remove('hidden');
        finalScoreDisplay.textContent = score;
    }, 1000);
}

function bonk(e) {
    if(!e.isTrusted) return; // cheater!
    
    // 'this' refers to the bug element because we attached listener to it
    if(!this.classList.contains('up') || this.classList.contains('caught')) return;
    
    score++;
    this.classList.remove('up');
    this.classList.add('caught'); // Visual feedback
    scoreBoard.textContent = score;
    playSound('crunch');
    
    // Add a visual ripple or flash effect on the parent hole
    const hole = this.parentElement;
    hole.classList.add('ring-indigo-400');
    setTimeout(() => {
        hole.classList.remove('ring-indigo-400');
    }, 100);
}

// Event Listeners
holes.forEach(hole => {
    const bug = hole.querySelector('.bug');
    bug.addEventListener('click', bonk);
    // Add touch support for mobile
    bug.addEventListener('touchstart', bonk);
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);