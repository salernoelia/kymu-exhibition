<template>
    <div class="w-full h-full">

        <div class="center-full">
            <h1>Instruction</h1>
        </div>

        <KeyInstruction :instructions="[
            { button: 'Enter', action: 'continue' },
            { button: 'Esc', action: 'cancel' }
        ]" />

    </div>
</template>

<script setup lang="ts">
// const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl();

const route = useRoute()

watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "ok") {
            navigateTo("/" + route.params?.exerciseid + "/exercise")
        }
    }
);
</script>

<style scoped></style>