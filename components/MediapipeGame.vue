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
      <h2 v-if="handService">FPS: {{ handService.fps.toFixed(1) }}</h2>

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
        <div class="zoom-controls">
          <label>Zoom: {{ zoom.toFixed(2) }}</label>
          <input
            v-model.number="zoom"
            type="range"
            min="1"
            max="2"
            step="0.01"
            @input="updateZoom"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { HandService } from "~/utils/hand_service";
import type { Results } from "@mediapipe/hands";
import type { HandPosition } from "~/utils/hand_service";

const exerciseDevmode = useStorage('exercise-devmode', false)
const isPersonVisibleState = ref(false)

const source = ref<HTMLVideoElement | null>(null);
const landmarkContainer = ref<HTMLDivElement | null>(null);
const loadingCanvas = ref(true);

const mediapipeResults = ref<Results | null>(null);

const leftHand = ref<HandPosition>({ x: 0, y: 0, visible: false });
const rightHand = ref<HandPosition>({ x: 0, y: 0, visible: false });

let handService: HandService | null = null;

const zoom = useStorage('zoom-factor', 1.0);

function updateZoom() {
  if (handService) {
    handService.setZoom(zoom.value);
  }
}

const isPersonVisible = computed((): boolean => {
  return leftHand.value.visible || rightHand.value.visible;
});

watch(isPersonVisible, (visible) => {
  isPersonVisibleState.value = visible;
}, { immediate: true });

onMounted(async () => {
  await getAvailableVideoDevices(videoDevices, selectedDeviceId);
  if (source.value && landmarkContainer.value) {
    source.value.onloadedmetadata = async () => {
      if (!source.value || !landmarkContainer.value) {
        console.log("source or landmark container missing")
        return;
      }

      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = source.value.videoWidth;
      dummyCanvas.height = source.value.videoHeight;

      handService = new HandService(
        dummyCanvas,
        source.value,
        dummyCanvas.width,
        dummyCanvas.height,
        landmarkContainer.value,
        loadingCanvas,
        mediapipeResults,
        leftHand,
        rightHand,
        isPersonVisibleState
      );

      await handService.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
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

onUnmounted(() => {
  cleanup();
});

function cleanup() {
  if (source.value?.srcObject) {
    const stream = source.value.srcObject as MediaStream;
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      track.stop();
      console.log('Stopped video track:', track.label);
    });
    source.value.srcObject = null;
  }

  if (handService) {
    try {
      handService.cleanup();
      console.log('HandService cleaned up');
    } catch (err) {
      console.error('Error cleaning up HandService:', err);
    }
    handService = null;
  }

  leftHand.value = { x: 0, y: 0, visible: false };
  rightHand.value = { x: 0, y: 0, visible: false };
  isPersonVisibleState.value = false;
  mediapipeResults.value = null;

  videoDevices.value = [];
  selectedDeviceId.value = "";

  console.log('MediapipeGame cleanup completed');
}

defineExpose({
  leftHand: readonly(leftHand),
  rightHand: readonly(rightHand),
  isPersonVisible: readonly(isPersonVisibleState),
  getVideoStream: () => handService?.getVideoStream(),
  cleanup
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
  z-index: 999;
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

.zoom-controls {
  margin-top: 10px;
}
</style>