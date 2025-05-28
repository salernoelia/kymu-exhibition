<template>
  <div class="w-full h-full relative">
    <MediapipeGame ref="mediapipeRef" />

    <!-- Video feed overlay -->
    <div class="absolute top-20 right-4 w-48 h-36 bg-black/20 rounded-lg overflow-hidden border-2 border-white/30">
      <video ref="videoFeed" class="w-full h-full object-cover opacity-30" autoplay muted playsinline />
    </div>

    <div class="absolute inset-0 pt-20">
      <P5Wrapper :sketch="sketch" />
    </div>
  </div>
</template>

<script setup lang="ts">
import p5 from "p5"

const GAME_DURATION = 1800;
const SPEED_INCREASE_INTERVAL = 400;
const INITIAL_SPEED_MULTIPLIER = 1;
const SPEED_INCREMENT = 0.3;
const BUCKET_WIDTH = 200;

const CANVAS_WIDTH = ref(800);
const CANVAS_HEIGHT = ref(600);
const HAND_SIZE = 80;
const MAGNETIC_RADIUS = 100;

const speeds = [1.5, 1.8, 2, 2.1, 2.3];
const obstacleDiameters = [30, 50, 75];
const emit = defineEmits<{
  gameStarted: [data: { timestamp: number }]
  gameCompleted: [results: {
    score: number;
    highScore: number;
    duration: number;
    accuracy: number;
    handsDetected: boolean;
  }]
  scoreChanged: [score: number]
}>()

let gameState = "playing";
let obstacles: Obstacle[] = [];
let obstacle_spawn_rate = 120;
let bucketImage: p5.Image;
let bucketX: number, bucketY: number, bucketWidth: number, bucketHeight: number;
let score = 0;
let highScore = 0;
let offsetX: number, offsetY: number;
let speedMultiplier = INITIAL_SPEED_MULTIPLIER;
let gameStartTime = 0;
let totalObstacles = 0;
let successfulCatches = 0;

let leftHandX = 0, leftHandY = 0, leftHandVisible = false;
let rightHandX = 0, rightHandY = 0, rightHandVisible = false;
let activeHand: 'left' | 'right' | null = null;

const mediapipeRef = ref<{
  leftHand: { x: number, y: number, visible: boolean };
  rightHand: { x: number, y: number, visible: boolean };
  isPersonVisible: boolean;
} | null>(null);

const videoFeed = ref<HTMLVideoElement | null>(null);


const updateCanvasSize = () => {
  if (typeof window !== 'undefined') {
    CANVAS_WIDTH.value = window.innerWidth;
    CANVAS_HEIGHT.value = window.innerHeight - 80;
  }
};

onMounted(() => {
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);


  if (videoFeed.value) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoFeed.value) {
          videoFeed.value.srcObject = stream;
        }
      })
      .catch(err => console.log('Video feed error:', err));
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateCanvasSize);
  }
});

watch(() => mediapipeRef.value?.leftHand, (newPos) => {
  if (newPos) {

    rightHandX = newPos.x * CANVAS_WIDTH.value;
    rightHandY = newPos.y * CANVAS_HEIGHT.value;
    rightHandVisible = newPos.visible;
  }
}, { deep: true });

watch(() => mediapipeRef.value?.rightHand, (newPos) => {
  if (newPos) {

    leftHandX = newPos.x * CANVAS_WIDTH.value;
    leftHandY = newPos.y * CANVAS_HEIGHT.value;
    leftHandVisible = newPos.visible;
  }
}, { deep: true });

class Obstacle {
  diameter: number;
  radius: number;
  horizontalPosition: number;
  y: number;
  velocity: number;
  grabbed: boolean;

  constructor(diameter: number, p: p5) {
    this.diameter = diameter;
    this.radius = diameter * 0.5;
    this.horizontalPosition = p.random(this.radius, p.width - this.radius);
    this.y = 0;
    this.velocity = speeds[p.int(p.random(speeds.length))] * speedMultiplier;
    this.grabbed = false;
  }

  update(p: p5) {
    if (!this.grabbed) {
      this.y += this.velocity;
    } else {
      if (activeHand === 'left' && leftHandVisible) {
        this.horizontalPosition = leftHandX + offsetX;
        this.y = leftHandY + offsetY;
      } else if (activeHand === 'right' && rightHandVisible) {
        this.horizontalPosition = rightHandX + offsetX;
        this.y = rightHandY + offsetY;
      }
    }
  }

  show(p: p5) {
    p.fill(238, 88, 38);
    p.ellipse(this.horizontalPosition, this.y, this.diameter);
  }

  isHandOver(handX: number, handY: number) {
    const dx = handX - this.horizontalPosition;
    const dy = handY - this.y;
    return dx * dx + dy * dy < (MAGNETIC_RADIUS * MAGNETIC_RADIUS);
  }

  isInBucket() {
    return this.horizontalPosition > bucketX - bucketWidth * 0.5 &&
      this.horizontalPosition < bucketX + bucketWidth * 0.5 &&
      this.y > bucketY - bucketHeight * 0.5 &&
      this.y < bucketY + bucketHeight * 0.5;
  }
}

const sketch = (p: p5) => {
  p.preload = () => {
    bucketImage = p.loadImage('/images/pandas/panda_wink.png');
  }

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH.value, CANVAS_HEIGHT.value);
    p.frameRate(60);
    bucketX = p.width * 0.5;
    bucketY = p.height * 0.5;
    bucketWidth = BUCKET_WIDTH;
    bucketHeight = bucketWidth / (bucketImage.width / bucketImage.height);

    if (typeof window !== 'undefined') {
      highScore = parseInt(localStorage.getItem('feedPandaHighScore') || '0');
    }

    gameStartTime = Date.now();
    emit('gameStarted', { timestamp: gameStartTime });
  }

  p.draw = () => {
    p.background(240);

    if (p.width !== CANVAS_WIDTH.value || p.height !== CANVAS_HEIGHT.value) {
      p.resizeCanvas(CANVAS_WIDTH.value, CANVAS_HEIGHT.value);
      bucketX = p.width * 0.5;
      bucketY = p.height * 0.5;
    }

    if (gameState === "playing") {
      updateGame(p);
      drawGame(p);
    } else if (gameState === "gameOver") {
      drawGameOver(p);
    }
  }

  p.keyPressed = () => {
    if (gameState === "gameOver" && (p.key === 'r' || p.key === 'R')) {
      restartGame();
    }
  }

  function updateGame(p: p5) {
    if (p.frameCount >= GAME_DURATION) {
      endGame();
      return;
    }

    if (p.frameCount % SPEED_INCREASE_INTERVAL === 0) {
      speedMultiplier += SPEED_INCREMENT;
      obstacle_spawn_rate = Math.round(obstacle_spawn_rate * 0.85);
    }

    if (p.frameCount % obstacle_spawn_rate === 0) {
      obstacles.push(new Obstacle(obstacleDiameters[p.int(p.random(obstacleDiameters.length))], p));
      totalObstacles++;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];

      if (!o.grabbed) {
        if (leftHandVisible && o.isHandOver(leftHandX, leftHandY)) {
          offsetX = o.horizontalPosition - leftHandX;
          offsetY = o.y - leftHandY;
          o.grabbed = true;
          activeHand = 'left';
        } else if (rightHandVisible && o.isHandOver(rightHandX, rightHandY)) {
          offsetX = o.horizontalPosition - rightHandX;
          offsetY = o.y - rightHandY;
          o.grabbed = true;
          activeHand = 'right';
        }
      }

      o.update(p);

      if (o.grabbed && o.isInBucket()) {
        obstacles.splice(i, 1);
        score++;
        successfulCatches++;
        activeHand = null;
        emit('scoreChanged', score);
      } else if (o.y > p.height) {
        obstacles.splice(i, 1);
        if (o.grabbed) activeHand = null;
        // Removed penalty: score -= 2;
        emit('scoreChanged', score);
      }
    }
  }

  function drawGame(p: p5) {
    p.noStroke();
    p.imageMode(p.CENTER);
    p.image(bucketImage, bucketX, bucketY, bucketWidth, bucketHeight);

    for (const obstacle of obstacles) {
      obstacle.show(p);
    }

    // Draw magnetic field around hands
    if (leftHandVisible) {
      // Magnetic field
      p.fill(100, 200, 100, 30);
      p.noStroke();
      p.ellipse(leftHandX, leftHandY, MAGNETIC_RADIUS * 2, MAGNETIC_RADIUS * 2);

      // Hand indicator
      p.fill(100, 200, 100, 150);
      p.stroke(100, 200, 100);
      p.strokeWeight(3);
      p.ellipse(leftHandX, leftHandY, HAND_SIZE, HAND_SIZE);
      p.noStroke();
      p.fill(255);
      p.textAlign(p.CENTER);
      p.textSize(16);
      p.text("L", leftHandX, leftHandY + 6);
    }

    if (rightHandVisible) {
      // Magnetic 
      p.fill(200, 100, 100, 30);
      p.noStroke();
      p.ellipse(rightHandX, rightHandY, MAGNETIC_RADIUS * 2, MAGNETIC_RADIUS * 2);

      // Hand 
      p.fill(200, 100, 100, 150);
      p.stroke(200, 100, 100);
      p.strokeWeight(3);
      p.ellipse(rightHandX, rightHandY, HAND_SIZE, HAND_SIZE);
      p.noStroke();
      p.fill(255);
      p.textAlign(p.CENTER);
      p.textSize(16);
      p.text("R", rightHandX, rightHandY + 6);
    }

    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(24);
    p.text("Score: " + score, bucketX, bucketY + bucketHeight * 0.5 + 30);

    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text("Time: " + (20 - p.int(p.frameCount / 60)), 20, 30);
    p.text("Speed: " + speedMultiplier.toFixed(1) + "x", 20, 50);
    p.text("Hands: " + (leftHandVisible ? "L" : "") + (rightHandVisible ? "R" : ""), 20, 70);
  }

  function drawGameOver(p: p5) {
    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.text("Game Over!", p.width * 0.5, p.height * 0.4);

    p.textSize(32);
    p.text("Final Score: " + score, p.width * 0.5, p.height * 0.5);
    p.text("High Score: " + highScore, p.width * 0.5, p.height * 0.55);

    p.textSize(20);
    p.text("Press R to restart", p.width * 0.5, p.height * 0.7);
  }

  function endGame() {
    gameState = "gameOver";
    const gameDuration = Date.now() - gameStartTime;
    const accuracy = totalObstacles > 0 ? Math.round((successfulCatches / totalObstacles) * 100) : 0;

    if (score > highScore) {
      highScore = score;
      if (typeof window !== 'undefined') {
        localStorage.setItem('feedPandaHighScore', highScore.toString());
      }
    }

    emit('gameCompleted', {
      score,
      highScore,
      duration: gameDuration,
      accuracy,
      handsDetected: leftHandVisible || rightHandVisible
    });
  }

  function restartGame() {
    gameState = "playing";
    obstacles = [];
    score = 0;
    totalObstacles = 0;
    successfulCatches = 0;
    speedMultiplier = INITIAL_SPEED_MULTIPLIER;
    activeHand = null;
    gameStartTime = Date.now();
    emit('gameStarted', { timestamp: gameStartTime });
  }
}

defineExpose({
  restartGame: () => {
    gameState = "playing";
    obstacles = [];
    score = 0;
    totalObstacles = 0;
    successfulCatches = 0;
    speedMultiplier = INITIAL_SPEED_MULTIPLIER;
    activeHand = null;
  },
  getCurrentScore: () => score,
  getGameState: () => gameState
});
</script>

<style scoped></style>