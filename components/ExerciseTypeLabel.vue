<template>
    <div
        class="container absolute top-4 flex items-center justify-center"
        :class="type === 'range-of-motion' ? 'orange' : 'green'"
    >
        <h2 style="line-height: 0.5; font-size: 2rem; font-weight: 300;">
            {{ type === 'range-of-motion' ? 'Assessment' : 'Game' }}
        </h2>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    type: "range-of-motion" | "p5_game";
}>()
</script>

<style scoped>
.container {
    border: 2px solid;
    border-radius: 1rem;
    padding: 1rem;
    width: fit-content;
    height: fit-content;
}

.orange {
    background-color: var(--color-secondaryLightHover);
    border-color: var(--color-secondaryNormal);
    color: var(--color-secondaryDark);
}

.green {
    background-color: var(--color-successLightHover);
    border-color: var(--color-successNormal);
    color: var(--color-successDark);
}
</style>