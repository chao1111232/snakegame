const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }]; // Initial snake position
let direction = { x: 0, y: 0 }; // Initial direction
let food = { x: 5, y: 5 }; // Initial food position
let score = 0;
let highScore = localStorage.getItem('highScore') || 0; // Load high score
let gameOver = false;
let gameStarted = false; // Track if the game has started
let isPaused = false; // Track if the game is paused
let speed = 100; // Initial speed (ms per frame)
let foodBlink = false; // For blinking food effect
let level = 1; // Current level
let obstacles = []; // Obstacles for higher levels
let powerUp = null; // Active power-up
let powerUpTimer = 0; // Power-up duration timer
let particles = []; // Particle effects

// Background music
const backgroundMusic = new Audio('background-music.mp3'); // Add a background music file
backgroundMusic.loop = true; // Loop the music

// Sound effects
const eatSound = new Audio('eat.mp3'); // Add a sound file for eating
const gameOverSound = new Audio('game-over.mp3'); // Add a sound file for game over
const powerUpSound = new Audio('power-up.mp3'); // Add a sound file for power-ups

// Gradient background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e3c72'); // Dark blue
    gradient.addColorStop(1, '#2a5298'); // Light blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Place food randomly
function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    // Ensure food doesn't spawn on the snake or obstacles
    while (
        snake.some(segment => segment.x === food.x && segment.y === food.y) ||
        obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y)
    ) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    }
}

// Generate obstacles for higher levels
function generateObstacles() {
    obstacles = [];
    for (let i = 0; i < level * 2; i++) { // More obstacles as level increases
        obstacles.push({
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        });
    }
}

// Place a random power-up
function placePowerUp() {
    powerUp = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        type: ['speed', 'shield', 'double'][Math.floor(Math.random() * 3)] // Random type
    };

    // Ensure power-up doesn't spawn on the snake, food, or obstacles
    while (
        snake.some(segment => segment.x === powerUp.x && segment.y === powerUp.y) ||
        (food.x === powerUp.x && food.y === powerUp.y) ||
        obstacles.some(obstacle => obstacle.x === powerUp.x && obstacle.y === powerUp.y)
    ) {
        powerUp = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: ['speed', 'shield', 'double'][Math.floor(Math.random() * 3)]
        };
    }
}

// Reset the game
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 }; // Reset direction to prevent immediate collision
    score = 0;
    speed = 100; // Reset speed
    level = 1; // Reset level
    gameOver = false;
    gameStarted = false; // Reset game start state
    isPaused = false; // Reset pause state
    powerUp = null; // Reset power-up
    generateObstacles();
    placeFood();
}

// Update game state
function update() {
    if (!gameStarted || gameOver || isPaused) return;

    // Calculate new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check for collisions
    if (
        head.x < 0 || head.x >= tileCount ||
        head.y < 0 || head.y >= tileCount ||
        snake.some(segment => segment.x === head.x && segment.y === head.y) ||
        obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)
    ) {
        gameOver = true;
        gameOverSound.play(); // Play game over sound
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore); // Save high score
        }
        alert('Game Over! Score: ' + score + '\nHigh Score: ' + highScore);
        resetGame();
        return;
    }

    // Move the snake
    snake.unshift(head);

    // Check if snake eats food
    if (head.x === food.x && head.y === food.y) {
        score++;
        eatSound.play(); // Play eat sound
        placeFood();
        speed = Math.max(50, speed - 5); // Increase speed (min speed: 50ms)

        // Add particle effects
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: food.x * gridSize + gridSize / 2,
                y: food.y * gridSize + gridSize / 2,
                size: Math.random() * 3 + 1,
                color: `rgba(255, ${Math.random() * 100}, 0, 1)`,
                velocity: {
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 4
                },
                life: 30
            });
        }

        // Level up every 5 points
        if (score % 5 === 0) {
            level++;
            generateObstacles();
        }

        // Randomly place a power-up
        if (Math.random() < 0.2) { // 20% chance to spawn a power-up
            placePowerUp();
        }
    } else {
        snake.pop(); // Remove tail if no food is eaten
    }

    // Check if snake eats power-up
    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        powerUpSound.play(); // Play power-up sound
        activatePowerUp(powerUp.type);
        powerUp = null; // Remove power-up
    }

    // Update power-up timer
    if (powerUpTimer > 0) {
        powerUpTimer--;
        if (powerUpTimer === 0) {
            deactivatePowerUp();
        }
    }

    // Update particle effects
    particles.forEach((particle, index) => {
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        particle.life--;

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Activate power-up
function activatePowerUp(type) {
    switch (type) {
        case 'speed':
            speed = Math.max(30, speed - 20); // Increase speed
            powerUpTimer = 300; // 5 seconds
            break;
        case 'shield':
            // Make snake invincible (skip collision checks)
            powerUpTimer = 300; // 5 seconds
            break;
        case 'double':
            score += 2; // Double points
            break;
    }
}

// Deactivate power-up
function deactivatePowerUp() {
    speed = 100; // Reset speed
}

// Draw the game
function draw() {
    // Draw gradient background
    drawBackground();

    // Draw the snake with a glowing effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'lime';
    snake.forEach((segment, index) => {
        // Add a trail effect
        const alpha = 1 - (index / snake.length) * 0.5;
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.fillRect(
            segment.x * gridSize,
            segment.y * gridSize,
            gridSize, gridSize
        );
    });
    ctx.shadowBlur = 0; // Reset shadow

    // Draw the food with a glowing effect
    if (foodBlink) {
        ctx.fillStyle = 'red';
    } else {
        ctx.fillStyle = 'orange';
    }
    foodBlink = !foodBlink; // Toggle blink state
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'red';
    ctx.fillRect(
        food.x * gridSize,
        food.y * gridSize,
        gridSize, gridSize
    );
    ctx.shadowBlur = 0; // Reset shadow

    // Draw obstacles with a shadow effect
    ctx.fillStyle = 'gray';
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'black';
    obstacles.forEach(obstacle => {
        ctx.fillRect(
            obstacle.x * gridSize,
            obstacle.y * gridSize,
            gridSize, gridSize
        );
    });
    ctx.shadowBlur = 0; // Reset shadow

    // Draw power-up with a glowing effect
    if (powerUp) {
        ctx.fillStyle = 'yellow';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'yellow';
        ctx.fillRect(
            powerUp.x * gridSize,
            powerUp.y * gridSize,
            gridSize, gridSize
        );
        ctx.shadowBlur = 0; // Reset shadow
    }

    // Draw particle effects
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Display the score, high score, and level with a custom font
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Press Start 2P", cursive'; // Use a retro font
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 60);
    ctx.fillText('Level: ' + level, 10, 90);

    // Display start screen
    if (!gameStarted) {
        ctx.fillStyle = '#fff';
        ctx.font = '30px "Press Start 2P", cursive';
        ctx.fillText('Press SPACE to Start', canvas.width / 2 - 150, canvas.height / 2);
    }

    // Display pause screen
    if (isPaused) {
        ctx.fillStyle = '#fff';
        ctx.font = '30px "Press Start 2P", cursive';
        ctx.fillText('Paused', canvas.width / 2 - 60, canvas.height / 2);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, speed); // Adjust speed dynamically
}

// Handle keyboard input
document.addEventListener('keydown', event => {
    console.log('Key pressed:', event.key); // Debug: log the pressed key
    if (!gameStarted && event.key === ' ') { // Start the game on SPACE
        gameStarted = true;
        direction = { x: 1, y: 0 }; // Set initial direction to right
        backgroundMusic.play(); // Start background music
    } else if (gameOver && event.key === 'r') { // Restart the game on R
        resetGame();
    } else if (gameStarted && !gameOver) { // Control the snake
        switch (event.key) {
            case 'ArrowUp':
                if (direction.y === 0) direction = { x: 0, y: -1 }; // Move up
                break;
            case 'ArrowDown':
                if (direction.y === 0) direction = { x: 0, y: 1 }; // Move down
                break;
            case 'ArrowLeft':
                if (direction.x === 0) direction = { x: -1, y: 0 }; // Move left
                break;
            case 'ArrowRight':
                if (direction.x === 0) direction = { x: 1, y: 0 }; // Move right
                break;
            case 'p': // Pause the game on P
                isPaused = !isPaused;
                if (isPaused) {
                    backgroundMusic.pause(); // Pause music
                } else {
                    backgroundMusic.play(); // Resume music
                }
                break;
        }
        console.log('New direction:', direction); // Debug: log the new direction
    }
});

// Initialize the game
resetGame();
gameLoop();