import { Camera } from '@mediapipe/camera_utils';
import {
    drawConnectors,
    drawLandmarks,
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
    // public savedLandmarks: Ref<NormalizedLandmarkList | null> = ref(null);

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

            this.ctx.restore();
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
            // Ensure landmarks exist at these indices and indices are valid
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

            // Get pivot point (e.g. elbow)
            const pivot = currentLandmarks[pivotIndex];

            // Get the saved position (point A)
            const pointA = savedLandmarks[pointIndex];

            // Get current position (point B)
            const pointB = currentLandmarks[pointIndex];

            const minVisibility = 0.7;
            if (
                (pivot.visibility || 0) < minVisibility ||
                (pointA.visibility || 0) < minVisibility ||
                (pointB.visibility || 0) < minVisibility
            ) {
                return;
            }

            const { angle, angleRad, startAngle, endAngle, vectorA, vectorB } =
                this.calculateJointAngle(pivot, pointA, pointB);

            const { width, height } = this.canvas;
            const pivotX = pivot.x * width;
            const pivotY = pivot.y * height;

            const radius =
                Math.min(
                    Math.sqrt(vectorA.x * vectorA.x + vectorA.y * vectorA.y),
                    Math.sqrt(vectorB.x * vectorB.x + vectorB.y * vectorB.y)
                ) * 0.3;

            this.ctx.beginPath();
            this.ctx.moveTo(pivotX, pivotY);
            this.ctx.arc(pivotX, pivotY, radius * width * 1.5, startAngle, endAngle);
            this.ctx.lineTo(pivotX, pivotY);
            this.ctx.closePath();

            const arcLength = endAngle - startAngle;
            const gradientAngle = startAngle + arcLength / 2;
            const gradientStartX = pivotX + Math.cos(startAngle) * radius * width * 1.5;
            const gradientStartY = pivotY + Math.sin(startAngle) * radius * width * 1.5;
            const gradientEndX = pivotX + Math.cos(endAngle) * radius * width * 1.5;
            const gradientEndY = pivotY + Math.sin(endAngle) * radius * width * 1.5;

            const gradient = this.ctx.createLinearGradient(
                gradientStartX,
                gradientStartY,
                gradientEndX,
                gradientEndY
            );

            gradient.addColorStop(0, '#1734a3'); // Start of arc is blue
            gradient.addColorStop(0.33, '#4b59b6'); // First third
            gradient.addColorStop(0.66, '#b96e48'); // Second third
            gradient.addColorStop(1, '#ee5826'); // End of arc is orange

            // Apply gradient fill
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = '#FFFFFF'; //
            this.ctx.textAlign = 'center';

            const textAngle = (startAngle + endAngle) / 2;
            const textRadius = radius * 1.8; // Position text further out from the pie
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
}
