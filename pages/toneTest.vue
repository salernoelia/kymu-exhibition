<template>
    <div class="center-full">
        <input
            id="tone"
            v-model="currentAngle"
            min="0"
            max="180"
            type="range"
            name="tone"
        >
        <p>Current angle: {{ currentAngle }}</p>
        <button @click="testTone">Test Tone Manually</button>
    </div>
</template>

<script setup>
const currentAngle = ref(0);

const toneForRom = useToneForRom(currentAngle);

watch(currentAngle, (newVal) => {
    console.log('Slider changed to:', newVal);
});

function testTone() {
    currentAngle.value = Math.floor(Math.random() * 180);
    console.log('Manually set angle to:', currentAngle.value);
}

onMounted(() => {
    console.log('Starting tone with initial angle:', currentAngle.value);
    toneForRom.startTone();
});

onUnmounted(() => {
    toneForRom.stopTone();
});
</script>

<style scoped>
input[type="range"] {
    width: 300px;
}

button {
    padding: 10px 20px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>