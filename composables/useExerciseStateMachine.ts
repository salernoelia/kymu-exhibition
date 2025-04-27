import exercisesConfig from "~/assets/exercises_config.json";

export const useExerciseStateMachine = () => {
  const appState = ref<"start" | "exercises" | "results">("start");
  const exercises = ref<ExerciseCollection>([]);
  const currentExerciseIndex = ref<number>(0);
  const exerciseCount = computed(() => exercises.value.length);

  const currentExercise = computed<Exercise | null>(() => {
    if (exercises.value.length === 0 || appState.value !== "exercises")
      return null;
    return exercises.value[currentExerciseIndex.value];
  });

  const progress = computed(() => {
    if (exercises.value.length === 0) {
      return { current: 0, total: 0, percentage: 0 };
    }
    const currentIdx =
      currentExerciseIndex.value < exercises.value.length
        ? currentExerciseIndex.value
        : 0;
    const current = currentIdx + 1;
    const total = exercises.value.length;
    const percentage = Math.round((current / total) * 100);
    return { current, total, percentage };
  });

  const loadExercises = () => {
    exercises.value = exercisesConfig.exercises.map((ex) => ({
      ...ex,
      status: "not_started",
      results: {},
    })) as ExerciseCollection;
    currentExerciseIndex.value = 0;
    appState.value = "start";
  };

  const startExperience = () => {
    if (exercises.value.length > 0) {
      appState.value = "exercises";
      console.log(appState.value, "is experience state");
    }
  };

  const showResults = () => {
    appState.value = "results";
  };

  const goToExercise = (index: number) => {
    if (
      appState.value === "exercises" &&
      index >= 0 &&
      index < exercises.value.length
    ) {
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
    showResults,
    goToExercise,
    getAllExercises: () => exercises.value,
  };
};
