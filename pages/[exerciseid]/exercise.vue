<template>
    <div class="w-full h-full flex flex-col items-center justify-start mt-2">
        <MediapipeRom :rom-combination="exerciseStore.currentExercise?.category" />
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const exerciseStore = useExerciseStore();

// Debug on component mount
onMounted(() => {
    console.log('Exercise route param:', route.params.exerciseid);
    console.log('Current exercise:', exerciseStore.currentExercise);
});
</script>