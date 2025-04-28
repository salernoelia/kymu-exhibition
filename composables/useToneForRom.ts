import * as Tone from 'tone';

export const useToneForRom = (angle: Ref<number>) => {
    const reverb = new Tone.Reverb(2).toDestination();

    const synth = new Tone.Synth(Tone.FMSynth).connect(reverb);
    synth.set({
        harmonicity: 2,
        modulationIndex: 3.5,
        oscillator: {
            type: 'sine',
        },
        envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.8,
            release: 1.5,
        },
        modulation: {
            type: 'triangle',
        },
        modulationEnvelope: {
            attack: 0.5,
            decay: 0.1,
            sustain: 0.2,
            release: 0.5,
        },
    });
    const isPlaying = ref(false);

    const startTone = () => {
        if (!isPlaying.value) {
            Tone.start();
            synth.triggerAttack('C3');
            console.log('starting tone');
            isPlaying.value = true;
        }
    };
    const stopTone = () => {
        if (isPlaying.value) {
            synth.triggerRelease();
            isPlaying.value = false;
            console.log('stopping tone');
        }
    };

    watchEffect(() => {
        if (isPlaying.value) {
            const minAngle = 0;
            const maxAngle = 180;
            const minNote = 48; // C3
            const maxNote = 84; // C6

            // Normalize angle to 0-1 range
            const normalizedValue =
                (Number(angle.value.toFixed(0)) - minAngle) / (maxAngle - minAngle);

            // Map to note
            const noteValue = Math.floor(minNote + normalizedValue * (maxNote - minNote));
            const frequency = Tone.Frequency(noteValue, 'midi').toFrequency();

            // Update frequency with smoother transition
            synth.set({
                frequency: frequency,
            });

            // Map to filter cutoff (higher angles = brighter sound)
            const filterCutoff = 200 + normalizedValue * 5000;
            filter.frequency.rampTo(filterCutoff, 0.2);

            // Map to reverb/delay amount (higher angles = more atmospheric)
            const delayFeedback = 0.1 + normalizedValue * 0.4;
            delay.feedback.rampTo(delayFeedback, 0.3);

            // Map to modulation (higher angles = more modulation)
            if (synth.get().modulationIndex) {
                const modIndex = 1 + normalizedValue * 10;
                synth.set({ modulationIndex: modIndex });
            }
        }
    });

    const route = useRoute();
    watch(
        () => route.path,
        () => {
            stopTone();
        }
    );

    return {
        startTone,
        stopTone,
        isPlaying,
    };
};
