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

    private exerciseStore = useExerciseStore();
    private readonly ctx: CanvasRenderingContext2D;
    private readonly exerciseDevmode = useStorage('exercise-devmode', false);
    private lastFrameTime = performance.now();
    public fps = 0;
    public zoom = 1.0;
    private _lowFpsStartTime: null | number = null;
    private readonly LOW_FPS_THRESHOLD = 12;
    private readonly LOW_FPS_TIMEOUT_MS = 4000;

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

            // ZOOM LOGIC 
            const zoom = this.zoom || 1.0;
            const cx = width / 2;
            const cy = height / 2;
            this.ctx.translate(cx, cy);
            this.ctx.scale(zoom, zoom);
            this.ctx.translate(-cx, -cy);

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
            this.drawFPS()
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

    public getVideoStream(): MediaStream | null {
        return this.source.srcObject as MediaStream | null;
    }

    public cleanup(): void {
        try {
            this.stop();

            if (this.pipe) {
                this.pipe.close();
            }

            this.leftHand.value = { x: 0, y: 0, visible: false };
            this.rightHand.value = { x: 0, y: 0, visible: false };
            this.isPersonVisible.value = false;
            this.mediapipeResults.value = null;

            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            console.log('HandService cleanup completed');
        } catch (error) {
            console.error('Error during HandService cleanup:', error);
        }
    }

    private calculateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.fps = 1000 / delta;
        this.lastFrameTime = now;


        if (!this._lowFpsStartTime && this.fps < this.LOW_FPS_THRESHOLD) {
            this._lowFpsStartTime = now;
        } else if (this._lowFpsStartTime && this.fps >= this.LOW_FPS_THRESHOLD) {
            this._lowFpsStartTime = null;
        }

        if (this._lowFpsStartTime && now - this._lowFpsStartTime > this.LOW_FPS_TIMEOUT_MS) {
            console.log("Low FPS detected for over 2s, resetting experience");
            this.exerciseStore.resetExperience();
            this._lowFpsStartTime = null;
        }

    }

    private drawFPS(): void {
        this.calculateFPS()
        if (!this.exerciseDevmode.value) return;


        this.ctx.save();
        this.ctx.font = 'bold 18px Poppins, Arial, sans-serif';
        this.ctx.fillStyle = '#00FF00';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 10, 30);
        this.ctx.restore();
    }

    public setZoom(factor: number) {
        this.zoom = Math.max(1, factor); // Prevent zoom < 1
    }
}