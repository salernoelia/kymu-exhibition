<template>
    <div
        class="slide-overlay"
        :class="{ 'active': active }"
    >
        <div class="overlay-content">
            <h2>{{ text }}</h2>
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
.slide-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-primaryNormal, #6366f1);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.5s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slide-overlay.active {
    transform: translateX(0);
}

.overlay-content {
    color: white;
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    padding: 2rem;
}
</style>