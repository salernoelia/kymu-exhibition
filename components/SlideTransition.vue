<template>
    <div
        class="transition-container"
        :class="{ 'active': active }"
    >
        <div class="circle-layer circle-layer-1" />
        <div class="circle-layer circle-layer-2" />
        <div class="circle-layer circle-layer-3" />
        <div class="overlay-content">
            <h1>{{ text }}</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    active: boolean;
    text: string;
}>();
</script>

<style scoped>
.transition-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    pointer-events: none;
    overflow: hidden;
}

.circle-layer {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 300vw;
    aspect-ratio: 2/1;
    border-radius: 50% 50% 0 0;
    transform: translateX(-50%) translateY(100%);
    transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.circle-layer-1 {
    background-color: var(--color-primaryNormal, #6366f1);
    transition-delay: 0s;
}

.circle-layer-2 {
    background-color: var(--color-primaryDark, #4f46e5);
    transition-delay: 0.15s;
}

.circle-layer-3 {
    background-color: var(--color-primaryDarker, #4338ca);
    transition-delay: 0.3s;
}

.active .circle-layer-1 {
    transform: translateX(-50%) translateY(30%);
}

.active .circle-layer-2 {
    transform: translateX(-50%) translateY(25%);
}

.active .circle-layer-3 {
    transform: translateX(-50%) translateY(40%);
}

.overlay-content {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    padding: 2rem;
    opacity: 0;
    transition: opacity 0.5s ease-in-out 0.5s;
    z-index: 1010;
}

.active .overlay-content {
    opacity: 1;
}
</style>