export default defineNuxtRouteMiddleware((to) => {
    if (!to.path || to.path.includes('undefined')) {
        window.location.reload();
        return navigateTo('/', { replace: true });
    }
});
