import exercisesConfig from '~/assets/exercises_config.json';

export const useExerciseStateMachine = () => {
    const appState = ref<'start' | 'exercises' | 'results'>('start');
    const exercises = ref<ExerciseCollection>([]);
    const currentExerciseIndex = ref<number>(0);

    const exerciseCount = computed(() => exercises.value.length);

    const currentExercise = computed<Exercise | null>(() => {
        if (exercises.value.length === 0 || appState.value !== 'exercises') return null;
        return exercises.value[currentExerciseIndex.value];
    });

    const progress = computed(() => {
        if (exercises.value.length === 0) {
            return { current: 0, total: 0, percentage: 0 };
        }
        const currentIdx =
            currentExerciseIndex.value < exercises.value.length ? currentExerciseIndex.value : 0;
        const current = currentIdx + 1;
        const total = exercises.value.length;
        const percentage = Math.round((current / total) * 100);
        return { current, total, percentage };
    });

    const loadExercises = () => {
        exercises.value = exercisesConfig.exercises.map((ex) => ({
            ...ex,
            status: 'not_started',
            results: {},
        })) as ExerciseCollection;
        currentExerciseIndex.value = 0;
        appState.value = 'start';
    };

    const goToExercise = (index: number) => {
        if (index >= 0 && index < exercises.value.length) {
            currentExerciseIndex.value = index;
        }
    };

    const startExperience = async () => {
        if (exercises.value.length > 0) {
            appState.value = 'exercises';
            currentExerciseIndex.value = 0;

            console.log('=========================');
            console.log('Experience has started');
            console.log('=========================');

            const firstExercise = exercises.value[0];
            if (firstExercise && typeof firstExercise.id === 'string' && firstExercise.id.trim() !== '') {
                const firstExerciseId = firstExercise.id;
                const targetPath = `/${firstExerciseId}/instruction`;
                console.log(
                    'STARTING EXPERIENCE: Navigating to',
                    targetPath,
                    'App state:', appState.value,
                );
                await navigateTo(targetPath, { replace: true });
            } else {
                console.error('Error starting experience: Invalid first exercise or missing ID.', firstExercise);
            }
        }
    };

    const resetExperience = async () => {
        if (exercises.value.length > 0) {
            appState.value = 'start';

            exercises.value = exercisesConfig.exercises.map((ex) => ({
                ...ex,
                status: 'not_started',
                results: {},
            })) as ExerciseCollection;

            currentExerciseIndex.value = 0;
            await nextTick();

            try {
                console.log('Forcing full page refresh');
                window.location.reload();
                window.location.href = '/';
            } catch (e) {
                console.error('Error navigating to / on resetExperience:', e);
                window.location.href = '/';
                window.location.reload();
            }
        }
    };

    const showResults = () => {
        appState.value = 'results';
    };

    // Initialize
    loadExercises();

    return {
        appState,
        exercises,
        exerciseCount,
        currentExercise,
        currentExerciseIndex,
        progress,
        loadExercises,
        startExperience,
        resetExperience,
        showResults,
        goToExercise,
        getAllExercises: () => exercises.value,
    };
};