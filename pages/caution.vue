<template>
    <div class="h-full">
        <div class="flex flex-col h-full items-center justify-center">


            <motion.img
                src="/images/caution.png"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 110, damping: 20 }
                }"
                alt="caution"
                class="w-3/4"
            />
            <DotLottieVue
                style="height: 100px; width: 300px; transform: scale(4);"
                autoplay
                loop
                src="/lottifiles/space-arrows.lottie"
            />
            <h1>Please ensure having enough space.</h1>
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