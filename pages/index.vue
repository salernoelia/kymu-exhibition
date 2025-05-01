<template>
    <div class="h-full w-full">

        <div class="flex flex-col w-full h-full itens-center justify-center">
            <!-- <DotLottieVue
                style="height: 80vw; width: 80vw"
                class="absolute"
                autoplay
                loop
                src="/lottifiles/clouds.lottie"
            /> -->

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
            <img
                src="/images/decoration/cloud_rainbow.svg"
                alt="caution"
                class="cloud_rainbow cloud"
            >

            <div class="flex flex-col title">
                <h1 class=" flex flex-row gap-1 centered square-grid">
                    <span
                        v-for="(char, index) in textChars"
                        :key="index"
                        class="text-char animated-char"
                    >{{ char }}</span>
                </h1>
                <h2>
                    Are you ready for today's workout?
                </h2>
            </div>
            <motion.img
                src="/images/pandas/1.png"
                class="panda"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 110, damping: 20 }
                }"
            />
        </div>
        <KeyInstruction
            button="ok"
            action="continue"
        />
    </div>
</template>

<script setup lang="ts">
// import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { animate } from 'animejs';
import { motion } from 'motion-v'

// Text to be animated
const text = "Welcome to Kymu!";
const textChars = ref([...text]);

// Animation function
const animateText = () => {
    animate('.animated-char', {

        y: [
            { to: '-2.75rem', ease: 'outExpo', duration: 600 },
            { to: 0, ease: 'outBounce', duration: 800, delay: 100 }
        ],

        rotate: {
            from: '-1turn',
            delay: 0
        },
        delay: (_, i) => i * 50,
        ease: 'inOutCirc',
        loopDelay: 1000,
        loop: true
    });
};

// Run animation after component is mounted
onMounted(() => {
    animateText();
});

const { remoteKey } = useRemoteControl();
watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "ok") {
            navigateTo("/caution");
        }
    }
);
</script>

<style scoped>
h2 {
    text-align: center;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
}

.title {
    transform: translateY(-10vh);
}

.text-char {
    display: inline-block;
    margin: 0 2px;
}

.large {
    font-size: 2rem;
}

.centered {
    display: flex;
    justify-content: center;
}

.grid {
    display: flex;
    flex-wrap: wrap;
}

.panda {
    width: 50vw;
    position: absolute;
    right: 0;
    bottom: 0;
}

.cloud {
    position: fixed;
    bottom: -50px;
    z-index: -2;
}

.cloud_2 {
    z-index: -1;
    width: 40vw;
    left: 25vw;
    height: auto;
}

.cloud_3 {
    left: -20px;
    width: 25vw;
    bottom: 50px;
    height: auto;
}

.cloud_rainbow {
    width: 55vw;
    left: -20px;
    z-index: -3;
}
</style>