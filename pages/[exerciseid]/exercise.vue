<template>
    <div class="w-full h-full">
        <div class="w-full h-full flex flex-col items-center justify-start mt-2">
            <MediapipeRom
                v-if="loadedExercise?.category && loadedExercise?.type == 'range-of-motion'"
                ref="romComponent"
                :rom-combination="loadedExercise?.category"
            />

            <FeedPanda
                v-if="loadedExercise?.type == 'p5_game'"
                ref="gameComponent"
                @game-started="onGameStarted"
                @game-completed="onGameCompleted"
                @score-changed="onScoreChanged"
            />
        </div>

        <KeyInstruction
            class=""
            :instructions="[
                {
                    button: 'ok',
                    action: loadedExercise?.type === 'p5_game' ? 'restart' : 'start_exercise'
                },
                {
                    button: 'up',
                    action: 'mark_pain'
                },
                {
                    button: 'right',
                    action: 'skip'
                }
            ]"
        />
    </div>
</template>

<script setup lang="ts">
const exerciseStore = useExerciseStore();
const { remoteKey } = useRemoteControl();

const loadedExercise = exerciseStore.currentExercise;

const romComponent = ref<null | {
    markPainMoment: () => void;
    saveLandmarks: () => void;
    calculateAngle: () => void;
    cleanup: () => void;
}>(null);

const gameComponent = ref<null | {
    restartGame: () => void;
    getCurrentScore: () => number;
    getGameState: () => string;
}>(null);

const onGameStarted = (data: { timestamp: number }) => {
    console.log('Game started at:', data.timestamp);
    exerciseStore.startCurrentExercise();
};

const onGameCompleted = (results: {
    score: number;
    highScore: number;
    duration: number;
    accuracy: number;
    handsDetected: boolean;
}) => {
    console.log('Game completed with results:', results);

    exerciseStore.setGameResults({
        score: results.score,
        highScore: results.highScore,
        duration: results.duration,
        accuracy: results.accuracy,
        handsDetected: results.handsDetected
    });

    exerciseStore.completeCurrentExercise();

    const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

    if (isLastExercise) {
        navigateTo("/results");
    } else {
        exerciseStore.nextExercise();
        navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
    }
};

const onScoreChanged = (score: number) => {
    console.log('Score changed to:', score);
};

onMounted(() => {
    exerciseStore.startCurrentExercise();
});

setTimeout(() => {
    if (!exerciseStore.currentExercise && useRouter().currentRoute.value.path.includes('/exercise')) {
        console.error("NO EXERCISE FOUND — RESTARTING")
        exerciseStore.resetExperience();
    }
}, 2000);

const handleRemoteKey = (newKey: string | null) => {
    if (!newKey) return;

    if (newKey === "right") {
        console.log("skipping exercise");
        exerciseStore.skipCurrentExercise();

        if (romComponent.value) {
            romComponent.value.cleanup();
        }

        const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

        if (isLastExercise) {
            navigateTo("/results");
        } else {
            exerciseStore.nextExercise();
            navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
        }
    } else if (newKey === "ok") {
        if (exerciseStore.currentExercise?.type === 'p5_game') {
            if (gameComponent.value) {
                gameComponent.value.restartGame();
            }
        } else if (romComponent.value) {
            if (exerciseStore.startedRecording) {
                romComponent.value.calculateAngle();
                exerciseStore.completeCurrentExercise();

                const isLastExercise = exerciseStore.currentExerciseIndex === exerciseStore.exercisesCount - 1;

                if (isLastExercise) {
                    navigateTo("/results");
                } else {
                    exerciseStore.nextExercise();
                    console.log(`Navigating to next exercise: ${exerciseStore.currentExercise?.id}`);
                    navigateTo(`/${exerciseStore.currentExercise?.id}/progress`);
                }
                romComponent.value.cleanup();
            } else if (!exerciseStore.startedRecording) {
                romComponent.value.saveLandmarks();
            }
        }
    } else if (newKey === "up") {
        if (romComponent.value) {
            romComponent.value.markPainMoment();
        }
    }

    setTimeout(() => {
        remoteKey.value = null;
    }, 100);
};

watch(remoteKey, handleRemoteKey);
</script>