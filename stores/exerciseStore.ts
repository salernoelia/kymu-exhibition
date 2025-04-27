export const useExerciseStore = defineStore('exerciseStore', () => {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const resultAngle = ref(0);
    const painMomentAngles = ref<number[]>([]);
    const startedRecording = ref<boolean>(false);
    const route = useRoute();

    const exerciseStateMachine = useExerciseStateMachine();

    const exercises = computed(() => exerciseStateMachine.exercises.value);
    const currentExerciseIndex = computed(() => exerciseStateMachine.currentExerciseIndex.value);
    const currentExercise = computed(() => exerciseStateMachine.currentExercise.value);
    const exercisesCount = computed(() => exerciseStateMachine.exerciseCount.value);
    const exerciseProgress = computed(() => exerciseStateMachine.progress.value);

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
            // Make sure we're in the exercises state
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
        if (currentExercise.value) {
            currentExercise.value.status = 'in_progress';
        }
    };

    const completeCurrentExercise = (results?: any) => {
        if (currentExercise.value) {
            currentExercise.value.status = 'completed';
            if (results) {
                currentExercise.value.results = results;
            }
        }
    };

    const skipCurrentExercise = () => {
        if (currentExercise.value) {
            currentExercise.value.status = 'completed';
        }
    };

    const getExerciseStatus = (exerciseId: string): Exercise['status'] | null => {
        const exercise = exercises.value.find((ex) => ex.id === exerciseId);
        return exercise ? exercise.status : null;
    };

    watch(
        () => route.params.exerciseid, // Changed from exerciseId to exerciseid
        (newExerciseId) => {
            if (newExerciseId) {
                setCurrentExercise(newExerciseId as string);
            }
        },
        { immediate: true }
    );

    return {
        isLoading,
        error,
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
        startCurrentExercise,
        completeCurrentExercise,
        skipCurrentExercise,
        getExerciseStatus,
        startExperience: exerciseStateMachine.startExperience,
        showResults: exerciseStateMachine.showResults,
    };
});
