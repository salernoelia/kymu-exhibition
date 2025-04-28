import * as Tone from 'tone';

export const useToneForRom = (angle: Ref<number>) => {
    const reverb = new Tone.Reverb(2).toDestination();
    // Add filter and delay nodes
    const filter = new Tone.Filter(1000, 'lowpass').connect(reverb);
    const delay = new Tone.FeedbackDelay(0.3, 0.3).connect(filter);

    const synth = new Tone.Synth(Tone.FMSynth).connect(delay);
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
        try {
            if (isPlaying.value) {
                const minAngle = 0;
                const maxAngle = 180;
                const minNote = 48; // C3
                const maxNote = 84; // C6

                // Normalize angle to 0-1 range
                const normalizedValue =
                    (Number(angle.value?.toFixed(0) || 0) - minAngle) / (maxAngle - minAngle);

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
        } catch (error) {
            console.error('Error in tone adjustment:', error);
        }
    });

    const route = useRoute();
    watch(
        () => route.path,
        () => {
            stopTone();
        }
    );

    // Clean up resources when component unmounts
    onBeforeUnmount(() => {
        stopTone();
        setTimeout(() => {
            synth.dispose();
            filter.dispose();
            delay.dispose();
            reverb.dispose();
        }, 100);
    });

    return {
        startTone,
        stopTone,
        isPlaying,
    };
};
