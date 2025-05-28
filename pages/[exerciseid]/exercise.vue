<template>
    <div class="w-full h-full">

        <div class="w-full h-full flex flex-col items-center justify-start mt-2">
            <MediapipeRom
                v-if="exerciseStore.currentExercise?.category && exerciseStore.currentExercise?.type == 'range-of-motion'"
                ref="romComponent"
                :rom-combination="exerciseStore.currentExercise?.category"
            />

            <FeedPanda
                v-if="exerciseStore.currentExercise?.type == 'p5_game'"
                ref="gameComponent"
            />

        </div>
        <KeyInstruction
            class=""
            :instructions="[
                {
                    button: 'ok',
                    action: 'start_exercise'
                },
                {
                    button: 'up',
                    action: 'mark_pain'
                },
                {
                    button: 'right',
                    action: 'skip'
                }
            ]"
        />
    </div>
</template>

<script setup lang="ts">

const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl();

const romComponent = ref<null | {
    markPainMoment: () => void;
    saveLandmarks: () => void;
    calculateAngle: () => void;
    cleanup: () => void;
}>(null);

onMounted(() => {
    exerciseStore.startCurrentExercise();
})

setTimeout(() => {
    if (!exerciseStore.currentExercise && useRouter().currentRoute.value.path.includes('/exercise')) {
        console.error("NO EXERCISE FOUND — RESTARTING")
        exerciseStore.resetExperience();
    }
}, 2000);


const handleRemoteKey = (newKey: string | null) => {
    if (!newKey) return;

    if (newKey === "right") {
        console.log("skipping exercise");
        exerciseStore.skipCurrentExercise();

        if (romComponent.value) {
            romComponent.value.cleanup();
        }

        const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

        if (isLastExercise) {
            navigateTo("/results");
        } else {
            exerciseStore.nextExercise();
            navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
        }
    } else if (newKey === "ok") {
        if (romComponent.value) {
            if (exerciseStore.startedRecording) {
                romComponent.value.calculateAngle();

                exerciseStore.completeCurrentExercise();

                const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

                if (isLastExercise) {
                    navigateTo("/results");
                } else {
                    exerciseStore.nextExercise();

                    console.log(`Navigating to next exercise: ${exerciseStore.currentExercise?.id}`);
                    navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
                }
                romComponent.value.cleanup();

            } else if (!exerciseStore.startedRecording) {
                romComponent.value.saveLandmarks();
            }
        }
    } else if (newKey === "up") {
        if (romComponent.value) {
            romComponent.value.markPainMoment();
        }
    }

    setTimeout(() => {
        remoteKey.value = null;
    }, 100);
};
watch(remoteKey, handleRemoteKey);
</script>