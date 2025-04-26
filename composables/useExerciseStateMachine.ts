import exercisesConfig from "~/assets/exercises_config.json";

export const useExerciseStateMachine = () => {
  // --- State ---
  const appState = ref<"start" | "exercises" | "results">("start");
  const exercises = ref<ExerciseCollection>([]);
  const currentExerciseIndex = ref<number>(0);
  const exerciseCount = computed(() => exercises.value.length);

  // --- Computed ---
  const currentExercise = computed<Exercise | null>(() => {
    if (exercises.value.length === 0 || appState.value !== "exercises")
      return null;
    return exercises.value[currentExerciseIndex.value];
  });

  const progress = computed(() => {
    if (exercises.value.length === 0) {
      return { current: 0, total: 0, percentage: 0 };
    }
    // Ensure index is valid before calculating progress
    const currentIdx =
      currentExerciseIndex.value < exercises.value.length
        ? currentExerciseIndex.value
        : 0;
    const current = currentIdx + 1;
    const total = exercises.value.length;
    const percentage = Math.round((current / total) * 100);
    return { current, total, percentage };
  });

  // --- Methods ---

  // Initialize directly from the imported JSON
  const loadExercises = () => {
    // Map the raw config to add the initial state properties
    exercises.value = exercisesConfig.exercises.map((ex) => ({
      ...ex,
      status: "not_started", // Default status
      results: {}, // Default results
    })) as ExerciseCollection; // Add type assertion if needed
    currentExerciseIndex.value = 0; // Reset index
    appState.value = "start"; // Ensure starting state
  };

  const startExperience = () => {
    if (exercises.value.length > 0) {
      appState.value = "exercises";
      // Optionally reset statuses or index here if needed on restart
      // currentExerciseIndex.value = 0;
      // exercises.value.forEach(ex => ex.status = 'not_started');
    }
  };

  const showResults = () => {
    // Logic to determine if results can be shown (e.g., all completed?)
    // For now, just allows transitioning to the results state
    appState.value = "results";
  };

  const goToNextExercise = () => {
    if (exercises.value.length === 0 || appState.value !== "exercises") return;
    const nextIndex = currentExerciseIndex.value + 1;
    // Loop back to the first exercise if currently on the last one
    currentExerciseIndex.value =
      nextIndex >= exercises.value.length ? 0 : nextIndex;
  };

  const goToPreviousExercise = () => {
    if (exercises.value.length === 0 || appState.value !== "exercises") return;
    const prevIndex = currentExerciseIndex.value - 1;
    // Loop back to the last exercise if currently on the first one
    currentExerciseIndex.value =
      prevIndex < 0 ? exercises.value.length - 1 : prevIndex;
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

  const startCurrentExercise = () => {
    if (currentExercise.value) {
      currentExercise.value.status = "in_progress";
    }
  };

  const completeCurrentExercise = (results?: any) => {
    if (currentExercise.value) {
      currentExercise.value.status = "completed";
      if (results) {
        currentExercise.value.results = results;
      }
      // Optional: Automatically navigate to next or show results if all done
      // if (exercises.value.every(ex => ex.status === 'completed')) {
      //   showResults();
      // } else {
      //   goToNextExercise(); // Or let the user click next
      // }
    }
  };

  const skipCurrentExercise = () => {
    if (currentExercise.value) {
      // Mark as completed even when skipped, or use a different status like 'skipped'
      currentExercise.value.status = "completed";
      // goToNextExercise(); // Or let the user click next
    }
  };

  const getExerciseStatus = (exerciseId: string): Exercise["status"] | null => {
    const exercise = exercises.value.find((ex) => ex.id === exerciseId);
    return exercise ? exercise.status : null;
  };

  const getAllExercises = (): ExerciseCollection => exercises.value;

  // --- Lifecycle ---
  // Load exercises when the composable is first used
  loadExercises();

  // --- Return ---
  return {
    appState,
    exercises,
    exerciseCount,
    currentExercise,
    currentExerciseIndex,
    progress,
    // --- Actions ---
    loadExercises,
    startExperience,
    showResults,
    goToNextExercise,
    goToPreviousExercise,
    goToExercise,
    startCurrentExercise,
    completeCurrentExercise,
    skipCurrentExercise,
    // --- Getters ---
    getExerciseStatus,
    getAllExercises, // Useful for overview or results page
  };
};
