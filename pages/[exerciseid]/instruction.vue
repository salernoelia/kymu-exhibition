<template>
    <div class="w-full h-full">
        <div class="center-full">
            <div
                v-if="exerciseStore.currentExercise?.therapist_added_image_urls"
                class="flex flex-row c items-center"
            >
                <template
                    v-for="(image, index) in exerciseStore.currentExercise?.therapist_added_image_urls"
                    :key="index"
                >
                    <motion.div
                        :initial="{ opacity: 0, scale: 0 }"
                        :animate="{ opacity: 1, scale: 1 }"
                        :transition="{
                            duration: 0.4,
                            delay: index * 0.5,
                            scale: { type: 'spring', stiffness: 110, damping: 20 }
                        }"
                    >
                        <img
                            :src="`/images/instructions/${image}.png`"
                            :alt="image"
                            class="img"
                        >
                    </motion.div>

                    <motion.div
                        v-if="index < (exerciseStore.currentExercise?.therapist_added_image_urls.length - 1)"
                        :initial="{ opacity: 0, scale: 0 }"
                        :animate="{ opacity: 1, scale: 1 }"
                        :transition="{
                            duration: 0.4,
                            delay: index * 0.5 + 0.25,
                            scale: { type: 'spring', stiffness: 100, damping: 10 }
                        }"
                    >
                        <Icon
                            :key="`arrow-${index}`"
                            name="ic:baseline-arrow-forward"
                            style="color: var(--color-inactiveNormal);"
                            class="icon"
                        />
                    </motion.div>
                </template>
            </div>
            <h1>{{ exerciseStore.currentExercise?.name }}</h1>
            <h2>{{ exerciseStore.currentExercise?.description }}</h2>
        </div>

        <KeyInstruction :instructions="[
            { button: 'Enter', action: 'continue' },
            { button: 'Esc', action: 'cancel' }
        ]" />
    </div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v';

const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl();

const route = useRoute();

watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "ok") {
            const currentExerciseId = route.params.exerciseid;

            console.log(`Attempting navigation from instruction page. Exercise ID from route.params: '${currentExerciseId}'`);

            if (typeof currentExerciseId === 'string' && currentExerciseId.trim() !== '') {
                const targetPath = `/${currentExerciseId}/exercise`;
                console.log(`Navigating to: ${targetPath}`);
                navigateTo(targetPath);
            } else {
                console.error('Error: exerciseid is invalid or missing from route.params when "ok" key pressed.', route.params);
                // Fallback or error handling, e.g., navigate to home or show a message
                // navigateTo('/'); 
            }
        }
    }
);

onMounted(() => {
    console.log('Instruction page mounted. Initial route.params:', route.params);
    if (!route.params.exerciseid) {
        console.warn('Warning: exerciseid is missing from route.params on mount.');
    }
});
</script>

<style scoped>
.img {
    width: 32vh;
    aspect-ratio: 1/2;
    filter: brightness(0) saturate(100%) invert(21%) sepia(92%) saturate(500%) hue-rotate(180deg) brightness(95%) contrast(85%);
}

.icon {
    font-size: 5rem;
    font-weight: 100;
}
</style>