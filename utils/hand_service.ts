import { Camera } from '@mediapipe/camera_utils';
import {
    drawConnectors,
    drawLandmarks,
} from '@mediapipe/drawing_utils';
import type { Options, Results } from '@mediapipe/hands';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { useStorage } from '@vueuse/core';

export interface HandPosition {
    x: number;
    y: number;
    visible: boolean;
}

export interface HandResults {
    leftHand: HandPosition;
    rightHand: HandPosition;
    isPersonVisible: boolean;
}

export class HandService extends Camera {
    private readonly pipe = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    private readonly ctx: CanvasRenderingContext2D;
    private readonly exerciseDevmode = useStorage('exercise-devmode', false);

    constructor(
        public readonly canvas: HTMLCanvasElement,
        public readonly source: HTMLVideoElement,
        public readonly canvasWidth: number,
        public readonly canvasHeight: number,
        public readonly landmarkContainer: HTMLDivElement,
        public readonly loadingCanvas: Ref<boolean>,
        public mediapipeResults: Ref<Results | null>,
        public leftHand: Ref<HandPosition>,
        public rightHand: Ref<HandPosition>,
        public isPersonVisible: Ref<boolean>
    ) {
        super(source, {
            onFrame: async () => {
                try {
                    await this.pipe.send({ image: source });
                } catch (err) {
                    console.error('Error processing frame:', err);
                }
            },
            width: canvasWidth,
            height: canvasHeight,
        });

        source.addEventListener('loadedmetadata', () => {
            this.canvas.height = source.videoHeight;
            this.canvas.width = source.videoWidth;
        });

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get canvas context');
        }
        this.ctx = context;
    }

    /**
     * @param options {@link https://google.github.io/mediapipe/solutions/hands.html#javascript-solution-api|Mediapipe}
     */
    public setOptions(options: Options): Promise<void> {
        this.pipe.onResults((results) => {
            try {
                this.render(results);
                this.updateHandPositions(results);

                if (isRef(this.mediapipeResults)) {
                    this.mediapipeResults.value = results;
                } else {
                    console.error('mediapipeResults is not a Vue ref!');
                }
            } catch (err) {
                console.error('Error in hand results processing:', err);
            }
        });
        this.pipe.setOptions(options);
        return this.start();
    }

    private updateHandPositions(results: Results): void {
        try {
            // Reset hand positions
            this.leftHand.value = { x: 0, y: 0, visible: false };
            this.rightHand.value = { x: 0, y: 0, visible: false };
            this.isPersonVisible.value = false;

            if (results.multiHandLandmarks && results.multiHandedness) {
                for (let index = 0; index < results.multiHandLandmarks.length; index++) {
                    const classification = results.multiHandedness[index];
                    const landmarks = results.multiHandLandmarks[index];


                    const wrist = landmarks[0];
                    if (!wrist) continue;

                    const handPosition: HandPosition = {
                        x: wrist.x,
                        y: wrist.y,
                        visible: true
                    };

                    if (classification.label === 'Right') {
                        this.rightHand.value = handPosition;
                    } else if (classification.label === 'Left') {
                        this.leftHand.value = handPosition;
                    }
                }

                this.isPersonVisible.value = this.leftHand.value.visible || this.rightHand.value.visible;
            }
        } catch (error) {
            console.error('Error updating hand positions:', error);
        }
    }

    public render(results: Results): void {
        try {
            if (!results.image) {
                return;
            }

            if (this.loadingCanvas.value) {
                this.loadingCanvas.value = false;
            }

            const { width, height } = this.canvas;

            this.ctx.save();
            this.ctx.clearRect(0, 0, width, height);

            this.ctx.drawImage(results.image, 0, 0, width, height);


            if (this.exerciseDevmode.value && results.multiHandLandmarks && results.multiHandedness) {
                for (let index = 0; index < results.multiHandLandmarks.length; index++) {
                    const classification = results.multiHandedness[index];
                    const isRightHand = classification.label === 'Right';
                    const landmarks = results.multiHandLandmarks[index];


                    drawConnectors(this.ctx, landmarks, HAND_CONNECTIONS, {
                        color: isRightHand ? '#00FF00' : '#FF0000',
                        lineWidth: 2,
                    });

                    drawLandmarks(this.ctx, landmarks, {
                        color: isRightHand ? '#00FF00' : '#FF0000',
                        fillColor: isRightHand ? '#FF0000' : '#00FF00',
                        radius: 4,
                    });
                }
            }

            this.ctx.restore();
        } catch (error) {
            console.error('Error in render method:', error);
        }
    }

    public getHandResults(): HandResults {
        return {
            leftHand: { ...this.leftHand.value },
            rightHand: { ...this.rightHand.value },
            isPersonVisible: this.isPersonVisible.value
        };
    }

    // Expose the video stream for use in other components
    public getVideoStream(): MediaStream | null {
        return this.source.srcObject as MediaStream | null;
    }
}