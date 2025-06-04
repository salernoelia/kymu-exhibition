<template>
    <div
        class="container absolute top-4 flex items-center justify-center"
        :class="getTypeClass(type)"
    >
        <Icon
            v-if="type === 'caution'"
            name="material-symbols:info-outline"
            class="mr-2 text-xl"
        />
        <h2 style="line-height: 0.5; font-size: 2rem; font-weight: 300;">
            {{ getTypeLabel(type) }}
        </h2>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    type: "range-of-motion" | "p5_game" | "caution" | "tutorial";
}>()

const getTypeClass = (type: string) => {
    switch (type) {
        case 'tutorial':
            return 'green';
        case 'p5_game':
            return 'orange';
        case 'range-of-motion':
            return 'orange';
        case 'caution':
            return 'caution';
        default:
            return 'green';
    }
}

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'tutorial':
            return 'Tutorial';
        case 'p5_game':
            return 'Game';
        case 'range-of-motion':
            return 'Assessment';
        case 'caution':
            return 'Caution';
        default:
            return 'Tutorial';
    }
}
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
    background-color: var(--color-warningLightHover);
    border-color: var(--color-warningNormal);
    color: var(--color-warningDark);
}

.green {
    background-color: var(--color-successLightHover);
    border-color: var(--color-successNormal);
    color: var(--color-successDark);
}

.caution {
    background-color: var(--color-secondaryLightHover);
    border-color: var(--color-secondaryNormal);
    color: var(--color-secondaryDark);

}
</style>