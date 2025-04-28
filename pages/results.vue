<template>
    <div class="h-full w-full">

        <div class="flex flex-col w-full h-full items-center justify-center gap-2">
            <h1>You did it!</h1>
            <ProgressBar
                :current="3"
                :total="3"
            />


            <div
                v-for="e in exerciseStore.exercises"
                :key="e.id"
                class="flex flex-row gap-2"
            >
                <h3>{{ e.id }} | </h3>
                <h3>{{ e.name }} | </h3>
                <h3>{{ e.status }} | </h3>
                <h3>{{ e.results }}</h3>
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