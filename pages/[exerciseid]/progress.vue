<template>
    <div class="h-full w-full">
        <div class="flex flex-col w-full h-full items-center justify-center cont">
            <DotLottieVue
                style="height: 450px; width: 450px"
                class="absolute top-0"
                autoplay
                loop
                src="/lottifiles/party.lottie"
            />

            <motion.img
                src="/images/decoration/cloud_1.svg"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 110, damping: 20 }
                }"
                alt="caution"
                class="cloud_1 cloud"
            />
            <motion.img
                src="/images/decoration/cloud_2.svg"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 110, damping: 20 }
                }"
                alt="caution"
                class="cloud_2 cloud"
            />
            <motion.img
                src="/images/decoration/cloud_3.svg"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 110, damping: 20 }
                }"
                alt="caution"
                class="cloud_3 cloud"
            />
            <div class="flex flex-col justify-center items-center">

                <motion.h1
                    v-if="previousExercise?.type === 'range-of-motion'"
                    class="num"
                >
                    {{ countedValue }}°
                </motion.h1>
                <motion.h1
                    v-else-if="previousExercise?.type === 'p5_game'"
                    class="num"
                >
                    {{ countedValue }} pts
                </motion.h1>
                <motion.h1
                    v-else
                    class="num text-[--color-dangerNormal]"
                >
                    Reset Required
                </motion.h1>

                <motion.h2
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
                </motion.h2>

                <ProgressBar
                    :current="exerciseStore.currentExerciseIndex"
                    :total="exerciseStore.exercisesCount"
                />
            </div>



        </div>
        <KeyInstruction :instructions="[
            { button: 'reset', action: 'reset' },
            { button: 'next', action: 'continue' }
        ]" />
    </div>
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { motion } from 'motion-v'
const exerciseStore = useExerciseStore()
const { remoteKey } = useRemoteControl()
const { playSuccessSound } = useSoundPlayer()

const previousExercise = computed(() => {
    const prevIndex = exerciseStore.currentExerciseIndex - 1;
    if (prevIndex >= 0 && prevIndex < exerciseStore.exercises.length) {
        return exerciseStore.exercises[prevIndex];
    }
    return null;
});


const targetValue = computed(() => {
    if (!previousExercise.value) return 0;

    if (previousExercise.value.type === 'range-of-motion') {
        return Math.round(previousExercise.value.results?.achieved_angle || 0);
    } else if (previousExercise.value.type === 'p5_game') {
        return previousExercise.value.results?.achieved_score || 0;
    }
    return 0;
});

const countedValue = ref(0)

onMounted(() => {
    console.log('Progress page - Previous exercise:', previousExercise.value);
    console.log('Progress page - Target value:', targetValue.value);

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
        if (newKey === "next") {
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

.panda {
    width: 20vw;
    top: 0;
    z-index: 2;
}

.cont {
    transform: translateY(8vh);
}

.cloud {
    position: fixed;
    bottom: -50px;
    z-index: -2;
}

.cloud_1 {
    right: -20px;
    width: 25vw;
    height: auto;
}

.cloud_2 {
    z-index: -1;
    width: 30vw;
    height: auto;
}

.cloud_3 {
    width: 35vw;
    height: auto;
    left: 0;
    left: -20px;
}
</style>