import { defineStore } from 'pinia';

export const useExerciseStore = defineStore('exerciseStore', () => {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const resultAngle = ref(0);
    const resultAnglePreviousExercise = ref();
    const painMomentAngles = ref<number[]>([]);
    const startedRecording = ref<boolean>(false);

    const gameResults = ref<{
        score: number;
        highScore: number;
        duration: number;
        accuracy: number;
        handsDetected: boolean;
    } | null>(null);

    const route = useRoute();

    const exerciseStateMachine = useExerciseStateMachine();

    const exercises = computed(() => exerciseStateMachine.exercises.value);
    const currentExerciseIndex = computed(() => exerciseStateMachine.currentExerciseIndex.value);
    const currentExercise = computed(() => exerciseStateMachine.currentExercise.value);
    const exercisesCount = computed(() => exerciseStateMachine.exerciseCount.value);
    const exerciseProgress = computed(() => exerciseStateMachine.progress.value);

    const setGameResults = (results: {
        score: number;
        highScore: number;
        duration: number;
        accuracy: number;
        handsDetected: boolean;
    }) => {
        gameResults.value = results;
    };

    const getExerciseById = (exerciseId: string) => {
        return exercises.value.find((ex) => ex.id === exerciseId);
    };

    const getExerciseStatus = (exerciseId: string): Exercise['status'] | null => {
        const exercise = exercises.value.find((ex) => ex.id === exerciseId);
        return exercise ? exercise.status : null;
    };

    const finalizeResults = () => {
        exercises.value.forEach((ex) => {
            if (!ex.results || typeof ex.results.achieved_angle === 'undefined') {
                ex.results = {
                    exercise_id: ex.id,
                    achieved_angle: 0,
                    pain_angles_deg: [],
                };
            }
        });
    };

    const setCurrentExercise = (exerciseId: string) => {
        console.log('setting current exercise', exerciseId);
        console.log('current app state:', exerciseStateMachine.appState.value);
        console.log('all exercises:', exercises.value);
        const index = exercises.value.findIndex((ex) => ex.id === exerciseId);
        console.log('found index:', index);
        if (index >= 0) {
            if (exerciseStateMachine.appState.value !== 'exercises') {
                exerciseStateMachine.appState.value = 'exercises';
            }
            exerciseStateMachine.goToExercise(index);
            console.log('after goToExercise, currentExercise:', currentExercise.value);
        }
    };

    const nextExercise = () => {
        const nextIndex = currentExerciseIndex.value + 1;
        console.log(`Moving from exercise index ${currentExerciseIndex.value} to ${nextIndex}`);

        if (nextIndex >= exercises.value.length) {
            console.log('Reached the end of exercises, showing results');
            exerciseStateMachine.showResults();
            return;
        }

        exerciseStateMachine.goToExercise(nextIndex);
    };

    const previousExercise = () => {
        const prevIndex = currentExerciseIndex.value - 1;
        const newIndex = prevIndex < 0 ? exercises.value.length - 1 : prevIndex;
        exerciseStateMachine.goToExercise(newIndex);
    };

    const startCurrentExercise = () => {
        console.log('Starting Exercise');
        if (currentExercise.value) {
            currentExercise.value.status = 'in_progress';
        }
    };

    const completeCurrentExercise = () => {
        if (currentExercise.value) {
            let results: ExerciseResults;

            if (currentExercise.value.type === 'p5_game' && gameResults.value) {
                results = {
                    exercise_id: currentExercise.value.id,
                    achieved_score: gameResults.value.score,
                    achieved_accuracy: gameResults.value.accuracy,
                    game_duration: gameResults.value.duration,
                    hands_detected: gameResults.value.handsDetected,
                };
                resultAnglePreviousExercise.value = gameResults.value.score;
            } else {
                results = {
                    exercise_id: currentExercise.value.id,
                    achieved_angle: resultAngle.value,
                    pain_angles_deg: painMomentAngles.value,
                };
                resultAnglePreviousExercise.value = resultAngle.value;
            }

            currentExercise.value.results = results;
            currentExercise.value.status = 'completed';

            // Reset exercise-specific state
            if (currentExercise.value.type === 'p5_game') {
                gameResults.value = null;
            } else {
                resultAngle.value = 0;
                painMomentAngles.value = [];
            }
            startedRecording.value = false;
        }
    };

    const skipCurrentExercise = () => {
        if (currentExercise.value) {
            currentExercise.value.status = 'skipped';
        }
    };

    const resetExerciseExecutionState = () => {
        resultAngle.value = 0;
        painMomentAngles.value = [];
        startedRecording.value = false;
        isLoading.value = false;
        error.value = null;
        gameResults.value = null;
    };

    const resetExperience = async () => {
        resetExerciseExecutionState();
        await exerciseStateMachine.resetExperience();
    };

    watch(
        () => route.params.exerciseid,
        (newExerciseId) => {
            if (newExerciseId && exerciseStateMachine.appState.value === 'exercises') {
                console.log('Route changed to exercise:', newExerciseId);
                setCurrentExercise(newExerciseId as string);
            } else {
                console.log('Ignoring route change because app is not in exercises state');
            }
        },
        { immediate: true }
    );

    return {
        // Exercise execution state
        isLoading,
        error,
        resultAngle,
        resultAnglePreviousExercise,
        painMomentAngles,
        startedRecording,
        gameResults,
        setGameResults,

        // Exercise data & status
        exercises,
        exercisesCount,
        currentExercise,
        currentExerciseIndex,
        exerciseProgress,
        getExerciseById,
        getExerciseStatus,
        finalizeResults,

        // Exercise navigation
        setCurrentExercise,
        nextExercise,
        previousExercise,

        // Exercise lifecycle
        startCurrentExercise,
        completeCurrentExercise,
        skipCurrentExercise,

        // App state management (delegated to state machine)
        startExperience: exerciseStateMachine.startExperience,
        resetExperience,
        showResults: exerciseStateMachine.showResults,
    };
});