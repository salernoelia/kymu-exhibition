<template>
    <div class="h-full w-full">

        <div class="flex flex-col w-full h-full items-center justify-center gap-8">
            <h1>You did it!</h1>
            <ProgressBar
                :current="3"
                :total="3"
            />


            <div class="flex flex-row justify-center items-center gap-16">
                <div
                    v-for="e in exerciseStore.exercises"
                    :key="e.id"
                    class="flex flex-col gap-2 justify-center items-center"
                >
                    <h1>{{ e.results.achieved_angle || 50 }}°</h1>
                    <h3>{{ e.name }}</h3>
                </div>
            </div>
        </div>

        <KeyInstruction
            button="ok"
            action="restart"
        />
    </div>
</template>

<script setup lang="ts">
const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl()

watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "ok") {
            navigateTo("/")
        }
    }
);

onMounted(() => {
    exerciseStore.showResults();
})



</script>

<style scoped></style>