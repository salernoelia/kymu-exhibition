<template>
    <div
        class="key-instruction-container flex items-center"
        :style="currentRouteTopRoute ? 'top: 1rem' : 'top: calc(50vh - 3rem)'"
    >
        <div
            class="instructions-container w-full "
            :class="instructions.length <= 1 ? 'justify-end' : 'justify-between'"
        >
            <template
                v-for="(instruction, index) in instructions"
                :key="index"
            >
                <div class="flex items-center ">
                    <span
                        v-if="instruction.button == 'reset'"
                        class="text"
                    >
                        <span
                            v-if="instruction.button == 'reset'"
                            class="button-label"
                        >
                            <Icon name="ic:baseline-close" />
                        </span>
                        {{ getActionText(instruction.action) }}
                    </span>
                    <span
                        v-if="instruction.button == 'next' || instruction.button == 'skip' || instruction.button == 'start_exercise'"
                        class="text"
                    >
                        {{ getActionText(instruction.action) }}
                        <span class="button-label">
                            <Icon name="ic:baseline-arrow-forward" class="subtle-move-x" />
                        </span>
                    </span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">

const route = useRoute();

const topRoutes = ["/", "/results"];

const currentRouteTopRoute = computed(() => {
    return topRoutes.includes(route.path);
});


type Actions = "skip" | "continue" | "reset" | "start_exercise";
type Buttons = "next" | "reset" | "skip" | "start_exercise";

interface Instruction {
    button: Buttons;
    action: Actions;
}

const props = defineProps<{
    button?: string;
    action?: Actions;
    instructions?: Instruction[];
}>();

const instructions = computed(() => {
    if (props.instructions && props.instructions.length > 0) {
        return props.instructions;
    }

    if (props.button && props.action) {
        return [{ button: props.button as Buttons, action: props.action }];
    }

    return [];
});

const getActionText = (action: Actions) => {
    const actionTexts = {
        continue: "Continue",
        reset: "Back to Menu",
        skip: "Skip",
        cancel: "cancel the operation",
        retry: "try again",
        start_exercise: "Start Exercise",
        mark_pain: "mark pain",
        restart: "restart",
    };

    return actionTexts[action] || "continue";
};
</script>


<style scoped>
@keyframes move-x {
    0%, 100% {
        transform: translateX(-3px);
    }
    50% {
        transform: translateX(3px);
    }
}

.subtle-move-x {
    animation: move-x 1.5s infinite ease-in-out;
}

.key-instruction-container {
    position: fixed;

    width: calc(100vw - 2rem);
}



.instructions-container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.text {
    font-size: 1.8rem;
    color: var(--color-inactiveDark);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0;
    margin: 0;
    line-height: 0;
}

.button-label {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    color: var(--color-primaryNormal);
    border: 2px var(--color-primaryNormal) solid;
    padding: 0.2rem 0.6rem;
    border-radius: 50%;
    aspect-ratio: 1/1;
    font-weight: 500;
    line-height: 1.2;
}

.separator {
    height: 1.8rem;
    width: 2px;
    background-color: var(--color-inactiveNormal);
    margin: 0 1.5rem;
}
</style>