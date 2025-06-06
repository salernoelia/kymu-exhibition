/**
 * Composable for managing sound playback in the application
 *
 * @returns Methods for loading and playing audio files
 */
export function useSoundPlayer() {
    const audioCache = ref<Record<string, HTMLAudioElement>>({});
    const lastPlayedTimestamps = ref<Record<string, number>>({});

    /**
     * Preloads an audio file for faster playback later
     *
     * @param path Path to the audio file
     * @returns Promise that resolves when audio is loaded
     */
    const preloadSound = async (path: string): Promise<void> => {
        if (audioCache.value[path]) return;

        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            audio.addEventListener(
                'canplaythrough',
                () => {
                    audioCache.value[path] = audio;
                    resolve();
                },
                { once: true }
            );
            audio.addEventListener(
                'error',
                (err) => {
                    console.error(`Failed to load audio: ${path}`, err);
                    reject(err);
                },
                { once: true }
            );
            audio.load();
        });
    };

    /**
     * Plays a sound file
     *
     * @param path Path to the audio file
     * @param volume Optional volume level (0.0-1.0)
     * @returns Promise that resolves when playback starts
     */
    const playSound = async (path: string, volume = 1.0): Promise<void> => {
        try {
            if (!audioCache.value[path]) {
                await preloadSound(path);
            }
            const audio = audioCache.value[path];

            audio.currentTime = 0;
            audio.volume = Math.min(Math.max(volume, 0), 1);

            return audio.play();
        } catch (error) {
            console.error(`Failed to play sound: ${path}`, error);
        }
    };

    /**
     * Plays multiple sound files simultaneously
     *
     * @param sounds Array of sound configurations with path and optional volume
     * @returns Promise that resolves when all sounds start playing
     */
    const playSounds = async (sounds: Array<{ path: string; volume?: number }>): Promise<void> => {
        const playPromises = sounds.map(({ path, volume = 1.0 }) => {
            return playSound(path, volume);
        });

        await Promise.all(playPromises);
    };



    const playSuccessSound = async () => {
        return playSound('/sfx/success.wav');
    };

    const playStartSound = () => {
        return playSound('/sfx/start.wav');
    };

    const playTransitionSound = () => {
        return playSound('/sfx/transition.wav');
    };

    const playResultsSound = async () => {
        return await playSounds([
            { path: '/sfx/results.wav', volume: 1 },
            { path: '/sfx/applause.wav', volume: 0.5 },
        ]);
    };

    const playErrorSound = () => {
        return playSound('/sfx/error.wav');
    };

    const playCautionSound = () => {
        return playSound('/sfx/caution.wav', 0.6);
    };

    const playInstructionSound = () => {
        return playSound('/sfx/instruction.wav');
    };

    const playRecordingSound = () => {
        return playSound('/sfx/recording.wav');
    };

    const playScoreSound = () => {
        return playSound('/sfx/score.wav');
    };

    const playProgressSound = () => {
        return playSound('/sfx/progress.wav');
    };

    const playWarningSound = () => {
        return playSound('/sfx/recognized.wav');
    };

    const playCaughtSaund = () => {
        return playSound('/sfx/caught.wav');
    };

    const playEatingSoundOne = () => {
        return playSound('/sfx/eating_1.wav')
    };
    const playEatingSoundTwo = () => {
        return playSound('/sfx/eating_2.wav')
    };

    const playDetectedSound = () => {
        const path = '/sfx/recognized.wav';
        const now = Date.now();
        const lastPlayed = lastPlayedTimestamps.value[path] || 0;

        if (now - lastPlayed >= 500) {
            lastPlayedTimestamps.value[path] = now;
            return playSound(path);
        }
        return Promise.resolve();
    };




    return {
        preloadSound,
        playSound,
        playCautionSound,
        playSounds,
        playInstructionSound,
        playWarningSound,
        playSuccessSound,
        playResultsSound,
        playProgressSound,
        playStartSound,
        playTransitionSound,
        playErrorSound,
        playRecordingSound,
        playScoreSound,
        playEatingSoundOne,
        playEatingSoundTwo,
        playDetectedSound,
        playCaughtSaund,
    };
}
