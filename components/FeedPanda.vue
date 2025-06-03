<template>
  <div class="w-full h-full relative flex justify-center">
    <MediapipeGame ref="mediapipeRef" />

    <!-- Video feed overlay -->
    <div class="absolute top-20 right-4 w-48 h-36 overflow-hidden rounded-lg ">
      <video
        ref="videoFeed"
        class="w-full h-full object-cover opacity-30 transform scale-x-[-1]"
        autoplay
        muted
        playsinline
      />
    </div>

    <div class="absolute w-full flex justify-center inset-0 pt-20">
      <P5Wrapper :sketch="sketch" />
      <div
        v-if="userTriesToGrabSecondObject"
        class="absolute flex flex-row items-center gap-4 z-20 bottom-20 p-6 bg-[--color-warningNormal] rounded-lg"
      >
        <Icon
          name="ic:baseline-info"
          class="text-3xl"
        />
        <h2 class="text-black">
          {{ USER_TRIES_GETTING_MULTIPLE_OBSTACLES_WARNING_NOTICE }}
        </h2>
      </div>

      <h1
        v-if="gameState === 'playing'"
        class="absolute bottom-10 left-6 text-left"
      >
        Time Left: {{ Math.max(0, 30 - Math.floor(frameCount / 60)) }}s
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import type p5 from "p5"

const soundplayer = useSoundPlayer();

const GAME_DURATION = 1800;
const SPEED_INCREASE_INTERVAL = 300;
const INITIAL_SPEED_MULTIPLIER = 1;
const SPEED_INCREMENT = 0.5;
const BUCKET_WIDTH = 300;

const CANVAS_WIDTH = ref(800);
const CANVAS_HEIGHT = ref(600);
const HAND_SIZE = 80;
const MAGNETIC_RADIUS = 100;

const frameCount = ref(0)

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
let obstacle_spawn_rate = 50;
let bucketImage: p5.Image;
let bambooImage: p5.Image;
let cherryImage: p5.Image;
let figImage: p5.Image;
let bucketX: number, bucketY: number, bucketWidth: number, bucketHeight: number;
let score = 0;
let highScore = 0;
let offsetX: number, offsetY: number;
let speedMultiplier = INITIAL_SPEED_MULTIPLIER;
let gameStartTime = 0;
let totalObstacles = 0;
let successfulCatches = 0;

const userTriesToGrabSecondObject = ref(false);
const USER_TRIES_GETTING_MULTIPLE_OBSTACLES_WARNING_NOTICE = "Drag the food to the panda to score!"

let leftHandX = 0, leftHandY = 0, leftHandVisible = false;
let rightHandX = 0, rightHandY = 0, rightHandVisible = false;
let activeHand: 'left' | 'right' | null = null;

const mediapipeRef = ref<{
  leftHand: { x: number, y: number, visible: boolean };
  rightHand: { x: number, y: number, visible: boolean };
  isPersonVisible: boolean;
  getVideoStream: () => MediaStream | null;
  cleanup: () => void;
} | null>(null);

const videoFeed = ref<HTMLVideoElement | null>(null);
const videoAspectRatio = ref(16 / 9);

const updateCanvasSize = () => {
  if (typeof window !== 'undefined') {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight - 80;

    let canvasWidth = windowWidth;
    let canvasHeight = windowWidth / videoAspectRatio.value;

    if (canvasHeight > windowHeight) {
      canvasHeight = windowHeight;
      canvasWidth = windowHeight * videoAspectRatio.value;
    }

    CANVAS_WIDTH.value = canvasWidth;
    CANVAS_HEIGHT.value = canvasHeight;
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

          videoFeed.value.addEventListener('loadedmetadata', () => {
            if (videoFeed.value) {
              videoAspectRatio.value = videoFeed.value.videoWidth / videoFeed.value.videoHeight;
              updateCanvasSize();
            }
          });
        }
      })
      .catch(err => console.log('Video feed error:', err));
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateCanvasSize);
  }
  cleanup();
});

function cleanup() {
  console.log('Starting FeedPanda cleanup...');

  gameState = "playing";
  obstacles = [];
  obstacle_spawn_rate = 120;
  score = 0;
  offsetX = 0;
  offsetY = 0;
  speedMultiplier = INITIAL_SPEED_MULTIPLIER;
  gameStartTime = 0;
  totalObstacles = 0;
  successfulCatches = 0;

  leftHandX = 0;
  leftHandY = 0;
  leftHandVisible = false;
  rightHandX = 0;
  rightHandY = 0;
  rightHandVisible = false;
  activeHand = null;

  if (videoFeed.value?.srcObject) {
    const stream = videoFeed.value.srcObject as MediaStream;
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      track.stop();
      console.log('Stopped video feed track:', track.label);
    });
    videoFeed.value.srcObject = null;
  }

  if (mediapipeRef.value) {
    try {
      const ref = mediapipeRef.value as { cleanup?: () => void };
      ref.cleanup?.();
    } catch (err) {
      console.error('Error cleaning up MediapipeRef:', err);
    }
  }

  if (p5Instance) {
    try {
      p5Instance.remove();
      console.log('P5 instance removed');
    } catch (err) {
      console.error('Error removing P5 instance:', err);
    }
    p5Instance = null;
  }

  stopWatchers.forEach(stopWatcher => {
    try {
      stopWatcher();
    } catch (err) {
      console.error('Error stopping watcher:', err);
    }
  });

  console.log('FeedPanda cleanup completed');
}

const stopWatchers: Array<() => void> = [];

stopWatchers.push(
  watch(() => mediapipeRef.value, (newRef) => {
    if (newRef && videoFeed.value) {
      const stream = newRef.getVideoStream();
      if (stream) {
        videoFeed.value.srcObject = stream;

        videoFeed.value.addEventListener('loadedmetadata', () => {
          if (videoFeed.value) {
            videoAspectRatio.value = videoFeed.value.videoWidth / videoFeed.value.videoHeight;
            updateCanvasSize();
          }
        });
      }
    }
  }, { immediate: true })
);

stopWatchers.push(
  watch(() => mediapipeRef.value?.leftHand, (newPos) => {
    if (newPos) {
      rightHandX = ((newPos.x - 0.2) / 0.6) * CANVAS_WIDTH.value;
      rightHandY = ((newPos.y - 0.2) / 0.6) * CANVAS_HEIGHT.value;
      rightHandVisible = newPos.visible;
    }
  }, { deep: true })
);

stopWatchers.push(
  watch(() => mediapipeRef.value?.rightHand, (newPos) => {
    if (newPos) {
      leftHandX = ((newPos.x - 0.2) / 0.6) * CANVAS_WIDTH.value;
      leftHandY = ((newPos.y - 0.2) / 0.6) * CANVAS_HEIGHT.value;
      leftHandVisible = newPos.visible;
    }
  }, { deep: true })
);


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

  update() {
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
    let obstacleImage;
    if (this.diameter === 30) {
      obstacleImage = cherryImage;
    } else if (this.diameter === 50) {
      obstacleImage = bambooImage;
    } else {
      obstacleImage = figImage;
    }

    p.imageMode(p.CENTER);
    p.image(obstacleImage, this.horizontalPosition, this.y, this.diameter, this.diameter);
  }

  isHandOver(handX: number, handY: number) {
    const dx = handX - this.horizontalPosition;
    const dy = handY - this.y;
    return dx * dx + dy * dy < (MAGNETIC_RADIUS * MAGNETIC_RADIUS);
  }

  isInBucket() {
    const bucketLeft = bucketX - bucketWidth * 0.4;
    const bucketRight = bucketX + bucketWidth * 0.4;
    const bucketTop = bucketY - bucketHeight * 0.3;
    const bucketBottom = bucketY + bucketHeight * 0.4;

    return this.horizontalPosition >= bucketLeft &&
      this.horizontalPosition <= bucketRight &&
      this.y >= bucketTop &&
      this.y <= bucketBottom;
  }
}

let fontRegular: p5.Font;

let p5Instance: p5 | null = null;

const sketch = (p: p5) => {
  p5Instance = p;

  p.preload = () => {
    bucketImage = p.loadImage('/images/pandas/panda_wink.png');
    bambooImage = p.loadImage('/images/obstacles/bamboo.png')
    cherryImage = p.loadImage('/images/obstacles/cherry.png')
    figImage = p.loadImage('/images/obstacles/fig.png')
    fontRegular = p.loadFont('/fonts/Poppins-Light.ttf');
  }

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH.value, CANVAS_HEIGHT.value);
    p.frameRate(60);
    p.textFont(fontRegular);

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
    p.clear();

    if (p.width !== CANVAS_WIDTH.value || p.height !== CANVAS_HEIGHT.value) {
      p.resizeCanvas(CANVAS_WIDTH.value, CANVAS_HEIGHT.value);
      bucketX = p.width * 0.5;
      bucketY = p.height * 0.5;
    }

    if (gameState === "playing") {
      updateGame(p);
      drawGame(p);
    } else if (gameState === "gameOver") {
      // drawGameOver(p);
      console.log("Game is Over")
    }
  }

  p.keyPressed = () => {
    if (gameState === "gameOver" && (p.key === 'r' || p.key === 'R')) {
      restartGame();
    }
  }

  function updateGame(p: p5) {
    frameCount.value = p.frameCount;
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

      if (!o.grabbed && activeHand === null) {
        if (leftHandVisible && o.isHandOver(leftHandX, leftHandY)) {
          soundplayer.playCaughtSaund();
          // userTriesToGrabSecondObject.value = false;
          offsetX = o.horizontalPosition - leftHandX;
          offsetY = o.y - leftHandY;
          o.grabbed = true;
          activeHand = 'left';
        } else if (rightHandVisible && o.isHandOver(rightHandX, rightHandY)) {
          soundplayer.playCaughtSaund();
          // userTriesToGrabSecondObject.value = false;
          offsetX = o.horizontalPosition - rightHandX;
          offsetY = o.y - rightHandY;
          o.grabbed = true;
          activeHand = 'right';
        }
      } else if (!o.grabbed && activeHand !== null) {
        // User tries to grab another while already carrying one
        if (
          (leftHandVisible && o.isHandOver(leftHandX, leftHandY)) ||
          (rightHandVisible && o.isHandOver(rightHandX, rightHandY))
        ) {
          userTriesToGrabSecondObject.value = true;
          console.warn("You can only carry one object at a time!");
        }
      }

      o.update();


      if (o.grabbed && o.isInBucket()) {
        obstacles.splice(i, 1);
        soundplayer.playScoreSound();
        score++;
        userTriesToGrabSecondObject.value = false
        successfulCatches++;
        activeHand = null;
        emit('scoreChanged', score);
        continue;
      }

      if (o.y > p.height + o.radius) {
        obstacles.splice(i, 1);
        if (o.grabbed) activeHand = null;
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

    if (leftHandVisible) {
      // magnet
      p.fill(100, 200, 100, 30);
      p.noStroke();
      p.ellipse(leftHandX, leftHandY, MAGNETIC_RADIUS * 2, MAGNETIC_RADIUS * 2);

      p.fill(100, 200, 100, 150);
      p.stroke(100, 200, 100);
      p.strokeWeight(3);
      p.ellipse(leftHandX, leftHandY, HAND_SIZE, HAND_SIZE);
      // p.noStroke();
      // p.fill(255);
      // p.textAlign(p.CENTER);
      // p.textSize(16);
      // p.text("L", leftHandX, leftHandY + 6);
    }

    if (rightHandVisible) {
      // magnet 
      p.fill(200, 100, 100, 30);
      p.noStroke();
      p.ellipse(rightHandX, rightHandY, MAGNETIC_RADIUS * 2, MAGNETIC_RADIUS * 2);

      // hand 
      p.fill(200, 100, 100, 150);
      p.stroke(200, 100, 100);
      p.strokeWeight(3);
      p.ellipse(rightHandX, rightHandY, HAND_SIZE, HAND_SIZE);
      // p.noStroke();
      // p.fill(255);
      // p.textAlign(p.CENTER);
      // p.textSize(16);
      // p.text("R", rightHandX, rightHandY + 6);
    }

    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.noStroke()
    // p.text("Score: " + score, bucketX, bucketY + bucketHeight * 0.5 + 30);
    p.text("Score: " + score, bucketX, bucketY + bucketHeight * 0.5 + 50);


    // p.text("Speed: " + speedMultiplier.toFixed(1) + "x", 20, 50);
    // p.text("Hands: " + (leftHandVisible ? "L" : "") + (rightHandVisible ? "R" : ""), 20, 70);
  }

  // function drawGameOver(p: p5) {
  //   p.fill(0);
  //   p.textAlign(p.CENTER);
  //   p.textSize(48);
  //   p.text("Game Over!", p.width * 0.5, p.height * 0.4);

  //   p.textSize(32);
  //   p.text("Final Score: " + score, p.width * 0.5, p.height * 0.5);
  //   p.text("High Score: " + highScore, p.width * 0.5, p.height * 0.55);

  //   p.textSize(20);
  //   p.text("Press R to restart", p.width * 0.5, p.height * 0.7);
  // }

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
  endGame: () => {
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
    cleanup();
  },
  getCurrentScore: () => score,
  getGameState: () => gameState,
  cleanup,
});
</script>

<style scoped></style>