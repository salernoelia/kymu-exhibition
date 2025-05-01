import * as Tone from 'tone';

export const useToneForRom = (angle: Ref<number>) => {
    const filter = new Tone.Filter(200, 'lowpass').toDestination();
    const delay = new Tone.FeedbackDelay(0.3, 0.5).connect(filter);
    const reverb = new Tone.Reverb(2).connect(delay);
    const synth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: {
            type: 'sine',
        },
        envelope: {
            attack: 0.05,
            decay: 0.3,
            sustain: 0.6,
            release: 1.2,
        },
        modulation: {
            type: 'sine',
        },
        modulationEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.3,
            release: 0.8,
        },
    }).connect(reverb);

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

                const normalizedValue =
                    (Number(angle.value?.toFixed(0) || 0) - minAngle) / (maxAngle - minAngle);

                const noteValue = Math.floor(minNote + normalizedValue * (maxNote - minNote));
                const frequency = Tone.Frequency(noteValue, 'midi').toFrequency();

                synth.frequency.setValueAtTime(frequency, Tone.now());

                const filterCutoff = 200 + normalizedValue * 5000;
                filter.frequency.rampTo(filterCutoff, 0.2);

                const delayFeedback = 0.1 + normalizedValue * 0.4;
                delay.feedback.rampTo(delayFeedback, 0.3);

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
