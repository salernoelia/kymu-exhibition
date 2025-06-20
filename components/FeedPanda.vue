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
      <Transition
        appear
        name="fade"
        v-show="startInfo"
      >
        <div
          class="absolute flex flex-col items-center gap-4 z-20 left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-[--color-warningNormal] rounded-lg"
        >
          <div class="flex flex-row gap-4">
            <img
              class="w-10 h-auto filter"
              src="../public/images/hand_left_invert.png"
            />
            <img
              class="w-10 h-auto"
              src="../public/images/hand_right_invert.png"
            />
          </div>
          <h2 class="text-black">
            {{ startInfoNotice }}
          </h2>
        </div>
      </Transition>
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
        Time Left: {{ Math.max(0, (GAME_DURATION / 60) - Math.floor(frameCount / 60)) }}s
      </h1>

      <div
        v-if="gameState === 'playing'"
        class="score-container absolute bg-[--color-primaryNormal] bottom-10 right-6"
      >
        <h1 class=" text-[--color-primaryLight] text-right">
          {{ score }}
        </h1>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type p5 from "p5"

const soundplayer = useSoundPlayer();

const GAME_DURATION = 1200 as const;
const SPEED_INCREASE_INTERVAL = 300 as const;
const INITIAL_SPEED_MULTIPLIER = 1 as const;
const SPEED_INCREMENT = 0.3 as const;
const BUCKET_WIDTH = 600 as const;
const HAND_INFO_FADEOUT_TIME = 6000 as const;
const DRAG_INFO_FADEOUT_TIME = 8000 as const;

const START_INFO_HAND_NOTICE = 'Use your flat hands facing the TV';
const START_INFO_DRAG_NOTICE = 'Drag food to the panda';
const USER_TRIES_GETTING_MULTIPLE_OBSTACLES_WARNING_NOTICE = "Only one treat per hand!";


const startInfoNotice = ref(START_INFO_HAND_NOTICE)
const CANVAS_WIDTH = ref(800);
const CANVAS_HEIGHT = ref(600);
// const HAND_SIZE = 80;
const MAGNETIC_RADIUS = 100;

const frameCount = ref(0)

const speeds = [1.5, 1.8, 2, 2.1, 2.3];
const obstacleDiameters = [50, 70, 120];
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
const startInfo = ref(true)
let obstacles: Obstacle[] = [];
let obstacle_spawn_rate = 75;
let bambooImage: p5.Image;
let cherryImage: p5.Image;
let figImage: p5.Image;

let kymuEats: p5.Image;
let kymuIdle: p5.Image;

let leftHand: p5.Image;
let rightHand: p5.Image;

; let bucketX: number, bucketY: number, bucketWidth: number, bucketHeight: number;
const score = ref(0);
let highScore = 0;

let speedMultiplier = INITIAL_SPEED_MULTIPLIER;
let gameStartTime = 0;
let totalObstacles = 0;
let successfulCatches = 0;
const kymuIsEating = ref(false)
let leftHandHasObject = false;
let rightHandHasObject = false;

const userTriesToGrabSecondObject = ref(false);

let leftHandX = 0, leftHandY = 0, leftHandVisible = false;
let rightHandX = 0, rightHandY = 0, rightHandVisible = false;

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

const startInfoCountdown = () => {
  setTimeout(() => {
    startInfoNotice.value = START_INFO_DRAG_NOTICE;
  }, HAND_INFO_FADEOUT_TIME);
  setTimeout(() => {
    startInfo.value = false;
  }, DRAG_INFO_FADEOUT_TIME);
}

onMounted(() => {
  updateCanvasSize();
  startInfoCountdown();
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
  score.value = 0;

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
      // Change these to leftHandX/Y instead of rightHandX/Y
      leftHandX = ((newPos.x - 0.2) / 0.6) * CANVAS_WIDTH.value;
      leftHandY = ((newPos.y - 0.2) / 0.6) * CANVAS_HEIGHT.value;
      leftHandVisible = newPos.visible;
    }
  }, { deep: true })
);

stopWatchers.push(
  watch(() => mediapipeRef.value?.rightHand, (newPos) => {
    if (newPos) {
      // Change these to rightHandX/Y instead of leftHandX/Y
      rightHandX = ((newPos.x - 0.2) / 0.6) * CANVAS_WIDTH.value;
      rightHandY = ((newPos.y - 0.2) / 0.6) * CANVAS_HEIGHT.value;
      rightHandVisible = newPos.visible;
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
  grabbingHand: 'left' | 'right' | null;
  rotation: number;
  rotationSpeed: number;
  offsetX: number;
  offsetY: number;


  constructor(diameter: number, p: p5) {
    this.diameter = diameter;
    this.radius = diameter * 0.5;
    this.horizontalPosition = p.random(this.radius, p.width - this.radius);
    this.y = 0;
    this.velocity = speeds[p.int(p.random(speeds.length))] * speedMultiplier;
    this.grabbed = false;
    this.grabbingHand = null;
    this.rotation = 0;
    this.rotationSpeed = p.random(0.02, 0.08);
    this.offsetX = 0;
    this.offsetY = 0;
  }

  update() {
    if (!this.grabbed) {
      this.y += this.velocity;
      this.rotation += this.rotationSpeed;
    } else {
      if (this.grabbingHand === 'left' && leftHandVisible) {
        this.horizontalPosition = leftHandX + this.offsetX;
        this.y = leftHandY + this.offsetY;
      } else if (this.grabbingHand === 'right' && rightHandVisible) {
        this.horizontalPosition = rightHandX + this.offsetX;
        this.y = rightHandY + this.offsetY;
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
    p.push();
    p.translate(this.horizontalPosition, this.y);
    p.rotate(this.rotation);
    p.image(obstacleImage, 0, 0, this.diameter, this.diameter);
    p.pop();
  }
  isHandOver(handX: number, handY: number) {
    const dx = handX - this.horizontalPosition;
    const dy = handY - this.y;
    return dx * dx + dy * dy < (MAGNETIC_RADIUS * MAGNETIC_RADIUS);
  }

  isInBucket() {
    const bucketLeft = bucketX - bucketWidth * 0.25;
    const bucketRight = bucketX + bucketWidth * 0.25;
    const bucketTop = bucketY - bucketHeight * 0.15;
    const bucketBottom = bucketY + bucketHeight * 0.25;

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
    // bucketImage = p.loadImage('/images/pandas/panda_wink.png');
    bambooImage = p.loadImage('/images/obstacles/bamboo.png');
    cherryImage = p.loadImage('/images/obstacles/cherry.png');
    figImage = p.loadImage('/images/obstacles/fig.png');
    fontRegular = p.loadFont('/fonts/Poppins-Light.ttf');
    kymuEats = p.loadImage('/lottifiles/instructions/kymu_eats.gif');
    kymuIdle = p.loadImage('/lottifiles/instructions/kymu_idle.gif');
    leftHand = p.loadImage('/images/hand_left.png');
    rightHand = p.loadImage('/images/hand_right.png');
  }

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH.value, CANVAS_HEIGHT.value);
    p.frameRate(60);
    p.textFont(fontRegular);

    bucketX = p.width * 0.5;
    bucketY = p.height * 0.5;
    bucketWidth = BUCKET_WIDTH;
    bucketHeight = bucketWidth / (kymuIdle.width / kymuIdle.height);

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
      obstacle_spawn_rate = Math.round(obstacle_spawn_rate * 0.75);
    }

    if (p.frameCount % obstacle_spawn_rate === 0) {
      obstacles.push(new Obstacle(obstacleDiameters[p.int(p.random(obstacleDiameters.length))], p));
      totalObstacles++;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];

      if (!o.grabbed) {
        if (leftHandVisible && !leftHandHasObject && o.isHandOver(leftHandX, leftHandY)) {
          soundplayer.playCaughtSaund();
          o.offsetX = o.horizontalPosition - leftHandX;
          o.offsetY = o.y - leftHandY;
          o.grabbed = true;
          o.grabbingHand = 'left';
          leftHandHasObject = true;
        } else if (rightHandVisible && !rightHandHasObject && o.isHandOver(rightHandX, rightHandY)) {
          soundplayer.playCaughtSaund();
          o.offsetX = o.horizontalPosition - rightHandX;
          o.offsetY = o.y - rightHandY;
          o.grabbed = true;
          o.grabbingHand = 'right';
          rightHandHasObject = true;
        } else if ((leftHandVisible && leftHandHasObject && o.isHandOver(leftHandX, leftHandY)) ||
          (rightHandVisible && rightHandHasObject && o.isHandOver(rightHandX, rightHandY))) {

          userTriesToGrabSecondObject.value = true;
          setTimeout(() => {
            userTriesToGrabSecondObject.value = false;
          }, 3000);
        }
      }

      o.update();

      if (o.grabbed && o.isInBucket()) {
        if (Math.random() < 0.5) {
          soundplayer.playEatingSoundOne();
        } else {
          soundplayer.playEatingSoundTwo();
        }

        kymuIsEating.value = true;
        setTimeout(() => {
          kymuIsEating.value = false;
        }, 2000);

        obstacles.splice(i, 1);
        score.value++;
        userTriesToGrabSecondObject.value = false;
        successfulCatches++;

        if (o.grabbingHand === 'left') {
          leftHandHasObject = false;
        } else if (o.grabbingHand === 'right') {
          rightHandHasObject = false;
        }

        emit('scoreChanged', score.value);
        continue;
      }

      if (o.y > p.height + o.radius) {
        obstacles.splice(i, 1);
        if (o.grabbed && o.grabbingHand === 'left') {
          leftHandHasObject = false;
        } else if (o.grabbed && o.grabbingHand === 'right') {
          rightHandHasObject = false;
        }
        emit('scoreChanged', score.value);
      }
    }
  }


  function drawDottedTrail(p: p5, fromX: number, fromY: number) {
    const dx = bucketX - fromX;
    const dy = bucketY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 80) {
      const steps = Math.floor(distance / 20);
      p.fill(17, 39, 122);
      p.noStroke();

      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = fromX + dx * t;
        const y = fromY + dy * t;
        const opacity = (1 - t) * 200;

        p.fill(17, 39, 122, opacity);
        p.ellipse(x, y, 8, 8);
      }
    }
  }

  function drawGame(p: p5) {
    p.noStroke();
    p.imageMode(p.CENTER);

    if (kymuIsEating.value) {
      p.image(kymuEats, bucketX, bucketY, bucketWidth, bucketHeight);
    } else {
      p.image(kymuIdle, bucketX, bucketY, bucketWidth, bucketHeight);
    }

    for (const obstacle of obstacles) {
      obstacle.show(p);

      if (obstacle.grabbed) {
        drawDottedTrail(p, obstacle.horizontalPosition, obstacle.y);
      }
    }

    if (leftHandVisible) {
      // magnet
      p.fill(100, 200, 100, 110);
      p.noStroke();
      p.ellipse(leftHandX, leftHandY, MAGNETIC_RADIUS * 2, MAGNETIC_RADIUS * 2);

      p.fill(100, 200, 100, 150);
      p.stroke(100, 200, 100);
      p.strokeWeight(3);
      // p.ellipse(leftHandX, leftHandY, HAND_SIZE, HAND_SIZE);
      p.image(leftHand, leftHandX, leftHandY, MAGNETIC_RADIUS, MAGNETIC_RADIUS)


    }

    if (rightHandVisible) {
      // magnet 
      p.fill(200, 100, 100, 110);
      p.noStroke();
      p.ellipse(rightHandX, rightHandY, MAGNETIC_RADIUS * 2, MAGNETIC_RADIUS * 2);



      // hand 
      p.fill(100, 200, 100, 150);
      p.stroke(200, 100, 100);
      p.strokeWeight(3);
      // p.ellipse(rightHandX, rightHandY, HAND_SIZE, HAND_SIZE);
      p.image(rightHand, rightHandX, rightHandY, MAGNETIC_RADIUS, MAGNETIC_RADIUS)


    }

    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(48);
    p.noStroke()
  }



  function endGame() {
    gameState = "gameOver";
    const gameDuration = Date.now() - gameStartTime;
    const accuracy = totalObstacles > 0 ? Math.round((successfulCatches / totalObstacles) * 100) : 0;

    if (score.value > highScore) {
      highScore = score.value;
      if (typeof window !== 'undefined') {
        localStorage.setItem('feedPandaHighScore', highScore.toString());
      }
    }

    emit('gameCompleted', {
      score: score.value,
      highScore,
      duration: gameDuration,
      accuracy,
      handsDetected: leftHandVisible || rightHandVisible
    });
  }

  function restartGame() {
    gameState = "playing";
    obstacles = [];
    score.value = 0;
    totalObstacles = 0;
    successfulCatches = 0;
    speedMultiplier = INITIAL_SPEED_MULTIPLIER;

    gameStartTime = Date.now();
    emit('gameStarted', { timestamp: gameStartTime });
  }
}

defineExpose({
  restartGame: () => {
    gameState = "playing";
    obstacles = [];
    score.value = 0;
    totalObstacles = 0;
    successfulCatches = 0;
    speedMultiplier = INITIAL_SPEED_MULTIPLIER;

  },
  endGame: () => {
    gameState = "gameOver";
    const gameDuration = Date.now() - gameStartTime;
    const accuracy = totalObstacles > 0 ? Math.round((successfulCatches / totalObstacles) * 100) : 0;

    if (score.value > highScore) {
      highScore = score.value;
      if (typeof window !== 'undefined') {
        localStorage.setItem('feedPandaHighScore', highScore.toString());
      }
    }

    emit('gameCompleted', {
      score: score.value,
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

<style scoped>
.score-container {
  border-radius: 1rem;
  padding-left: 2rem;
  padding-right: 2rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>