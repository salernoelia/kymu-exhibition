<template>
    <div class="w-full h-full">
        <div class="center-full">
            <ExerciseTypeLabel type="tutorial" />
            <div
                v-if="exerciseStore.currentExercise"
                class="flex flex-row c items-center"
            >
                <!-- <template
                    v-for="(image, index) in exerciseStore.currentExercise?.therapist_added_image_urls"
                    :key="index"
                > -->
                <DotLottieVue
                    v-if="exerciseStore.currentExercise?.id == 'exercise_0'"
                    style="height: 800px; width: 800px"
                    autoplay
                    loop
                    src="/lottifiles/instructions/explanation_shoulder.lottie"
                />
                <DotLottieVue
                    v-if="exerciseStore.currentExercise?.id == 'exercise_1'"
                    style="height: 1200px; width: 1200px"
                    autoplay
                    loop
                    src="/lottifiles/instructions/explanation_panda_game.lottie"
                />
                <DotLottieVue
                    v-if="exerciseStore.currentExercise?.id == 'exercise_2'"
                    style="height: 800px; width: 800px"
                    autoplay
                    loop
                    src="/lottifiles/instructions/explanation_elbow.lottie"
                />

                <!-- <motion.div
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
                    </motion.div> -->
                <!-- </template> -->
            </div>
            <div class="main-text">
                <h1>{{ exerciseStore.currentExercise?.name }}</h1>
                <h2>{{ exerciseStore.currentExercise?.description }}</h2>
            </div>
        </div>

        <KeyInstruction :instructions="[
            { button: 'reset', action: 'reset' },
            { button: 'start_exercise', action: 'start_exercise' }
        ]" />
    </div>
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
// import { motion } from 'motion-v';

const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl();
const soundPlayer = useSoundPlayer();

const route = useRoute();

watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "next") {
            const currentExerciseId = route.params.exerciseid;

            console.log(`Attempting navigation from instruction page. Exercise ID from route.params: '${currentExerciseId}'`);

            if (typeof currentExerciseId === 'string' && currentExerciseId.trim() !== '') {
                const targetPath = `/${currentExerciseId}/exercise`;
                console.log(`Navigating to: ${targetPath}`);
                navigateTo(targetPath);
            } else {
                console.error('Error: exerciseid is invalid or missing from route.params when "next" key pressed.', route.params);
                // Fallback or error handling, e.g., navigate to home or show a message
                // navigateTo('/'); 
            }
        }
    }
);

onMounted(() => {
    console.log('Instruction page mounted. Initial route.params:', route.params);
    soundPlayer.playRecordingSound();
    if (!route.params.exerciseid) {
        console.warn('Warning: exerciseid is missing from route.params on mount.');
    }
});
</script>

<style scoped>
.c {
    transform: translateY(-6rem);
}

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