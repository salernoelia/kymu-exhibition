export const useExerciseStore = defineStore("exerciseStore", () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const resultAngle = ref(0);
  const painMomentAngles = ref<number[]>([]);
  const startedRecording = ref<boolean>(false);

  const exerciseStateMachine = useExerciseStateMachine();
  const exercises = exerciseStateMachine.getAllExercises();

  const getExerciseById = (exerciseId: string) => {
    const exercises = exerciseStateMachine.getAllExercises();
    return exercises.find((ex) => ex.id === exerciseId);
  };

  const setCurrentExercise = (exerciseId: string) => {
    const exercises = exerciseStateMachine.getAllExercises();
    const index = exercises.findIndex((ex) => ex.id === exerciseId);
    if (index >= 0) {
      exerciseStateMachine.goToExercise(index);
    }
  };

  return {
    isLoading,
    error,
    exercises,
    exercisesCount: exerciseStateMachine.exerciseCount,
    getExerciseById,
    setCurrentExercise,
    exerciseStateMachine,
    currentExercise: exerciseStateMachine.currentExercise,
    currentExerciseIndex: exerciseStateMachine.currentExerciseIndex,
    exerciseProgress: exerciseStateMachine.progress,
    resultAngle,
    painMomentAngles,
    startedRecording,
  };
});
