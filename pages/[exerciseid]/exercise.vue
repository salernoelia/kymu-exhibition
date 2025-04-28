<template>
    <div class="w-full h-full">

        <div class="w-full h-full flex flex-col items-center justify-start mt-2">
            <MediapipeRom
                ref="romComponent"
                :rom-combination="exerciseStore.currentExercise?.category"
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
const route = useRoute();
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
    if (!exerciseStore.currentExercise) {
        exerciseStore.resetExperience();
    }
}, 1000);


const handleRemoteKey = (newKey: string | null) => {
    if (!newKey) return;

    if (newKey === "right") {
        console.log("skipping exercise");
        exerciseStore.skipCurrentExercise();

        if (romComponent.value) {
            romComponent.value.cleanup();
        }

        const currentExerciseId = exerciseStore.currentExercise?.id;
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
                romComponent.value.cleanup();

                const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

                if (isLastExercise) {
                    navigateTo("/results");
                } else {
                    exerciseStore.nextExercise();

                    console.log(`Navigating to next exercise: ${exerciseStore.currentExercise?.id}`);
                    navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
                }
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