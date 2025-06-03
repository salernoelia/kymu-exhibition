<template>
    <span
        v-if="variant == 'next'"
        class="button-label"
    >
        <Icon
            class="ico"
            name="ic:baseline-arrow-forward"
        />
    </span>
    <span
        v-if="variant == 'reset'"
        class="button-label"
    >
        <Icon
            class="ico"
            name="ic:baseline-close"
        />
    </span>
</template>

<script setup lang="ts">
type Buttons = "next" | "reset";

defineProps<{
    variant?: Buttons;
}>();
</script>

<style scoped>
.button-label {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    color: var(--color-primaryNormal);
    border: 2px var(--color-primaryNormal) solid;
    padding: 0.2rem 0.6rem;
    border-radius: 50%;
    aspect-ratio: 1/1;
    width: 4rem;
    height: 4rem;
    font-weight: 500;
    line-height: 1.2;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
}

.text {
    font-size: 1.8rem;
    color: var(--color-inactiveNormal);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    line-height: 0;
}
</style>