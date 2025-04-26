<template>
    <div>
        <h1>Page</h1>
        <h3>
            {{ exerciseStore.exercises }}
        </h3>
    </div>
</template>

<script setup lang="ts">
import * as Tone from "tone";

const exerciseStore = useExerciseStore()
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease("C4", "8n");
</script>

<style scoped></style>