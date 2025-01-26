const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size dynamically
canvas.width = Math.min(window.innerWidth * 0.9, 400);
canvas.height = canvas.width;

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let direction = { x: 0, y: 0 };
let score = 0;

// Touch control variables
let touchX = 0;
let touchY = 0;

// Game loop
function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

// Update game state
function update() {
    // Move snake
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check for wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        resetGame();
        return;
    }

    // Check for self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        resetGame();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        placeFood();
    } else {
        snake.pop();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = 'lime';
    snake.forEach(segment => ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize));

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

// Place food randomly
function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
}

// Reset game
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    score = 0;
    placeFood();
}

// Touch-and-move controls
canvas.addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevent default touch behavior
    const touch = event.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
});

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault(); // Prevent default touch behavior
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchX;
    const deltaY = touch.clientY - touchY;

    // Determine direction based on touch movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal movement
        if (deltaX > 0 && direction.x === 0) {
            direction = { x: 1, y: 0 }; // Right
        } else if (deltaX < 0 && direction.x === 0) {
            direction = { x: -1, y: 0 }; // Left
        }
    } else {
        // Vertical movement
        if (deltaY > 0 && direction.y === 0) {
            direction = { x: 0, y: 1 }; // Down
        } else if (deltaY < 0 && direction.y === 0) {
            direction = { x: 0, y: -1 }; // Up
        }
    }

    // Update touch position
    touchX = touch.clientX;
    touchY = touch.clientY;
});

// Start game
placeFood();
gameLoop();
