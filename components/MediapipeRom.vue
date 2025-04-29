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
          :class="{ loading_canvas: loadingCanvas, inactive_canvas: !isPersonVisible }"
          :width="canvasWidth"
          :height="canvasHeight"
        />
        <img
          v-if="!isPersonVisible"
          src="/images/overlay_white.png"
          class="absolute h-full output_canvas overlay"
        >
        <motion.div
          v-if="isPersonVisible"
          :initial="{ opacity: 0, scale: 0 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.3 }"
          class="absolute flex items-center justify-center z-20 dot"
        >
          <Icon
            name="material-symbols-light:check-rounded"
            class="text-white h-8 w-8 icon-centered"
          />
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
      <h2>Reference Angle: {{ referenceAngle.toFixed(2) }}</h2>
      <h2>Target Angle: {{ targetAngle }}</h2>
      <h2>Threshold: ±{{ thresholdDeg }}°</h2>
      <h2>Position Valid: {{ isPersonVisible ? 'Yes' : 'No' }}</h2>
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
import { PoseService } from "~/shared/utils/pose_service";
import type { Results } from "@mediapipe/pose";
import type { NormalizedLandmarkList } from "@mediapipe/drawing_utils";
import PoseCombinations from '~/assets/pose_config.json'
import { motion } from 'motion-v'

const exerciseDevmode = useStorage('exercise-devmode', false)

const canvasWidth = computed(() =>
  Math.min(window.innerWidth, window.innerHeight * (16 / 9))
);
const canvasHeight = computed(() =>
  Math.min(window.innerHeight * 0.9, canvasWidth.value * (9 / 16))
);

const exerciseStore = useExerciseStore();

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
    cleanup();
    toneForRom.stopTone();
    return false;
  }

  const A = mediapipeResults.value.poseWorldLandmarks[movableIndex.value];
  const B = mediapipeResults.value.poseWorldLandmarks[pivotIndex.value];
  const C = mediapipeResults.value.poseWorldLandmarks[referenceIndex.value];

  if (!A || !B || !C) return false;

  const angleDifference = Math.abs(referenceAngle.value - targetAngle.value);

  if (angleDifference <= thresholdDeg.value || exerciseStore.startedRecording) {
    toneForRom.startTone();
    return true;
  } else {
    console.log(`Out of reference: current ${referenceAngle.value.toFixed(2)}° vs target ${targetAngle.value}°`);
    toneForRom.stopTone();
    cleanup();
    return false;
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

function saveLandmarks() {
  exerciseInitialNormalizedLandmarks.value =
    mediapipeResults.value?.poseLandmarks ?? null;
  console.log("Landmarks saved");
  exerciseStore.startedRecording = true;
}

function calculateAngle() {
  console.log("calculateVectorAngle");
  exerciseStore.resultAngle = currentAngle.value;
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
  console.log("cleanup done");
  exerciseStore.startedRecording = false;
}

onMounted(async () => {
  await getAvailableVideoDevices();
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
        canvas.value.width,  // Use actual video dimensions
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
        smoothSegmentation: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        selfieMode: true,
      });
      await startCamera();
    };

    // Request camera access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      source.value.srcObject = stream;
      source.value.play();
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }

  toneForRom.startTone();


  if (!props.romCombination) {
    console.warn("No ROM combination provided");
    toneForRom.stopTone();
  }
});

const videoDevices = ref<MediaDeviceInfo[]>([]);
const selectedDeviceId = ref<string>("");

async function getAvailableVideoDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = devices.filter(device => device.kind === 'videoinput');

    if (videoDevices.value.length > 0) {
      const faceTimeCamera = videoDevices.value.find(device =>
        device.label && device.label.toLowerCase().includes('facetime')
      );

      selectedDeviceId.value = faceTimeCamera ?
        faceTimeCamera.deviceId :
        videoDevices.value[0].deviceId;
    }
  } catch (error) {
    console.error("Error getting video devices:", error);
  }
}

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
});

onUnmounted(() => {
  toneForRom.stopTone();
});



defineExpose({
  saveLandmarks,
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
  text-align: center;
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
</style>
