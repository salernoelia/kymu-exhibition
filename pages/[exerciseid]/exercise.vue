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


const handleRemoteKey = (newKey: string | null) => {
    if (!newKey) return;

    if (newKey === "right") {
        console.log("right")
        if (exerciseStore.currentExercise?.id == "exercise_2" || route.params.exerciseid == "exercise_2") {
            exerciseStore.skipCurrentExercise()
            if (romComponent.value) {
                romComponent.value.cleanup();
            }
            navigateTo("/results")
        } else {
            exerciseStore.skipCurrentExercise()
            exerciseStore.nextExercise();
            if (romComponent.value) {
                romComponent.value.cleanup();
            }
            navigateTo("/" + exerciseStore.currentExercise?.id + "/progress")
        }

    } else if (newKey === "ok") {
        if (romComponent.value) {
            if (exerciseStore.startedRecording) {
                exerciseStore.saveExerciseResults();
            } else if (!exerciseStore.startedRecording) {

                romComponent.value.saveLandmarks();
            }
        }
    } else if (newKey === "down") {
        window.location.reload();
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