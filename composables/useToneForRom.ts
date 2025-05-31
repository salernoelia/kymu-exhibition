
import Soundfont from 'soundfont-player';

export const useToneForRom = (angle: Ref<number>) => {
    const audioContext = ref<AudioContext | null>(null);
    const instrument = ref<Soundfont.Player | null>(null);
    const isPlaying = ref(false);
    const currentNote = ref<Soundfont.Player | null>(null);
    const lastPlayedNote = ref<string | null>(null);


    const initializeAudio = async () => {
        if (!audioContext.value) {
            audioContext.value = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }

        if (!instrument.value) {
            instrument.value = await Soundfont.instrument(audioContext.value, 'xylophone');
        }
    };


    const startTone = async () => {
        if (!isPlaying.value) {
            await initializeAudio();
            if (audioContext.value?.state === 'suspended') {
                await audioContext.value.resume();
            }

            const initialNote = angleToNote(angle.value);
            if (instrument.value) {
                currentNote.value = instrument.value.play(initialNote, audioContext.value!.currentTime, {
                    duration: 999,
                    gain: 0.7
                });
            }

            console.log('Starting kalimba tone');
            isPlaying.value = true;
        }
    };

    const stopTone = () => {
        if (isPlaying.value && currentNote.value) {
            currentNote.value.stop();
            currentNote.value = null;
            isPlaying.value = false;
            console.log('Stopping kalimba tone');
        }
    };
    const angleToNote = (angleValue: number): string => {
        const minAngle = 0;
        const maxAngle = 180;
        const kalimbaNotes = [
            'G3', 'G#3', 'A3', 'A#3', 'B3',
            'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
            'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
            'C6', 'C#6', 'D6', 'D#6', 'E6'
        ];

        const normalizedValue = Math.max(0, Math.min(1,
            (Number(angleValue || 0) - minAngle) / (maxAngle - minAngle)
        ));

        const noteIndex = Math.floor(normalizedValue * (kalimbaNotes.length - 1));
        return kalimbaNotes[noteIndex];
    };

    watchEffect(async () => {
        try {
            if (isPlaying.value && instrument.value) {
                const newNote = angleToNote(angle.value);

                if (newNote === lastPlayedNote.value) {
                    return;
                }

                if (currentNote.value) {
                    currentNote.value.stop();
                }

                currentNote.value = instrument.value.play(newNote, audioContext.value!.currentTime, {
                    duration: 0.5,
                    gain: 0.7
                });

                lastPlayedNote.value = newNote;
            }
        } catch (error) {
            console.error('Error in kalimba note adjustment:', error);
        }
    });
    const route = useRoute();
    watch(
        () => route.path,
        () => {
            stopTone();
        }
    );

    onBeforeUnmount(() => {
        stopTone();
        if (audioContext.value) {
            audioContext.value.close();
        }
    });

    return {
        startTone,
        stopTone,
        isPlaying,
    };
};