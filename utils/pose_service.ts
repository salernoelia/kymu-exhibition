import { Camera } from '@mediapipe/camera_utils';
import {
    drawConnectors,
    // drawLandmarks,
    type NormalizedLandmarkList,
} from '@mediapipe/drawing_utils';
import type { Options, Results } from '@mediapipe/pose';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { useStorage } from '@vueuse/core';

export class PoseService extends Camera {
    private readonly pipe = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    private readonly ctx: CanvasRenderingContext2D;
    private readonly exerciseDevmode = useStorage('exercise-devmode', false);
    private exerciseStore = useExerciseStore();

    private lastFrameTime = performance.now();
    private fps = 0;
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
        public savedLandmarks: Ref<NormalizedLandmarkList | null>,
        public pivotIndex: Ref<number>,
        public pointIndex: Ref<number>,
        public readonly angle: Ref<number>
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
     * @param options {@link https://google.github.io/mediapipe/solutions/pose.html#javascript-solution-api|Mediapipe}
     */
    public setOptions(options: Options): Promise<void> {
        this.pipe.onResults((results) => {
            try {
                this.render(results);
                if (isRef(this.mediapipeResults)) {
                    this.mediapipeResults.value = {
                        ...results,
                        poseWorldLandmarks: results.poseWorldLandmarks,
                    };
                } else {
                    console.error('mediapipeResults is not a Vue ref!');
                }
            } catch (err) {
                console.error('Error in pose results processing:', err);
            }
        });
        this.pipe.setOptions(options);
        return this.start();
    }

    public render({
        poseLandmarks,
        // segmentationMask,
        // poseWorldLandmarks,
        image,
    }: Results): void {
        try {
            // Guard against missing or invalid data
            if (!poseLandmarks || !image) {
                return;
            }

            if (this.loadingCanvas.value) {
                this.loadingCanvas.value = false;
            }

            const { width, height } = this.canvas;
            // this.logService.delay_log(10, "width: %d, height: %d", width, height);
            // this.logService.delay_log(10, "poseLandmarks", poseLandmarks);

            this.ctx.save();
            this.ctx.clearRect(0, 0, width, height);

            this.ctx.globalCompositeOperation = 'source-in';
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(0, 0, width, height);

            this.ctx.globalCompositeOperation = 'destination-atop';
            this.ctx.drawImage(image, 0, 0, width, height);

            this.ctx.globalCompositeOperation = 'source-over';

            if (this.exerciseDevmode.value) {
                drawConnectors(this.ctx, poseLandmarks, POSE_CONNECTIONS, {
                    color: '#e8ebf6',
                    lineWidth: 2,
                });
            }
            // drawLandmarks(this.ctx, poseLandmarks, {
            //     color: '#e8ebf6',
            //     lineWidth: 2,
            // });

            //  if saved landmarks is not null, draw them also
            if (this.savedLandmarks.value) {
                // drawLandmarks(this.ctx, this.savedLandmarks.value, {
                //     color: '#1734a3',
                //     lineWidth: 2,
                // });
                if (this.exerciseDevmode.value) {
                    drawConnectors(this.ctx, this.savedLandmarks.value, POSE_CONNECTIONS, {
                        color: '#1734a3',
                        lineWidth: 2,
                    });
                }

                // Draw angle arc and text for specific joints
                // For example, for right elbow (assuming indices 12=shoulder, 14=elbow, 16=wrist)
                this.drawJointAngle(
                    this.pivotIndex.value,
                    this.pointIndex.value,
                    poseLandmarks,
                    this.savedLandmarks.value
                );
            }

            // const activeEffect = 'mask';

            // if (segmentationMask) {
            //     this.ctx.drawImage(segmentationMask, 0, 0, this.canvas.width, this.canvas.height);
            //     if (activeEffect === 'mask' || activeEffect === 'both') {
            //         this.ctx.globalCompositeOperation = 'source-in';
            //         this.ctx.fillStyle = '#00FF007F';
            //         this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            //     } else {
            //         this.ctx.globalCompositeOperation = 'source-out';
            //         this.ctx.fillStyle = '#0000FF7F';
            //         this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            //     }
            //     // Only overwrite missing pixels.
            //     this.ctx.globalCompositeOperation = 'destination-atop';
            //     this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
            //     this.ctx.globalCompositeOperation = 'source-over';
            // }


            this.ctx.restore();

            this.drawFPS();
        } catch (error) {
            console.error('Error in render method:', error);
        }
    }

    private drawJointAngle(
        pivotIndex: number,
        pointIndex: number,
        currentLandmarks: NormalizedLandmarkList,
        savedLandmarks: NormalizedLandmarkList
    ): void {
        try {
            if (
                !currentLandmarks ||
                !savedLandmarks ||
                pivotIndex < 0 ||
                pointIndex < 0 ||
                pivotIndex >= currentLandmarks.length ||
                pointIndex >= currentLandmarks.length ||
                pivotIndex >= savedLandmarks.length ||
                pointIndex >= savedLandmarks.length ||
                !currentLandmarks[pivotIndex] ||
                !currentLandmarks[pointIndex] ||
                !savedLandmarks[pivotIndex] ||
                !savedLandmarks[pointIndex]
            ) {
                return;
            }

            const pivot = currentLandmarks[pivotIndex];
            const pointA = savedLandmarks[pointIndex];
            const pointB = currentLandmarks[pointIndex];

            const minVisibility = 0.65;
            if (
                (pivot.visibility || 0) < minVisibility ||
                (pointA.visibility || 0) < minVisibility ||
                (pointB.visibility || 0) < minVisibility
            ) {
                return;
            }

            const { angle, startAngle, endAngle, vectorA, vectorB } =
                this.calculateJointAngle(pivot, pointA, pointB);

            let angleDiff = Math.abs(endAngle - startAngle);
            if (angleDiff > Math.PI) {
                angleDiff = 2 * Math.PI - angleDiff;
            }
            const maxArcAngle = (180 * Math.PI) / 180;

            if (angleDiff > maxArcAngle) {
                return;
            }

            const { width, height } = this.canvas;
            const pivotX = pivot.x * width;
            const pivotY = pivot.y * height;

            const radius =
                Math.min(
                    Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y),
                    Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y)
                ) * 0.6;

            const arcRadius = radius * width * 1.5;

            if (angle > 0 && angle <= 180) {
                this.ctx.beginPath();
                this.ctx.arc(pivotX, pivotY, arcRadius, startAngle, endAngle);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }


            if (angle > 0) {
                this.ctx.beginPath();
                this.ctx.arc(pivotX, pivotY, arcRadius, startAngle, endAngle);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            const arrowAngle = endAngle;
            const arrowX = pivotX + arcRadius * Math.cos(arrowAngle);
            const arrowY = pivotY + arcRadius * Math.sin(arrowAngle);

            const arrowDirection = arrowAngle + Math.PI / 2;
            const arrowSize = 15;

            this.ctx.save();
            this.ctx.translate(arrowX, arrowY);
            this.ctx.rotate(arrowDirection);

            this.ctx.beginPath();
            this.ctx.moveTo(-arrowSize, -arrowSize / 2);
            this.ctx.lineTo(0, 0);
            this.ctx.lineTo(-arrowSize, arrowSize / 2);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.restore();

            this.ctx.font = '200 24px Poppins';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';

            const textAngle = (startAngle + endAngle) / 2;
            const textRadius = radius * 2;
            const textX = pivotX + textRadius * width * Math.cos(textAngle);
            const textY = pivotY + textRadius * width * Math.sin(textAngle);

            this.ctx.fillText(`${angle}°`, textX, textY);

            if (this.angle && isRef(this.angle)) {
                this.angle.value = angle;
            }
        } catch (error) {
            console.error('Error in drawJointAngle:', error);
        }
    }

    /**
     * Calculate the angle between two vectors from a pivot point
     * @param pivot The pivot point (joint)
     * @param pointA First reference point (e.g. from saved landmarks)
     * @param pointB Second reference point (e.g. from current landmarks)
     * @returns The angle in degrees and radians, plus vectors and arc angles
     */
    private calculateJointAngle(
        pivot: { x: number; y: number },
        pointA: { x: number; y: number },
        pointB: { x: number; y: number }
    ): {
        angle: number;
        angleRad: number;
        startAngle: number;
        endAngle: number;
        vectorA: { x: number; y: number };
        vectorB: { x: number; y: number };
    } {
        try {
            const vectorA = {
                x: pointA.x - pivot.x,
                y: pointA.y - pivot.y,
            };

            const vectorB = {
                x: pointB.x - pivot.x,
                y: pointB.y - pivot.y,
            };

            const dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y;
            const magA = Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y);
            const magB = Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y);

            // Prevent division by zero
            if (magA === 0 || magB === 0) {
                return {
                    angle: 0,
                    angleRad: 0,
                    startAngle: 0,
                    endAngle: 0,
                    vectorA,
                    vectorB,
                };
            }

            const cosTheta = Math.min(Math.max(dotProduct / (magA * magB), -1), 1);
            const angleRad = Math.acos(cosTheta);
            const angle = Math.round(angleRad * (180 / Math.PI));

            let startAngle = Math.atan2(vectorA.y, vectorA.x);
            let endAngle = Math.atan2(vectorB.y, vectorB.x);

            if (Math.abs(endAngle - startAngle) > Math.PI) {
                if (endAngle > startAngle) {
                    startAngle += 2 * Math.PI;
                } else {
                    endAngle += 2 * Math.PI;
                }
            }

            return {
                angle,
                angleRad,
                startAngle,
                endAngle,
                vectorA,
                vectorB,
            };
        } catch (error) {
            console.error('Error in calculateJointAngle:', error);
            return {
                angle: 0,
                angleRad: 0,
                startAngle: 0,
                endAngle: 0,
                vectorA: { x: 0, y: 0 },
                vectorB: { x: 0, y: 0 },
            };
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
}
