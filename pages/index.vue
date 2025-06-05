<template>
    <div class="h-full w-full">
        <div class="flex flex-col w-full h-full items-center justify-center">
            <!-- <DotLottieVue
                style="height: 80vw; width: 80vw"
                class="absolute"
                autoplay
                loop
                src="/lottifiles/clouds.lottie"
            /> -->
            <div class="title flex flex-col gap-12">
                <h1 class="title-text flex flex-row gap-1 centered square-grid">
                    <span
                        v-for="(char, index) in textChars"
                        :key="index"
                        class="text-char animated-char"
                    >
                        <template v-if="char === ' '">&nbsp;</template>
                        <template v-else>{{ char }}</template>
                    </span>
                </h1>
                <h2>
                    Stand on
                    <img
                        src="/images/stand_here.png"
                        class="ml-2 mr-2"
                        style="width: 4.2rem; height: 4.2rem;"
                    >
                    and press
                    <InstructionButton variant="next" />
                    to start the demo.
                </h2>
            </div>

            <DotLottieVue
                class="fixed w-full left-0 z-[-1] bg bottom-0"
                autoplay
                loop
                src="/lottifiles/welcome.lottie"
            />
            <!-- <motion.img
                src="/images/pandas/1.png"
                class="panda"
                :initial="{ opacity: 0, scale: 0 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{
                    duration: 0.4,
                    scale: { type: 'spring', stiffness: 110, damping: 20 }
                }"
            /> -->
        </div>
        <KeyInstruction
            button="next"
            action="continue"
        />

    </div>


</template>
<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
import { animate } from 'animejs';
const fullscreen = useFullscreen();
// import { motion } from 'motion-v'


const text = "Welcome to Kymu";
const textChars = ref([...text]);

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

onMounted(() => {
    animateText();
    fullscreen.toggle();
});

const { remoteKey } = useRemoteControl();
watch(
    () => remoteKey.value,
    (newKey) => {
        if (newKey === "next") {
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

.title-text {
    font-weight: 300;
    margin: 0;
    padding: 0;
    font-size: 5.5rem;
    color: var(--color-primaryNormal);

}

.title {
    transform: translateY(-6rem);
}

.text-char {
    display: inline-block;
    margin: 0 1px;
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

.bg {
    transform: translateY(20px) scale(1.13);
}
</style>