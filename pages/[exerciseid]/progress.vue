<template>
    <div class="h-full w-full">

        <div class="flex flex-col w-full h-full items-center justify-center">
            <h1>
                You are doing great! Only
                {{ exerciseStore.exercisesCount - exerciseStore.currentExerciseIndex }}
                more to go!
            </h1>
            <ProgressBar
                :current="exerciseStore.currentExerciseIndex"
                :total="exerciseStore.exercisesCount"
            />
        </div>
        <KeyInstruction
            button="ok"
            action="continue"
        />
    </div>
</template>

<script setup lang="ts">
const exerciseStore = useExerciseStore()
const { remoteKey } = useRemoteControl()
watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "ok") {
            navigateTo("/" + exerciseStore.currentExercise?.id + "/instruction")
        }
    }
);
</script>

<style scoped></style>