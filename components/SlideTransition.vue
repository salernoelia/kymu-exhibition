<template>
    <div
        class="transition-container"
        :class="{ 'active': active }"
    >
        <div class="circle-layer circle-layer-1" />
        <div class="circle-layer circle-layer-2" />
        <div class="circle-layer circle-layer-3" />
        <div class="circle-layer circle-layer-4" />
        <div class="overlay-content">
            <Icon name="svg-spinners:bouncing-ball" />
            <h1>{{ text }}</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
const soundPlayer = useSoundPlayer();

const props = defineProps<{
    active: boolean;
    text: string;
}>();


watch(
    () => props.active,
    (newValue) => {
        if (newValue) {
            setTimeout(() => {
                soundPlayer.playTransitionSound();
            }, 100);
        }
    }
);
</script>

<style scoped>
h1 {
    font-size: 5rem;
    font-weight: 200;
}


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
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    transform: translateY(100%);
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.circle-layer-1 {
    background-color: var(--color-primaryNormal, #6366f1);
    transition-delay: 0s;
    /* border-radius: 100% 100% 0 0; */
}

.circle-layer-2 {
    background-color: var(--color-primaryDark, #4f46e5);
    transition-delay: 0.15s;
    /* border-radius: 100% 100% 0 0; */
}

.circle-layer-3 {
    background-color: var(--color-primaryDarker, #4338ca);
    transition-delay: 0.3s;
    /* border-radius: 100% 100% 0 0; */
}

.circle-layer-4 {
    background-color: var(--color-primaryDarker, #3730a3);
    transition-delay: 0.1s;
    z-index: -2;
}

.active .circle-layer-1 {
    transform: translateY(0);
}

.active .circle-layer-2 {
    transform: translateY(100px);
}

.active .circle-layer-3 {
    transform: translateY(200px);
}

.active .circle-layer-4 {
    transform: translateY(0);
}

.transition-container.active .circle-layer {
    transition-duration: 0.7s;
}

.transition-container:not(.active) .circle-layer {
    transition-duration: 0.7s;
    transition-delay: 0s;
}

.transition-container:not(.active) .circle-layer-1 {
    transition-delay: 0.3s;
}

.transition-container:not(.active) .circle-layer-2 {
    transition-delay: 0.15s;
}

.transition-container:not(.active) .circle-layer-3 {
    transition-delay: 0.05s;
}

.overlay-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    padding: 2rem;
    opacity: 0;
    transition: opacity 0.5s ease-in-out 0.4s;
    z-index: 1010;
}

.active .overlay-content {
    opacity: 1;
}

.transition-container:not(.active) .overlay-content {
    transition: opacity 0.3s ease-in-out;
}
</style>