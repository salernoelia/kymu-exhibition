<template>
    <div class="h-full w-full">

        <div class="flex flex-col w-full h-full items-center justify-center ">

            <DotLottieVue
                style="height: 300px; width: 300px"
                class="absolute top-28"
                autoplay
                loop
                src="/lottifiles/fireworls.lottie"
            />
            <motion.h1 class="num">
                {{ countedValue }}°
            </motion.h1>
            <motion.h1
                class="mb-12"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
                }"
            >
                You are doing great! Only
                {{ exerciseStore.exercisesCount - exerciseStore.currentExerciseIndex }}
                more to go!
            </motion.h1>

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
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { motion } from 'motion-v'
const exerciseStore = useExerciseStore()
const { remoteKey } = useRemoteControl()
const { playSuccessSound } = useSoundPlayer()

const targetValue = computed(() => exerciseStore.resultAnglePreviousExercise || 0)
const countedValue = ref(0)

onMounted(() => {
    const duration = 1000
    const startTime = performance.now()

    function updateCounter(currentTime: number) {
        const elapsed = currentTime - startTime
        if (elapsed < duration) {
            countedValue.value = Math.round((elapsed / duration) * targetValue.value)
            requestAnimationFrame(updateCounter)
        } else {
            countedValue.value = targetValue.value
        }
    }

    requestAnimationFrame(updateCounter)
})


watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "ok") {
            navigateTo("/" + exerciseStore.currentExercise?.id + "/instruction")
        }
    }
);

playSuccessSound()



</script>

<style scoped>
.num {
    font-size: 7rem;
}
</style>