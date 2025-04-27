type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

type ExerciseResults = {
    exercise_id: text;
    achieved_repetitions?: number;
    achieved_seconds?: number;
    achieved_angle: number;
    pain_angles_deg?: number[];
};

type Exercise = {
    id: string;
    name: string;
    category: string;
    description: string;
    exercise_type: string;
    goal_type: string;
    repetitions_goal: number | null;
    duration_seconds_goal: number | null;
    type: string;
    inherited_default_exercise: null;
    therapist_added_image_urls: null;
    therapist_added_video_urls: null;
    family_scene_adjustment_access: boolean;
    results: ExerciseResults;
    status: ExerciseStatus;
};

type ExerciseCollection = Exercise[];
