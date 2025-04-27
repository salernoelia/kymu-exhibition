<template>
    <div class="flex flex-col w-full h-full ">
        <h1>Start</h1>
        <Progress :current="exerciseStore.currentExerciseIndex" :total="exerciseStore.exercisesCount" />
        <button @click="exerciseStore.startExperience">
            Start
        </button>

        {{ exerciseStore.currentExerciseIndex }}
    </div>
</template>

<script setup lang="ts">
const exerciseStore = useExerciseStore()
</script>

<style scoped></style>