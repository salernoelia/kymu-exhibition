import remoteConfig from '~/assets/remote_config.json'

export function useRemoteControl() {
    const remoteKey = ref<RemoteAction | null>(null);
    const isKeyPressed = ref(false);

    const lastKeyPressTime = ref<Record<RemoteAction, number>>({} as Record<RemoteAction, number>);

    const keyMapping: Record<string, RemoteAction> = 
        (remoteConfig.keyMappings as Record<string, RemoteAction>) || {
            w: 'up',
            a: 'left',
            s: 'down',
            d: 'right',
            Enter: 'ok',
            Backspace: 'back',
            m: 'menu',
            v: 'voice',
            p: 'shutdown',
            f: 'fullscreen',
        };
    
    const debounceTime = remoteConfig.debounceTime || 300;
    const keyPressResetTime = remoteConfig.keyPressResetTime || 100;

    const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key;
        const action = keyMapping[key];

        if (action) {
            const now = Date.now();
            const lastPress = lastKeyPressTime.value[action] || 0;

            if (now - lastPress > debounceTime) {
                // Same debounce as remote
                remoteKey.value = action;
                isKeyPressed.value = true;
                lastKeyPressTime.value[action] = now;
                console.log(`Key pressed: ${action}`);

                setTimeout(() => {
                    if (remoteKey.value === action) {
                        remoteKey.value = null;
                        isKeyPressed.value = false;
                    }
                }, keyPressResetTime);
            }
        }
    };

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });

    return {
        remoteKey,
        isKeyPressed,
    };
}