<template>
  <div class="w-full h-full relative">
    <!-- MediaPipe tracking component -->
    <MediapipeGame ref="mediapipeRef" />
    
    <!-- P5 Game Canvas -->
    <div class="absolute inset-0">
      <P5Wrapper :sketch="sketch" />
    </div>
  </div>
</template>

<script setup lang="ts">
import p5 from "p5"

const GAME_DURATION = 1200;
const SPEED_INCREASE_INTERVAL = 400;
const INITIAL_SPEED_MULTIPLIER = 1;
const SPEED_INCREMENT = 0.3;
const BUCKET_WIDTH = 200;
const CANVAS_SIZE = 800;

const speeds = [1.5, 1.8, 2, 2.1, 2.3];
const obstacleDiameters = [30, 50, 75];


let gameState = "playing";
let obstacles: Obstacle[] = [];
let obstacle_spawn_rate = 120;
let bucketImage: p5.Image;
let bucketX: number, bucketY: number, bucketWidth: number, bucketHeight: number;
let score = 0;
let highScore = 0;
let offsetX: number, offsetY: number;
let speedMultiplier = INITIAL_SPEED_MULTIPLIER;

// Hand tracking
let leftHandX = 0, leftHandY = 0, leftHandVisible = false;
let rightHandX = 0, rightHandY = 0, rightHandVisible = false;
let activeHand: 'left' | 'right' | null = null;

// Reference to MediapipeGame component
const mediapipeRef = ref<{
  leftHand: { x: number, y: number, visible: boolean };
  rightHand: { x: number, y: number, visible: boolean };
  isPersonVisible: boolean;
} | null>(null);

// Watch for hand position updates from MediapipeGame
watch(() => mediapipeRef.value?.leftHand, (newPos) => {
  if (newPos) {
    leftHandX = newPos.x * CANVAS_SIZE;
    leftHandY = newPos.y * CANVAS_SIZE;
    leftHandVisible = newPos.visible;
  }
}, { deep: true });

watch(() => mediapipeRef.value?.rightHand, (newPos) => {
  if (newPos) {
    rightHandX = newPos.x * CANVAS_SIZE;
    rightHandY = newPos.y * CANVAS_SIZE;
    rightHandVisible = newPos.visible;
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
      // Use active hand position
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
    return dx * dx + dy * dy < this.radius * this.radius;
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
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(60);
    bucketX = p.width * 0.5;
    bucketY = p.height * 0.5;
    bucketWidth = BUCKET_WIDTH;
    bucketHeight = bucketWidth / (bucketImage.width / bucketImage.height);
    
    // Handle localStorage safely in browser environment
    if (typeof window !== 'undefined') {
      highScore = parseInt(localStorage.getItem('highScore') || '0');
    }
  }

  p.draw = () => {
    p.background(240);
    
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
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      
      // Check for hand interaction
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
        activeHand = null;
      } else if (o.y > p.height) {
        obstacles.splice(i, 1);
        if (o.grabbed) activeHand = null;
        score -= 2;
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

    // Draw hand cursors
    if (leftHandVisible) {
      p.fill(100, 200, 100, 150);
      p.stroke(100, 200, 100);
      p.strokeWeight(3);
      p.ellipse(leftHandX, leftHandY, 40, 40);
      p.noStroke();
      p.fill(255);
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("R", leftHandX, leftHandY + 5);
    }

    if (rightHandVisible) {
      p.fill(200, 100, 100, 150);
      p.stroke(200, 100, 100);
      p.strokeWeight(3);
      p.ellipse(rightHandX, rightHandY, 40, 40);
      p.noStroke();
      p.fill(255);
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("L", rightHandX, rightHandY + 5);
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
    if (score > highScore) {
      highScore = score;
      if (typeof window !== 'undefined') {
        localStorage.setItem('highScore', highScore.toString());
      }
    }
  }

  function restartGame() {
    gameState = "playing";
    obstacles = [];
    score = 0;
    speedMultiplier = INITIAL_SPEED_MULTIPLIER;
    activeHand = null;
  }
}
</script>

<style scoped>
/* Ensure the MediaPipe component is hidden but still functional */
:deep(.landmark-grid-container) {
  display: none;
}

:deep(.input_video) {
  display: none;
}
</style>