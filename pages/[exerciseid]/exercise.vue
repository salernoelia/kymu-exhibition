<template>
    <div class="w-full h-full flex flex-col items-center justify-start mt-2">
        <MediapipeRom
            ref="romComponent"
            :rom-combination="exerciseStore.currentExercise?.category"
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
        exerciseStore.nextExercise();
        navigateTo("/progress")

    } else if (newKey === "ok") {
        if (romComponent.value) {
            romComponent.value.saveLandmarks();
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