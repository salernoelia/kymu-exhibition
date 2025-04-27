<template>
    <div class="c">
        <div class="instructions-container">
            <template
                v-for="(instruction, index) in instructions"
                :key="index"
            >
                <div class="instruction">
                    <span class="text">
                        Press <span class="button-label">{{ instruction.button }}</span> to {{
                            getActionText(instruction.action) }}
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

type Actions = "continue" | "skip" | "cancel" | "retry";

interface Instruction {
    button: string;
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
        return [{ button: props.button, action: props.action }];
    }

    return [];
});

const getActionText = (action: Actions) => {
    const actionTexts = {
        continue: "continue",
        skip: "skip this step",
        cancel: "cancel the operation",
        retry: "try again"
    };

    return actionTexts[action] || "continue";
};
</script>

<style scoped>
.c {
    position: absolute;
    bottom: 15px;
}

.instructions-container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.text {
    font-size: 1.5rem;
    color: var(--color-inactiveNormal);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.button-label {
    display: inline-block;
    background-color: var(--color-primaryNormal);
    color: var(--color-primaryLight);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-weight: 500;
    line-height: 1.2;
}

.separator {
    height: 20px;
    width: 1px;
    background-color: var(--color-inactiveNormal);
    margin: 0 1.5rem;
}
</style>