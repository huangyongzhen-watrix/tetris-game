const canvas = document.querySelector("#board");
const context = canvas.getContext("2d");
const nextCanvas = document.querySelector("#next");
const nextContext = nextCanvas.getContext("2d");

const scoreNode = document.querySelector("#score");
const linesNode = document.querySelector("#lines");
const levelNode = document.querySelector("#level");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");

const cols = 10;
const rows = 20;
const block = 30;

const colors = {
  I: "#70c7d9",
  J: "#7f93c9",
  L: "#d9a35f",
  O: "#d8ca64",
  S: "#7bc98c",
  T: "#aa87c8",
  Z: "#d76d6d",
};

const shapes = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

let board;
let piece;
let nextPiece;
let score;
let lines;
let level;
let dropCounter;
let dropInterval;
let lastTime;
let isPaused;
let isGameOver;
let animationId;
let bag = [];

function createBoard() {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

function refillBag() {
  bag = Object.keys(shapes).sort(() => Math.random() - 0.5);
}

function randomPiece() {
  if (bag.length === 0) refillBag();
  const type = bag.pop();
  const matrix = shapes[type].map((row) => [...row]);

  return {
    type,
    matrix,
    x: Math.floor((cols - matrix[0].length) / 2),
    y: 0,
  };
}

function resetGame() {
  board = createBoard();
  piece = randomPiece();
  nextPiece = randomPiece();
  score = 0;
  lines = 0;
  level = 1;
  dropCounter = 0;
  dropInterval = 850;
  lastTime = 0;
  isPaused = false;
  isGameOver = false;
  overlay.hidden = true;
  updateStats();
  draw();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(update);
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (!isPaused && !isGameOver) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      softDrop();
    }
  }

  draw();
  animationId = requestAnimationFrame(update);
}

function drawCell(ctx, x, y, size, color) {
  const inset = Math.max(1, size * 0.07);
  const left = x * size + inset;
  const top = y * size + inset;
  const width = size - inset * 2;
  const height = size - inset * 2;
  const gradient = ctx.createLinearGradient(left, top, left, top + height);

  gradient.addColorStop(0, "rgba(255,255,255,0.82)");
  gradient.addColorStop(0.14, color);
  gradient.addColorStop(1, color);

  ctx.fillStyle = gradient;
  ctx.fillRect(left, top, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(left, top, width, Math.max(2, size * 0.1));
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
  ctx.strokeStyle = "rgba(0,0,0,0.42)";
  ctx.strokeRect(left + 1.5, top + 1.5, width - 3, height - 3);
}

function drawGrid() {
  context.strokeStyle = "rgba(184,206,206,0.045)";
  context.lineWidth = 1;

  for (let x = 1; x < cols; x += 1) {
    context.beginPath();
    context.moveTo(x * block + 0.5, 0);
    context.lineTo(x * block + 0.5, canvas.height);
    context.stroke();
  }

  for (let y = 1; y < rows; y += 1) {
    context.beginPath();
    context.moveTo(0, y * block + 0.5);
    context.lineTo(canvas.width, y * block + 0.5);
    context.stroke();
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#091014";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawMatrix(board, { x: 0, y: 0 }, context, block);
  drawGhost();
  drawMatrix(piece.matrix, piece, context, block, colors[piece.type]);
  drawNext();
}

function drawMatrix(matrix, offset, ctx, size, forcedColor) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      const color = forcedColor || colors[value];
      drawCell(ctx, x + offset.x, y + offset.y, size, color);
    });
  });
}

function drawGhost() {
  const ghost = {
    ...piece,
    matrix: piece.matrix,
    y: piece.y,
  };

  while (!collides(board, ghost)) {
    ghost.y += 1;
  }
  ghost.y -= 1;

  context.globalAlpha = 0.12;
  drawMatrix(ghost.matrix, ghost, context, block, colors[piece.type]);
  context.globalAlpha = 1;
}

function drawNext() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextContext.fillStyle = "#091014";
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  const size = 24;
  const matrix = nextPiece.matrix;
  const offset = {
    x: Math.floor((nextCanvas.width / size - matrix[0].length) / 2),
    y: Math.floor((nextCanvas.height / size - matrix.length) / 2),
  };

  drawMatrix(matrix, offset, nextContext, size, colors[nextPiece.type]);
}

function collides(arena, currentPiece) {
  const matrix = currentPiece.matrix;
  const offset = currentPiece;

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) continue;

      const boardX = x + offset.x;
      const boardY = y + offset.y;

      if (boardX < 0 || boardX >= cols || boardY >= rows) return true;
      if (boardY >= 0 && arena[boardY][boardX]) return true;
    }
  }

  return false;
}

function merge() {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[y + piece.y][x + piece.x] = piece.type;
      }
    });
  });
}

function rotate(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function rotatePiece() {
  if (isPaused || isGameOver) return;

  const previousMatrix = piece.matrix;
  const previousX = piece.x;
  piece.matrix = rotate(piece.matrix);

  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    piece.x = previousX + kick;
    if (!collides(board, piece)) return;
  }

  piece.x = previousX;
  piece.matrix = previousMatrix;
}

function movePiece(direction) {
  if (isPaused || isGameOver) return;
  piece.x += direction;
  if (collides(board, piece)) {
    piece.x -= direction;
  }
}

function softDrop() {
  if (isPaused || isGameOver) return;

  piece.y += 1;
  if (collides(board, piece)) {
    piece.y -= 1;
    lockPiece();
  }
  dropCounter = 0;
}

function manualSoftDrop() {
  if (isPaused || isGameOver) return;

  const previousY = piece.y;
  softDrop();
  if (!isGameOver && piece.y > previousY) {
    score += 1;
    updateStats();
  }
}

function hardDrop() {
  if (isPaused || isGameOver) return;

  let distance = 0;
  while (!collides(board, piece)) {
    piece.y += 1;
    distance += 1;
  }
  piece.y -= 1;
  score += Math.max(0, distance - 1) * 2;
  lockPiece();
}

function lockPiece() {
  merge();
  clearLines();
  piece = nextPiece;
  nextPiece = randomPiece();

  if (collides(board, piece)) {
    gameOver();
  }
}

function clearLines() {
  let cleared = 0;

  outer: for (let y = rows - 1; y >= 0; y -= 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!board[y][x]) continue outer;
    }

    board.splice(y, 1);
    board.unshift(Array(cols).fill(""));
    cleared += 1;
    y += 1;
  }

  if (cleared > 0) {
    const lineScores = [0, 100, 300, 500, 800];
    score += lineScores[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(120, 850 - (level - 1) * 70);
    updateStats();
  }
}

function updateStats() {
  scoreNode.textContent = score;
  linesNode.textContent = lines;
  levelNode.textContent = level;
}

function gameOver() {
  isGameOver = true;
  overlayTitle.textContent = "游戏结束";
  overlayText.textContent = "按 Enter 或点击重新开始";
  overlay.hidden = false;
  updateStats();
}

function togglePause() {
  if (isGameOver) return;
  isPaused = !isPaused;
  overlayTitle.textContent = "暂停";
  overlayText.textContent = "按 P 继续";
  overlay.hidden = !isPaused;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    movePiece(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    movePiece(1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    manualSoftDrop();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    rotatePiece();
  } else if (event.code === "Space") {
    event.preventDefault();
    hardDrop();
    updateStats();
  } else if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
  } else if (event.key === "Enter" && isGameOver) {
    event.preventDefault();
    resetGame();
  }
});

document.querySelector("#restartBtn").addEventListener("click", resetGame);

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "left") movePiece(-1);
    if (action === "right") movePiece(1);
    if (action === "rotate") rotatePiece();
    if (action === "down") {
      manualSoftDrop();
    }
    if (action === "drop") {
      hardDrop();
      updateStats();
    }
    if (action === "pause") togglePause();
  });
});

resetGame();
