<template>
  <div class="w-full h-full flex flex-col">
    <div class="flex flex-row w-full flex-grow overflow-hidden">
      <div class="flex flex-col w-full h-full justify-center items-center overflow-hidden">
        <video
          v-show="false"
          ref="source"
          class="input_video"
        />
        <div
          ref="landmarkContainer"
          class="landmark-grid-container"
        />
      </div>
    </div>
    <!-- Display debug information -->
    <div
      v-if="exerciseDevmode"
      class="debug-display"
    >
      <h2>Left Hand: {{ leftHand.x.toFixed(2) }}, {{ leftHand.y.toFixed(2) }}</h2>
      <h2>Right Hand: {{ rightHand.x.toFixed(2) }}, {{ rightHand.y.toFixed(2) }}</h2>
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

const exerciseDevmode = useStorage('exercise-devmode', false)
const personDetectedTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const isPersonVisibleState = ref(false)

const source = ref<HTMLVideoElement | null>(null);
const landmarkContainer = ref<HTMLDivElement | null>(null);
const loadingCanvas = ref(true);

const mediapipeResults = ref<Results | null>(null);
const exerciseInitialNormalizedLandmarks = ref<NormalizedLandmarkList | null>(null);

const leftHand = ref({ x: 0, y: 0, visible: false });
const rightHand = ref({ x: 0, y: 0, visible: false });

const currentAngle = ref(0);
const pivotIndex = ref(14);
const movableIndex = ref(16);

const isPersonVisible = computed((): boolean => {
  if (
    !mediapipeResults.value ||
    !mediapipeResults.value.poseLandmarks ||
    !mediapipeResults.value.poseLandmarks.length
  ) {
    return false;
  }


  const leftShoulder = mediapipeResults.value.poseLandmarks[11];
  const rightShoulder = mediapipeResults.value.poseLandmarks[12];

  if (!leftShoulder || !rightShoulder) return false;

  return (leftShoulder.visibility ?? 0) > 0.5 && (rightShoulder.visibility ?? 0) > 0.5;
});

watch(mediapipeResults, (results) => {
  if (results && results.poseLandmarks) {
    const leftWrist = results.poseLandmarks[15];
    if (leftWrist && (leftWrist.visibility ?? 0) > 0.5) {
      leftHand.value = {
        x: leftWrist.x,
        y: leftWrist.y,
        visible: true
      };
    } else {
      leftHand.value.visible = false;
    }


    const rightWrist = results.poseLandmarks[16];
    if (rightWrist && (rightWrist.visibility ?? 0) > 0.5) {
      rightHand.value = {
        x: rightWrist.x,
        y: rightWrist.y,
        visible: true
      };
    } else {
      rightHand.value.visible = false;
    }
  }
});

watch(isPersonVisible, (visible) => {
  isPersonVisibleState.value = visible;
}, { immediate: true });

onMounted(async () => {
  await getAvailableVideoDevices();
  if (source.value && landmarkContainer.value) {
    source.value.onloadedmetadata = async () => {
      if (!source.value || !landmarkContainer.value) {
        console.log("source or landmark container missing")
        return;
      }


      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = source.value.videoWidth;
      dummyCanvas.height = source.value.videoHeight;

      await new PoseService(
        dummyCanvas,
        source.value,
        dummyCanvas.width,
        dummyCanvas.height,
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
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
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

      const realSenseCamera = videoDevices.value.find(device =>
        device.label && device.label.toLowerCase().includes('realsense') && device.label.toLowerCase().includes('rgb')
      );

      if (realSenseCamera) {
        selectedDeviceId.value = realSenseCamera.deviceId;
      } else if (faceTimeCamera) {
        selectedDeviceId.value = faceTimeCamera.deviceId;
      } else {
        selectedDeviceId.value = videoDevices.value[0].deviceId;
      }
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

defineExpose({
  leftHand: readonly(leftHand),
  rightHand: readonly(rightHand),
  isPersonVisible: readonly(isPersonVisibleState)
});
</script>

<style scoped>
.debug-display {
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

.camera-controls {
  margin-top: 10px;
}

.camera-selector {
  width: 100%;
  padding: 5px;
  border-radius: 3px;
  border: 1px solid #ccc;
}
</style>