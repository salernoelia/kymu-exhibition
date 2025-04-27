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
          :class="{ loading_canvas: loadingCanvas }"
          :width="canvasWidth"
          :height="canvasHeight"
        />
        <div
          ref="landmarkContainer"
          class="landmark-grid-container"
        />
      </div>
    </div>
    <!-- Display the angle information -->
    <div class="angle-display">
      <p>Exercise: {{ currentExercise?.name }}</p>
      <p>Current Angle: {{ currentAngle.toFixed(2) }}</p>
      <p>Pain Moments: {{ exerciseStore.painMomentAngles }}</p>
      <p>{{ romCombination }}</p>
      <p>{{ isPersonVisible }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PoseService } from "~/shared/utils/pose_service";
import type { Results } from "@mediapipe/pose";
import type { NormalizedLandmarkList } from "@mediapipe/drawing_utils";
import PoseCombinations from '~/assets/pose_config.json'

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
// const referenceAngle = ref(0);

const pivotIndex = ref(14);
const movableIndex = ref(16);
const referenceIndex = ref(23);
const thresholdDeg = ref(30);

const toneForRom = useToneForRom(currentAngle);

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
      ?.visibility ?? 0) < 0.8
  ) {
    toneForRom.stopTone();

    return false;
  }

  const A = mediapipeResults.value.poseWorldLandmarks[movableIndex.value];
  const B = mediapipeResults.value.poseWorldLandmarks[pivotIndex.value];
  const C = mediapipeResults.value.poseWorldLandmarks[referenceIndex.value];


  if (!A || !B || !C) return false;

  toneForRom.startTone();
  return true;
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
  const { pivot, movable, reference, threshold } = PoseCombinations[combination];
  pivotIndex.value = pivot;
  movableIndex.value = movable;
  referenceIndex.value = reference;
  thresholdDeg.value = threshold;
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
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        selfieMode: true,
      });
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

  setTimeout(() => {
    if (!props.romCombination) {
      toneForRom.stopTone();
      exerciseStore.resetExperience();
    }
  }, 1000);
});



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
