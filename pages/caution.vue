<template>
    <div class="h-full">
        <div class="flex flex-col h-full items-center justify-center gap-4">
            <img
                src="/images/caution.png"
                alt="caution"
                class="w-3/4"
            >
            <h1>Please ensure having enough space.</h1>
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
            exerciseStore.startExperience()
        }
    }
);

</script>

<style scoped></style>