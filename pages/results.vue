<template>
    <div class="h-full w-full">
        <div class="flex flex-col w-full h-full items-center justify-start gap-8 pt-20">
            <h1>You did it!</h1>
            <ProgressBar
                :current="3"
                :total="3"
            />

            <DotLottieVue
                class="absolute w-full h-full bottom-[-25px] left-0 z-[-1] overflow-hidden"
                autoplay
                loop
                src="/lottifiles/success.lottie"
            />

            <div class="flex flex-row justify-center items-center gap-16">
                <div
                    v-for="e in exerciseStore.exercises"
                    :key="e.id"
                    class="flex flex-col gap-2 justify-center items-center"
                >
                    <h1 v-if="e.type === 'range-of-motion'">{{ e.results.achieved_angle || 0 }}°</h1>
                    <h1 v-else-if="e.type === 'p5_game'">{{ e.results.achieved_score || 0 }} pts</h1>
                    <h3>{{ e.name }}</h3>
                    <p
                        v-if="e.type === 'p5_game' && e.results.achieved_accuracy"
                        class="text-sm"
                    >
                        {{ e.results.achieved_accuracy }}% accuracy
                    </p>
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
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl()
const soundPlayer = useSoundPlayer();

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
    soundPlayer.playResultsSound();
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