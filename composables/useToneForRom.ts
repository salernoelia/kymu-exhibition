import * as Tone from 'tone';

export const useToneForRom = (angle: Ref<number>) => {
    const synth = new Tone.Synth().toDestination();
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

            const noteValue = Math.floor(
                minNote +
                    ((Number(angle.value.toFixed(0)) - minAngle) / (maxAngle - minAngle)) *
                        (maxNote - minNote)
            );

            const frequency = Tone.Frequency(noteValue, 'midi').toFrequency();

            synth.frequency.rampTo(frequency, 0.1);
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
