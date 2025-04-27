<template>
    <div class="h-full w-full">
        <div class="flex flex-col w-full h-full itens-center justify-center">
            <h1 class=" flex flex-row gap-1 centered square-grid">
                <span
                    v-for="(char, index) in textChars"
                    :key="index"
                    class="text-char animated-char"
                >{{ char }}</span>
            </h1>
        </div>
        <KeyInstruction
            button="ok"
            action="continue"
        />
    </div>
</template>

<script setup lang="ts">
import { animate } from 'animejs';
import { ref, onMounted } from 'vue';

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
</style>