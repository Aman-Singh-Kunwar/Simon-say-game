// Simon Says Game
var gameState = {
    sequence: [],
    playerSequence: [],
    level: 1,
    score: 0,
    bestScore: 0,
    isPlaying: false,
    isShowingSequence: false,
    currentStep: 0,
    difficulty: 'medium',
    colors: ['red', 'blue', 'green', 'yellow']
};

var elements = {};

function initGame() {
    // Get best score from localStorage
    try {
        gameState.bestScore = parseInt(localStorage.getItem('simonBestScore')) || 0;
    } catch (e) {
        gameState.bestScore = 0;
    }
    
    initializeElements();
    bindEvents();
    updateDisplay();
}

function initializeElements() {
    elements.startBtn = document.getElementById('start-btn');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.scoreEl = document.getElementById('score');
    elements.levelEl = document.getElementById('level');
    elements.bestScoreEl = document.getElementById('best-score');
    elements.messageEl = document.getElementById('message');
    elements.difficultySelect = document.getElementById('difficulty-select');
    elements.gameButtons = document.querySelectorAll('.game-button');
}

function playSound(color) {
    try {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var frequencies = { red: 220, blue: 277, green: 330, yellow: 415 };
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequencies[color], audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function bindEvents() {
    elements.startBtn.addEventListener('click', startGame);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.difficultySelect.addEventListener('change', function(e) {
        gameState.difficulty = e.target.value;
    });

    for (var i = 0; i < elements.gameButtons.length; i++) {
        elements.gameButtons[i].addEventListener('click', function(e) {
            if (!gameState.isPlaying || gameState.isShowingSequence) return;
            handleButtonClick(e.target.dataset.color);
        });
    }
}

function startGame() {
    gameState.isPlaying = true;
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    gameState.score = 0;
    gameState.currentStep = 0;
    
    elements.startBtn.disabled = true;
    elements.difficultySelect.disabled = true;
    
    updateDisplay();
    nextRound();
}

function resetGame() {
    gameState.isPlaying = false;
    gameState.isShowingSequence = false;
    gameState.sequence = [];
    gameState.playerSequence = [];
    gameState.level = 1;
    gameState.score = 0;
    gameState.currentStep = 0;
    
    elements.startBtn.disabled = false;
    elements.difficultySelect.disabled = false;
    
    elements.messageEl.textContent = "Press Start to begin!";
    updateDisplay();
    clearButtonStates();
}

function nextRound() {
    gameState.playerSequence = [];
    gameState.currentStep = 0;
    addToSequence();
    showSequence();
}

function addToSequence() {
    var randomColor = gameState.colors[Math.floor(Math.random() * gameState.colors.length)];
    gameState.sequence.push(randomColor);
}

function showSequence() {
    gameState.isShowingSequence = true;
    elements.messageEl.textContent = "Watch the sequence...";
    
    var delays = {
        easy: 1000,
        medium: 700,
        hard: 400
    };
    
    var delay = delays[gameState.difficulty];
    var i = 0;
    
    function showNext() {
        if (i < gameState.sequence.length) {
            highlightButton(gameState.sequence[i]);
            i++;
            setTimeout(showNext, delay);
        } else {
            gameState.isShowingSequence = false;
            elements.messageEl.textContent = "Your turn! Repeat the sequence.";
        }
    }
    
    setTimeout(showNext, delay);
}

function highlightButton(color) {
    var button = document.getElementById(color);
    button.classList.add('active');
    playSound(color);
    
    setTimeout(function() {
        button.classList.remove('active');
    }, 300);
}

function handleButtonClick(color) {
    gameState.playerSequence.push(color);
    highlightButton(color);
    
    if (gameState.playerSequence[gameState.currentStep] !== gameState.sequence[gameState.currentStep]) {
        gameOver();
        return;
    }
    
    gameState.currentStep++;
    
    if (gameState.currentStep === gameState.sequence.length) {
        gameState.score += gameState.level * 10;
        gameState.level++;
        updateDisplay();
        elements.messageEl.textContent = 'Level ' + (gameState.level - 1) + ' complete! Get ready...';
        
        setTimeout(function() {
            nextRound();
        }, 1500);
    }
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.isShowingSequence = false;
    
    // Update best score
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        try {
            localStorage.setItem('simonBestScore', gameState.bestScore.toString());
        } catch (e) {
            console.log('Cannot save best score');
        }
        elements.messageEl.textContent = 'Game Over! New best score: ' + gameState.score;
    } else {
        elements.messageEl.textContent = 'Game Over! Final score: ' + gameState.score;
    }
    
    // Show wrong button effect
    for (var i = 0; i < elements.gameButtons.length; i++) {
        if (elements.gameButtons[i].dataset.color === gameState.playerSequence[gameState.playerSequence.length - 1]) {
            elements.gameButtons[i].classList.add('wrong');
            setTimeout(function(btn) {
                return function() {
                    btn.classList.remove('wrong');
                };
            }(elements.gameButtons[i]), 500);
        }
    }
    
    // Play error sound
    playErrorSound();
    
    elements.startBtn.disabled = false;
    elements.difficultySelect.disabled = false;
    updateDisplay();
}

function playErrorSound() {
    try {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function updateDisplay() {
    elements.scoreEl.textContent = gameState.score;
    elements.levelEl.textContent = gameState.level;
    elements.bestScoreEl.textContent = gameState.bestScore;
}

function clearButtonStates() {
    for (var i = 0; i < elements.gameButtons.length; i++) {
        elements.gameButtons[i].classList.remove('active', 'wrong');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);