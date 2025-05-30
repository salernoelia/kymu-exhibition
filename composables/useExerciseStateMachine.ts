import exercisesConfig from '~/assets/exercises_config.json';

import { v4 } from 'uuid';

export const useExerciseStateMachine = () => {
    const appState = ref<'start' | 'exercises' | 'results'>('start');
    const exercises = ref<ExerciseCollection>([]);
    const currentExerciseIndex = ref<number>(0);
    const exerciseCount = computed(() => exercises.value.length);
    const exerciseStore = useExerciseStore();

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

    const startExperience = async () => {
        if (exercises.value.length > 0) {
            appState.value = 'exercises';
            currentExerciseIndex.value = 0;
            exerciseStore.userKey = v4();
            console.log('=========================');
            console.log('Experience has started', exerciseStore.userKey);
            console.log('=========================');


            const firstExercise = exercises.value[0];

            if (firstExercise && typeof firstExercise.id === 'string' && firstExercise.id.trim() !== '') {
                const firstExerciseId = firstExercise.id;
                const targetPath = `/${firstExerciseId}/instruction`;
                console.log(
                    'STARTING EXPERIENCE: Navigating to',
                    targetPath,
                    'App state:', appState.value,
                    'User key:', exerciseStore.userKey
                );
                await navigateTo(targetPath, { replace: true });
            } else {
                console.error('Error starting experience: Invalid first exercise or missing ID.', firstExercise);

                //await resetExperience(); 
            }
        }
    };

    const resetExperience = async () => {
        if (exercises.value.length > 0) {
            appState.value = 'start';

            exerciseStore.userKey = '';
            exerciseStore.resultAngle = 0;
            exerciseStore.painMomentAngles = [];
            exerciseStore.startedRecording = false;
            exerciseStore.isLoading = false;
            exerciseStore.error = null;

            exercises.value = exercisesConfig.exercises.map((ex) => ({
                ...ex,
                status: 'not_started',
                results: {},
            })) as ExerciseCollection;

            currentExerciseIndex.value = 0;


            await nextTick();

            try {
                console.log('Attempting navigation to / after state reset and nextTick');
                await navigateTo('/', { replace: true });
            } catch (e) {
                console.error('Error navigating to / on resetExperience:', e);
                window.location.href = '/';
            }
        }
    };
    const showResults = () => {
        appState.value = 'results';
    };

    const goToExercise = (index: number) => {
        if (index >= 0 && index < exercises.value.length) {
            currentExerciseIndex.value = index;
        }
    };

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
