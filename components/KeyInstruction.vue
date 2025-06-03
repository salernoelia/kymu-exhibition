<template>
    <div class="c flex items-center">
        <div class="instructions-container">
            <template
                v-for="(instruction, index) in instructions"
                :key="index"
            >
                <div class="flex items-center">
                    <span class="text">
                        Press
                        <span
                            v-if="instruction.button == 'next'"
                            class="button-label"
                        >
                            <Icon name="ic:baseline-arrow-forward" />
                        </span>
                        <span
                            v-if="instruction.button == 'reset'"
                            class="button-label"
                        >
                            <Icon name="ic:baseline-close" />
                        </span>
                        to {{ getActionText(instruction.action) }}
                    </span>
                </div>
                <div
                    v-if="index < instructions.length - 1"
                    class="separator"
                />
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Actions = "continue" | "reset";
type Buttons = "next" | "reset";

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
        continue: "continue",
        reset: "reset",
        skip: "skip this step",
        cancel: "cancel the operation",
        retry: "try again",
        start_exercise: "start exercise",
        mark_pain: "mark pain",
        restart: "restart"
    };

    return actionTexts[action] || "continue";
};
</script>


<style scoped>
.c {
    position: absolute;
    top: 1rem;
    right: 1rem;
    height: 2.5rem;
}

.instructions-container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.text {
    font-size: 1.8rem;
    color: var(--color-inactiveNormal);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    line-height: 0;
}

.button-label {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primaryNormal);
    color: var(--color-primaryLight);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
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