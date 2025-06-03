type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

type ExerciseResults = {
    exercise_id: text;
    achieved_repetitions?: number;
    achieved_seconds?: number;
    achieved_angle?: number;
    achieved_accuracy?: number;
    achieved_score?: number;
    game_duration?: number;
    hands_detected?: boolean;
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
    type: "range-of-motion" | "p5_game";
    therapist_added_image_urls: string[] | null;
    therapist_added_video_urls: string[] | null;
    family_scene_adjustment_access: boolean;
    results: ExerciseResults;
    status: ExerciseStatus;
};

type ExerciseCollection = Exercise[];
