let navigationHistory: string[] = [];
const MAX_HISTORY = 3;

export default defineNuxtRouteMiddleware((to) => {
    const exerciseStore = useExerciseStore();
    if (!to.path || to.path.includes('undefined')) {
        window.location.reload();
        // return navigateTo('/', { replace: true });
        exerciseStore.resetExperience();
    }

    navigationHistory.push(to.path);

    if (navigationHistory.length > MAX_HISTORY) {
        navigationHistory = navigationHistory.slice(-MAX_HISTORY);
    }

    const recentHistory = navigationHistory.slice(0, -1);
    if (recentHistory.includes(to.path)) {
        console.log('=================================');
        console.log('Circular loop detected! Resetting');
        console.log('=================================');
        navigationHistory = [];
        // return navigateTo('/', { replace: true });
        exerciseStore.resetExperience();
    }
});