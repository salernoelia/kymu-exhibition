<template>
  <div class="w-full h-full flex flex-col">
    <div class="flex flex-row w-full flex-grow overflow-hidden">
      <div class="flex flex-col w-full h-full justify-center items-center overflow-hidden">
        <video
          v-show="false"
          ref="source"
          class="input_video"
        />
        <canvas
          ref="canvas"
          class="output_canvas"
          :class="{ loading_canvas: loadingCanvas, inactive_canvas: !isPersonVisibleState }"
          :width="canvasWidth"
          :height="canvasHeight"
        />
        <img
          v-if="!isPersonVisibleState"
          src="/public/images/overlay_white.png"
          class="absolute h-full output_canvas overlay"
        >
        <!-- Countdown Timer (before recording starts) -->
        <motion.div
          v-if="isPersonVisibleState && showCheckIcon && startRecordingUserAssessmentTimeout"
          :initial="{ opacity: 0, scale: 0 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0 }"
          :transition="{ duration: 0.3, exit: { duration: 0.15 } }"
          class="absolute flex flex-col items-end justify-center z-20 timer-container countdown-timer"
        >
          <Icon
            name="material-symbols-light:check-rounded"
            class="text-white h-12 w-12 icon-centered mb-2"
          />
          <div class="timer-circle">
            <span class="timer-number">{{ countdownSeconds }}</span>
          </div>
          <p class="text-white text-lg font-medium mt-2">Get ready...</p>
        </motion.div>

        <!-- Recording Timer (during recording) -->
        <motion.div
          v-if="exerciseStore.startedRecording"
          :initial="{ opacity: 0, scale: 0 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0 }"
          :transition="{ duration: 0.3, exit: { duration: 0.15 } }"
          class="absolute flex flex-col items-center justify-center z-20 timer-container recording-timer"
        >
          <div class="recording-indicator">
            <div class="recording-dot" />
            <span class="text-white text-lg font-medium ml-2">RECORDING</span>
          </div>
          <div class="timer-circle recording">
            <span class="timer-number">{{ recordingSeconds }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: recordingProgress + '%' }"
            />
          </div>
        </motion.div>

        <div
          ref="landmarkContainer"
          class="landmark-grid-container"
        />
      </div>
    </div>
    <!-- Display the angle information -->
    <div
      v-if="exerciseDevmode"
      class="angle-display"
    >
      <h2>Exercise: {{ currentExercise?.name }}</h2>
      <h2>Current Angle: {{ currentAngle.toFixed(2) }}</h2>
      <h2>Reference Angle: {{ referenceAngle.toFixed(0) }}</h2>
      <h2>Target Angle: {{ targetAngle }}</h2>
      <h2>Threshold: ±{{ thresholdDeg }}°</h2>
      <h2>Position Valid: {{ isPersonVisibleState ? 'Yes' : 'No' }}</h2>
      <h2>Pain Moments: {{ exerciseStore.painMomentAngles }}</h2>

      <div class="camera-controls">
        <select
          v-if="videoDevices.length > 1"
          v-model="selectedDeviceId"
          class="camera-selector"
          @change="startCamera"
        >
          <option
            v-for="device in videoDevices"
            :key="device.deviceId"
            :value="device.deviceId"
          >
            {{ device.label || `Camera ${videoDevices.indexOf(device) + 1}` }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { PoseService } from "~/utils/pose_service";
import type { Results } from "@mediapipe/pose";
import type { NormalizedLandmarkList } from "@mediapipe/drawing_utils";
import PoseCombinations from '~/assets/pose_config.json'
import { motion } from 'motion-v'


//  Recording 
const USER_DETECTED_START_EXERCISE_TIMEOUT_MS = ref(3000);
const RECORDING_DURATION_MS = ref(5000);


const currentTime = ref(Date.now());
let timerInterval: ReturnType<typeof setInterval> | null = null;

const countdownSeconds = computed(() => {
  if (!startRecordingUserAssessmentTimeout.value || !startTimeUserDetectedTimeout.value) {
    return 0;
  }
  return Math.ceil((USER_DETECTED_START_EXERCISE_TIMEOUT_MS.value - (currentTime.value - startTimeUserDetectedTimeout.value)) / 1000);
});

const recordingSeconds = computed(() => {
  if (!exerciseStore.startedRecording || !recordingStartTime.value) {
    return Math.ceil(RECORDING_DURATION_MS.value / 1000);
  }
  const elapsed = currentTime.value - recordingStartTime.value;
  const remaining = Math.max(0, RECORDING_DURATION_MS.value - elapsed);
  return Math.ceil(remaining / 1000);
});

const recordingProgress = computed(() => {
  if (!exerciseStore.startedRecording || !recordingStartTime.value) {
    return 0;
  }
  const elapsed = currentTime.value - recordingStartTime.value;
  return Math.min(100, (elapsed / RECORDING_DURATION_MS.value) * 100);
});

// Start the timer interval
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

const exerciseDevmode = useStorage('exercise-devmode', false);
const personDetectedTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const startRecordingUserAssessmentTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const recordingTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const startTimeUserDetectedTimeout = ref();
const recordingStartTime = ref<number | null>(null);
const isPersonVisibleState = ref(false)
const showCheckIcon = ref(false)
const maxAngleAchieved = ref(0);

const canvasWidth = computed(() =>
  Math.min(window.innerWidth, window.innerHeight * (16 / 9))
);
const canvasHeight = computed(() =>
  Math.min(window.innerHeight * 0.9, canvasWidth.value * (9 / 16))
);

const exerciseStore = useExerciseStore();
const soundPlayer = useSoundPlayer();

const currentExercise = computed(() => exerciseStore.currentExercise);

const props = defineProps<{
  romCombination: string;
}>();

const source = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const landmarkContainer = ref<HTMLDivElement | null>(null);
const loadingCanvas = ref(true);
const mediapipeResults = ref<Results | null>(null);
const exerciseInitialNormalizedLandmarks = ref<NormalizedLandmarkList | null>(
  null
);

const currentAngle = ref(0);

const pivotIndex = ref(14);
const movableIndex = ref(16);
const referenceIndex = ref(23);

const thresholdDeg = ref(25);
const targetAngle = ref(0)

const toneForRom = useToneForRom(currentAngle);

const referenceAngle = computed(() => {
  if (!mediapipeResults.value ||
    !mediapipeResults.value.poseWorldLandmarks ||
    !mediapipeResults.value.poseWorldLandmarks.length) {
    return 0;
  }

  const A = mediapipeResults.value.poseWorldLandmarks[movableIndex.value];
  const B = mediapipeResults.value.poseWorldLandmarks[pivotIndex.value];
  const C = mediapipeResults.value.poseWorldLandmarks[referenceIndex.value];

  if (!A || !B || !C) return 0;

  const ab = { x: A.x - B.x, y: A.y - B.y };
  const cb = { x: C.x - B.x, y: C.y - B.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  const angleRad = Math.acos(dot / (magAB * magCB));
  return angleRad * (180 / Math.PI);
});

const isPersonVisible = computed((): boolean => {
  if (
    !mediapipeResults.value ||
    !mediapipeResults.value.poseWorldLandmarks ||
    !mediapipeResults.value.poseWorldLandmarks.length ||
    !mediapipeResults.value.poseWorldLandmarks[movableIndex.value] ||
    !mediapipeResults.value.poseWorldLandmarks[pivotIndex.value] ||
    !mediapipeResults.value.poseWorldLandmarks[referenceIndex.value] ||
    mediapipeResults.value.poseWorldLandmarks[movableIndex.value]
      ?.visibility === undefined ||
    (mediapipeResults.value.poseWorldLandmarks[movableIndex.value]
      ?.visibility ?? 0) < 0.6
  ) {
    return false;
  }

  const A = mediapipeResults.value.poseWorldLandmarks[movableIndex.value];
  const B = mediapipeResults.value.poseWorldLandmarks[pivotIndex.value];
  const C = mediapipeResults.value.poseWorldLandmarks[referenceIndex.value];

  if (!A || !B || !C) return false;

  const angleDifference = Math.abs(referenceAngle.value - targetAngle.value);

  return angleDifference <= thresholdDeg.value || exerciseStore.startedRecording;
});

watch(isPersonVisible, (visible) => {
  isPersonVisibleState.value = visible;

  if (visible) {
    soundPlayer.playDetectedSound();
    toneForRom.startTone();
    showCheckIcon.value = true;
    startTimer(); // Start the reactive timer

    if (personDetectedTimeout.value) {
      clearTimeout(personDetectedTimeout.value);
    }

    if (startRecordingUserAssessmentTimeout.value) {
      clearTimeout(startRecordingUserAssessmentTimeout.value);
    }

    if (!exerciseStore.startedRecording) {
      startTimeUserDetectedTimeout.value = Date.now();
      currentTime.value = Date.now(); // Update current time

      startRecordingUserAssessmentTimeout.value = setTimeout(() => {
        startRecordingUserAssessment();
        startRecordingUserAssessmentTimeout.value = null;
      }, USER_DETECTED_START_EXERCISE_TIMEOUT_MS.value);
    }
  } else {
    showCheckIcon.value = false;
    console.log(`Out of reference: current ${referenceAngle.value.toFixed(2)}° vs target ${targetAngle.value}°`);
    toneForRom.stopTone();

    if (startRecordingUserAssessmentTimeout.value) {
      clearTimeout(startRecordingUserAssessmentTimeout.value);
      startRecordingUserAssessmentTimeout.value = null;
      stopTimer();
    }

    if (exerciseStore.startedRecording) {
      resetRecording();
    } else {
      stopTimer();
      cleanup();
    }
  }
}, { immediate: true });

watch(currentAngle, (newAngle) => {
  if (exerciseStore.startedRecording) {
    if (newAngle > 180) {
      console.log('Invalid angle detected:', newAngle, '- resetting recording');
      resetRecording();
      return;
    }


    if (newAngle > maxAngleAchieved.value) {
      maxAngleAchieved.value = newAngle;
    }
  }
});

watch(
  () => props.romCombination,
  (newCombination) => {
    if (
      newCombination &&
      PoseCombinations[newCombination as keyof typeof PoseCombinations]
    ) {
      updateROMCombination(newCombination as keyof typeof PoseCombinations);
    }
  },
  { immediate: true }
);


function updateROMCombination(combination: keyof typeof PoseCombinations) {
  const { pivot, movable, reference, threshold, targetAngle: configTargetAngle } = PoseCombinations[combination];
  pivotIndex.value = pivot;
  movableIndex.value = movable;
  referenceIndex.value = reference;
  thresholdDeg.value = threshold;
  targetAngle.value = configTargetAngle || 0;
}

function startRecordingUserAssessment() {
  exerciseInitialNormalizedLandmarks.value =
    mediapipeResults.value?.poseLandmarks ?? null;
  console.log("Recording started");
  exerciseStore.startedRecording = true;
  recordingStartTime.value = Date.now();
  currentTime.value = Date.now();
  maxAngleAchieved.value = 0;
  startTimer();

  recordingTimeout.value = setTimeout(() => {
    if (maxAngleAchieved.value > 5 && maxAngleAchieved.value <= 180) {
      completeRecording();
    } else {
      return;
    }
  }, RECORDING_DURATION_MS.value);
}


function resetRecording() {
  console.log("Resetting recording due to invalid angle");

  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }

  stopTimer();
  exerciseStore.startedRecording = false;
  recordingStartTime.value = null;
  maxAngleAchieved.value = 0;
}


function completeRecording() {
  console.log("Recording completed - max angle achieved:", maxAngleAchieved.value);

  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }

  stopTimer();

  exerciseStore.resultAngle = maxAngleAchieved.value;
  exerciseStore.completeCurrentExercise();

  const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

  if (isLastExercise) {
    navigateTo("/results");
  } else {
    exerciseStore.nextExercise();
    navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
  }
}

function calculateAngle() {
  console.log("calculateVectorAngle");
  exerciseStore.resultAngle = maxAngleAchieved.value;
}

function markPainMoment() {
  console.log("marked pain moment at", currentAngle.value);
  exerciseStore.painMomentAngles.push(currentAngle.value);
  exerciseStore.painMomentAngles.sort((a, b) => a - b);
}

function cleanup() {
  currentAngle.value = 0;
  exerciseStore.resultAngle = 0;
  exerciseStore.painMomentAngles = [];
  exerciseInitialNormalizedLandmarks.value = null;
  maxAngleAchieved.value = 0;
  recordingStartTime.value = null;
  stopTimer();

  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }

  console.log("cleanup done");
  exerciseStore.startedRecording = false;
}

onMounted(async () => {
  await getAvailableVideoDevices(videoDevices, selectedDeviceId);
  if (canvas.value && source.value && landmarkContainer.value) {
    source.value.onloadedmetadata = async () => {
      if (!canvas.value || !source.value || !landmarkContainer.value) {
        console.log("canvas, source or landmark container missing")
        return;
      }
      canvas.value.width = source.value.videoWidth;
      canvas.value.height = source.value.videoHeight;

      await new PoseService(
        canvas.value,
        source.value,
        canvas.value.width,
        canvas.value.height,
        landmarkContainer.value,
        loadingCanvas,
        mediapipeResults,
        exerciseInitialNormalizedLandmarks,
        pivotIndex,
        movableIndex,
        currentAngle
      ).setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        selfieMode: true,
      });
      await startCamera();
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      source.value.srcObject = stream;
      source.value.play();
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }



  if (!props.romCombination) {
    console.warn("No ROM combination provided");
    toneForRom.stopTone();
  }
});

const videoDevices = ref<MediaDeviceInfo[]>([]);
const selectedDeviceId = ref<string>("");

async function startCamera() {
  if (!source.value) return;

  try {
    if (source.value.srcObject) {
      const tracks = (source.value.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }

    const constraints = {
      video: selectedDeviceId.value
        ? { deviceId: { exact: selectedDeviceId.value } }
        : true
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    source.value.srcObject = stream;
    source.value.play();
  } catch (err) {
    console.error("Error accessing camera:", err);
  }
}



onBeforeUnmount(() => {
  toneForRom.stopTone();
  stopTimer();

  if (startRecordingUserAssessmentTimeout.value) {
    clearTimeout(startRecordingUserAssessmentTimeout.value);
  }
  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
  }
});

onUnmounted(() => {
  toneForRom.stopTone();
  stopTimer();
});

defineExpose({
  startRecordingUserAssessment,
  calculateAngle,
  cleanup,
  markPainMoment,
});

</script>

<style scoped>
.pose {
  align-items: center;
  text-align: center;
  margin: 1.5rem 1.5rem;
}

h1 {
  font-size: 3rem;
}

.pose h1 {
  margin: 1.5rem 1.5rem;
}

.loading_canvas {
  background: url("https://media.giphy.com/media/8agqybiK5LW8qrG3vJ/giphy.gif") center no-repeat;
}

.icon-centered {
  display: flex;
  line-height: 0;
  vertical-align: middle;
}

.dot {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-successNormal);
}

.line-svg {
  display: block;
}

/* .output_canvas {
  translate: 0 -10px;
} */

.output_canvas {
  object-fit: contain;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: calc(100vh - 120px);
}

.inactive_canvas {
  filter: brightness(0.5);
}

.overlay {
  transform: scale(0.8) translateY(10%);
  opacity: 0.5;
  filter: brightness(20) saturate(100%) invert(21%) sepia(92%) saturate(500%) hue-rotate(180deg) brightness(95%) contrast(85%);
}

.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.angle-display {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgba(255, 255, 255, 0.4);
  padding: 10px;
  border-radius: 5px;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: left;
  width: 15%;

}

.timer-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-successNormal);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(var(--color-successNormal), 0.5);
}

.timer-circle.recording {
  background-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  animation: pulse 1s infinite;
}

.timer-number {
  color: white;
  font-size: 2rem;
  font-weight: bold;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.recording-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.recording-dot {
  width: 12px;
  height: 12px;
  background-color: #ef4444;
  border-radius: 50%;
}

.progress-bar {
  width: 120px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin-top: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #ef4444;
  border-radius: 3px;
  transition: width 0.1s ease-out;
}

.timer-container {
  padding: 24px;
}

.countdown-timer {
  border-color: var(--color-successNormal);
}

.recording-timer {
  border-color: #ef4444;
}




@media (min-width: 1024px) {
  .pose {
    margin: 3rem 3rem;
  }

  .input_video,
  .output_canvas {
    margin: 1rem 0;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }
}
</style>
