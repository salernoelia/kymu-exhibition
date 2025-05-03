<template>
    <div class="h-full w-full">

        <div class="flex flex-col w-full h-full items-center justify-start gap-8 pt-20">

            <h1>You did it!</h1>
            <ProgressBar
                :current="3"
                :total="3"
            />


            <!-- <img
                class="panda"
                src="/images/pandas/4.png"
                alt="panda"
            > -->


            <div class="flex flex-row justify-center items-center gap-16 z-[-1] bg">
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
        <DotLottieVue
                class="fixed w-screen h-screen bottom-0 left-0 z-[-1] bg"
                autoplay
                loop
                src="/lottifiles/success.lottie"
            />

        <KeyInstruction
            button="ok"
            action="restart"
        />
    </div>
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
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

<style scoped>
.panda {
    position: absolute;
    width: 100vw;
    bottom: 0;
    z-index: -1;
}
</style>