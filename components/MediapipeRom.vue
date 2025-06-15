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
          v-if="!isPersonVisibleState && romId === 'exercise_0' && !complete"
          src="/public/images/shoulder_idle.png"
          class="absolute h-full output_canvas overlay"
        >
        <img
          v-if="isPersonVisibleState && romId === 'exercise_0' && !complete && !exerciseStore.startedRecording"
          src="/public/images/shoulder_success.png"
          class="absolute h-full output_canvas overlay"
        >
        <img
          v-if="!isPersonVisibleState && romId === 'exercise_2' && !complete"
          src="/public/images/elbow_idle.png"
          class="absolute h-full output_canvas overlay"
        >
        <img
          v-if="isPersonVisibleState && romId === 'exercise_2' && !complete && !exerciseStore.startedRecording"
          src="/public/images/elbow_success.png"
          class="absolute h-full output_canvas overlay"
        >
        <!-- <DotLottieVue
          v-if="exerciseStore.startedRecording && romId=== 'exercise_0'"
          autoplay
          loop
          class="absolute h-full output_canvas overlay"
          src="/lottifiles/shoulder_full_body.lottie"
        /> -->

        <!-- Countdown Timer (before recording starts) -->
        <motion.div
          v-if="isPersonVisibleState && showCheckIcon && startRecordingUserAssessmentTimeout"
          :initial="{ opacity: 0, scale: 0 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0 }"
          :transition="{ duration: 0.3, exit: { duration: 0.15 } }"
          class="absolute flex flex-col items-center justify-center z-20 timer-container countdown-timer"
        >
          <div class="timer-circle">
            <span class="timer-number">
              {{ countdownSeconds }}
            </span>
          </div>
          <h2 class="text-white bg-[--color-dangerNormal] p-2 translate-y-4">
            Stand still like the shown position
          </h2>
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

          <div class="timer-circle recording">
            <span class="timer-number">{{ recordingSeconds }}</span>
          </div>
          <h2
            class="text-white bg-[--color-successNormal] p-2 translate-y-4"
            v-if="currentExercise?.id === 'exercise_0'"
          >
            Lift your full Arm
          </h2>
          <h2
            class="text-white bg-[--color-successNormal] p-2 translate-y-4"
            v-else-if="currentExercise?.id === 'exercise_2'"
          >
            Lift your hand
          </h2>

        </motion.div>

        <!-- Error Message Display -->
        <motion.div
          v-if="errorMessage"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: 20 }"
          :transition="{ duration: 0.3 }"
          class="absolute flex flex-col items-center justify-center z-100 bg-[--color-dangerNormal] text-white px-8 py-4 text-xl rounded-lg shadow-2xl z-50 text-center"
        >
          <Icon
            name="material-symbols:warning-outline-rounded"
            class="w-7 h-7 mr-3 inline-block "
          />
          <span class="">{{ errorMessage }}</span>
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

// Error Message State
const ERROR_MESSAGE_DURATION_MS = 2500;
const errorMessage = ref<string | null>(null);
let errorTimeout: ReturnType<typeof setTimeout> | null = null;

function showErrorMessage(message: string) {
  soundPlayer.playWarningSound()
  errorMessage.value = message;
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }
  errorTimeout = setTimeout(() => {
    errorMessage.value = null;
  }, ERROR_MESSAGE_DURATION_MS);
}

//  Recording 
const USER_DETECTED_START_EXERCISE_TIMEOUT_MS = ref(2000);
const PERSON_DETECTION_DEBOUNCE_MS = ref(500);
const personDetectionDebounceTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const stablePersonVisible = ref(false);
const RECORDING_DURATION_MS = ref(7000);
const UNEXPECTED_MOVEMENT_THRESHOLD = ref(0.1);
const complete = ref(false);


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

// Canvas & Camera
const source = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const landmarkContainer = ref<HTMLDivElement | null>(null);
const loadingCanvas = ref(true);

const canvasWidth = computed(() =>
  Math.min(window.innerWidth, window.innerHeight * (16 / 9))
);
const canvasHeight = computed(() =>
  Math.min(window.innerHeight * 0.9, canvasWidth.value * (9 / 16))
);

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

// Angle Recording
const exerciseDevmode = useStorage('exercise-devmode', false);
const personDetectedTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const startRecordingUserAssessmentTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const recordingTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const startTimeUserDetectedTimeout = ref();
const recordingStartTime = ref<number | null>(null);
const isPersonVisibleState = ref(false)
const showCheckIcon = ref(false)
const shouldPlayTone = ref(false);
const currentAngle = ref(0);
const maxAngleAchieved = ref(0);
const pivotIndex = ref(14);
const movableIndex = ref(16);
const referenceIndex = ref(23);
const thresholdDeg = ref(25);
const targetAngle = ref(0)

const exerciseStore = useExerciseStore();
const soundPlayer = useSoundPlayer();
const toneForRom = useToneForRom(currentAngle);

function calculateAngle() {
  console.log("calculateVectorAngle");
  exerciseStore.resultAngle = maxAngleAchieved.value;
}


watch(shouldPlayTone, (should) => {
  if (should && isPersonVisibleState.value) {
    toneForRom.startTone();
  } else {
    toneForRom.stopTone();
  }
});

const currentExercise = computed(() => exerciseStore.currentExercise);

const props = defineProps<{
  romCombination: string;
  romId: string;
}>();


const mediapipeResults = ref<Results | null>(null);
const exerciseInitialNormalizedLandmarks = ref<NormalizedLandmarkList | null>(
  null
);

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
  if (personDetectionDebounceTimeout.value) {
    clearTimeout(personDetectionDebounceTimeout.value);
    personDetectionDebounceTimeout.value = null;
  }

  personDetectionDebounceTimeout.value = setTimeout(() => {

    if (stablePersonVisible.value !== visible) {
      stablePersonVisible.value = visible;
      handlePersonVisibilityChange(visible);
    }
    personDetectionDebounceTimeout.value = null;
  }, PERSON_DETECTION_DEBOUNCE_MS.value);
}, { immediate: true });

function handlePersonVisibilityChange(visible: boolean) {
  isPersonVisibleState.value = visible;

  if (visible) {
    soundPlayer.playDetectedSound();
    toneForRom.startTone();
    showCheckIcon.value = true;
    startTimer();

    if (personDetectedTimeout.value) {
      clearTimeout(personDetectedTimeout.value);
      personDetectedTimeout.value = null;
    }

    if (!exerciseStore.startedRecording) {
      if (startRecordingUserAssessmentTimeout.value) {
        clearTimeout(startRecordingUserAssessmentTimeout.value);
      }
      startTimeUserDetectedTimeout.value = Date.now();
      currentTime.value = Date.now();

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
      showErrorMessage('Please stay in the frame to continue.');
      resetRecordingUserAssessment();
    } else {
      stopTimer();
      if (!errorTimeout) {
        cleanup();
      }
    }
  }
}

watch(currentAngle, (newAngle) => {
  if (exerciseStore.startedRecording) {
    if (newAngle > 180) {
      showErrorMessage('Movement out of range. Please adjust.');
      console.log('Invalid angle detected:', newAngle, '- resetting recording');
      resetRecordingUserAssessment();
      return;
    }

    if (hasSubstantialUnexpectedMovement()) {
      showErrorMessage('Too much body movement. Please try to stay still.');
      console.log('Substantial unexpected movement detected - resetting recording');
      resetRecordingUserAssessment();
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

  cleanup();


  if (startRecordingUserAssessmentTimeout.value) {
    clearTimeout(startRecordingUserAssessmentTimeout.value);
    startRecordingUserAssessmentTimeout.value = null;
  }
  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }

  maxAngleAchieved.value = 0;
  currentAngle.value = 0;
  isPersonVisibleState.value = false;
  showCheckIcon.value = false;
  recordingStartTime.value = null;

  console.log(`ROM combination updated to: ${combination} with target angle: ${targetAngle.value}°`);
}

function hasSubstantialUnexpectedMovement(): boolean {
  if (!exerciseInitialNormalizedLandmarks.value || !mediapipeResults.value?.poseLandmarks) {
    console.warn("Cannot assess unexpected movement: initial or current landmarks missing.");
    return false;
  }

  const initialLandmarks = exerciseInitialNormalizedLandmarks.value;
  const currentLandmarks = mediapipeResults.value.poseLandmarks;

  const landmarksToMonitorIndices = [pivotIndex.value, referenceIndex.value];

  for (const index of landmarksToMonitorIndices) {
    if (index === movableIndex.value) continue;

    const initial = initialLandmarks[index];
    const current = currentLandmarks[index];

    if (!initial || !current) {
      console.warn(`Landmark ${index} missing in initial or current set for movement check.`);
      continue;
    }

    const dx = current.x - initial.x;
    const dy = current.y - initial.y;
    const displacement = Math.sqrt(dx * dx + dy * dy);

    if (displacement > UNEXPECTED_MOVEMENT_THRESHOLD.value) {
      console.log(`Substantial unexpected movement detected for landmark index ${index}. Displacement: ${displacement.toFixed(3)} > threshold: ${UNEXPECTED_MOVEMENT_THRESHOLD.value}`);
      return true;
    }
  }
  return false;
}

function startRecordingUserAssessment() {
  soundPlayer.playRecordingSound();
  exerciseInitialNormalizedLandmarks.value =
    mediapipeResults.value?.poseLandmarks ?? null;
  console.log("Recording started");
  exerciseStore.startedRecording = true;
  recordingStartTime.value = Date.now();
  currentTime.value = Date.now();
  maxAngleAchieved.value = 0;
  shouldPlayTone.value = true;
  startTimer();

  recordingTimeout.value = setTimeout(() => {
    if (maxAngleAchieved.value > 5 && maxAngleAchieved.value <= 180) {
      completeRecordingUserAssessment();
    } else {
      console.log("Recording timeout reached but insufficient movement detected:", maxAngleAchieved.value);
      if (maxAngleAchieved.value <= 5) {
        showErrorMessage('Please perform a larger movement to complete the exercise.');
      } else {
        showErrorMessage('Movement out of range. Please try again.');
      }
      resetRecordingUserAssessment();
    }
  }, RECORDING_DURATION_MS.value);
}


function resetRecordingUserAssessment() {
  console.log("Resetting recording");

  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }

  stopTimer();
  exerciseStore.startedRecording = false;
  recordingStartTime.value = null;
  maxAngleAchieved.value = 0;
  exerciseInitialNormalizedLandmarks.value = null;
  shouldPlayTone.value = false;
  nextTick(() => {
    shouldPlayTone.value = true;
  });
}

function completeRecordingUserAssessment() {
  console.log("Recording completed - max angle achieved:", maxAngleAchieved.value);
  complete.value = true;

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

onBeforeUnmount(() => {
  toneForRom.stopTone();
  stopTimer();

  if (startRecordingUserAssessmentTimeout.value) {
    clearTimeout(startRecordingUserAssessmentTimeout.value);
  }
  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
  }
  if (personDetectionDebounceTimeout.value) {
    clearTimeout(personDetectionDebounceTimeout.value);
  }
  errorMessage.value = null;
  if (errorTimeout) {
    clearTimeout(errorTimeout);
    errorTimeout = null;
  }
});

onUnmounted(() => {
  toneForRom.stopTone();
  stopTimer();
  if (personDetectionDebounceTimeout.value) {
    clearTimeout(personDetectionDebounceTimeout.value);
  }
  errorMessage.value = null;
  if (errorTimeout) {
    clearTimeout(errorTimeout);
    errorTimeout = null;
  }
});

function cleanup() {
  currentAngle.value = 0;
  exerciseStore.resultAngle = 0;
  exerciseInitialNormalizedLandmarks.value = null;
  maxAngleAchieved.value = 0;
  recordingStartTime.value = null;
  stopTimer();

  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }

  if (personDetectionDebounceTimeout.value) {
    clearTimeout(personDetectionDebounceTimeout.value);
    personDetectionDebounceTimeout.value = null;
  }

  errorMessage.value = null;
  if (errorTimeout) {
    clearTimeout(errorTimeout);
    errorTimeout = null;
  }

  console.log("cleanup done");
  exerciseStore.startedRecording = false;
}


defineExpose({
  startRecordingUserAssessment,
  calculateAngle,
  cleanup,
});

</script>

<style scoped lang="scss">
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



.output_canvas {
  object-fit: contain;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: calc(100vh - 120px);
  transform: translateY(1rem);
}

.inactive_canvas {
  filter: brightness(0.8);
}

.overlay {
  transform: scale(1.3) translateY(4.75%);
  opacity: 1;
  mix-blend-mode: soft-light;
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

  h2 {
    font-weight: 400;
  }

}

.timer-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-dangerNormal);
  display: flex;
  justify-content: center;
  align-items: center;
  // box-shadow: 0 0 20px rgba(var(--color-successNormal), 0.5);
}

.timer-circle.recording {
  background-color: var(--color-successNormal);
  animation: pulse 1s infinite;
}

.timer-number {
  color: white;
  font-size: 3rem;
  font-weight: 200;
}

.recording-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}




.timer-container {
  padding: 24px;
}

.countdown-timer {
  border-color: var(--color-successNormal);
}

.recording-timer {
  border-color: var(--color-dangerNormal);
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
    // box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }

  50% {
    transform: scale(1.05);
    // box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
  }

  100% {
    transform: scale(1);
    // box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }
}
</style>
