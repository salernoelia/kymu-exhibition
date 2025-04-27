import { useStorage } from '@vueuse/core';
import type { InsertResult } from '../db/results';

export const useExerciseStore = defineStore('exerciseStore', () => {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const resultAngle = ref(0);
    const painMomentAngles = ref<number[]>([]);
    const startedRecording = ref<boolean>(false);
    const route = useRoute();
    const userKey = useStorage('user-key', '');

    const exerciseStateMachine = useExerciseStateMachine();

    const exercises = computed(() => exerciseStateMachine.exercises.value);
    const currentExerciseIndex = computed(() => exerciseStateMachine.currentExerciseIndex.value);
    const currentExercise = computed(() => exerciseStateMachine.currentExercise.value);
    const exercisesCount = computed(() => exerciseStateMachine.exerciseCount.value);
    const exerciseProgress = computed(() => exerciseStateMachine.progress.value);

    const saveExerciseResults = async () => {
        try {
            if (!currentExercise.value) throw new Error('No current Exercise');
            if (currentExercise.value.status !== 'completed')
                throw new Error('Exercise is not yet completed and thus there are no results');

            await $fetch<InsertResult>('/api/results', {
                method: 'POST',
                body: {
                    exerciseId: currentExercise?.value.id,
                    achievedRepetitions: currentExercise.value.results.achieved_repetitions,
                    achievedSeconds: currentExercise.value.results.achieved_seconds,
                    achievedAngle: currentExercise.value.results.achieved_angle,
                    painAnglesDeg: JSON.stringify(currentExercise.value.results.pain_angles_deg),
                },
            });
        } catch (e: any) {
            console.log('Error logging user:', e);
        }
    };

    const getExerciseById = (exerciseId: string) => {
        return exercises.value.find((ex) => ex.id === exerciseId);
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
        console.log(nextIndex);
        const newIndex = nextIndex >= exercises.value.length ? 0 : nextIndex;
        exerciseStateMachine.goToExercise(newIndex);
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
            const results: ExerciseResults = {
                exercise_id: currentExercise.value.id,
                achieved_angle: resultAngle.value,
            };
            currentExercise.value.status = 'completed';
            startedRecording.value = false;
            painMomentAngles.value = [];
            resultAngle.value = 0;
            if (results) {
                currentExercise.value.results = results;
                saveExerciseResults();
            }
            nextExercise();
        }
    };

    const skipCurrentExercise = () => {
        if (currentExercise.value) {
            currentExercise.value.status = 'skipped';
        }
    };

    const getExerciseStatus = (exerciseId: string): Exercise['status'] | null => {
        const exercise = exercises.value.find((ex) => ex.id === exerciseId);
        return exercise ? exercise.status : null;
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
        isLoading,
        error,
        userKey,
        exercises,
        exercisesCount,
        getExerciseById,
        setCurrentExercise,
        nextExercise,
        previousExercise,
        currentExercise,
        currentExerciseIndex,
        exerciseProgress,
        resultAngle,
        painMomentAngles,
        startedRecording,
        saveExerciseResults,
        startCurrentExercise,
        completeCurrentExercise,
        skipCurrentExercise,
        getExerciseStatus,
        startExperience: exerciseStateMachine.startExperience,
        resetExperience: exerciseStateMachine.resetExperience,
        showResults: exerciseStateMachine.showResults,
    };
});
