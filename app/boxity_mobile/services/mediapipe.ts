import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

interface DetectionResult {
  isAligned: boolean;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  feedback: 'move_closer' | 'move_farther' | 'align_box' | 'hold_steady' | 'rotate_box' | 'ready';
}

class MediaPipeService {
  private isInitialized = false;
  private model: tf.GraphModel | null = null;
  private readonly CONFIDENCE_THRESHOLD = 85;
  private readonly MIN_BOX_AREA = 0.15;
  private readonly MAX_BOX_AREA = 0.65;
  private readonly CENTER_TOLERANCE = 0.15;

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('MediaPipe: Initializing TensorFlow...');
      await tf.ready();
      console.log('MediaPipe: TensorFlow ready');
      this.isInitialized = true;
    } catch (error) {
      console.error('MediaPipe: Initialization failed:', error);
      throw error;
    }
  }

  async detectBox(imageData: ImageData, frameWidth: number, frameHeight: number): Promise<DetectionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tensor = tf.browser.fromPixels(imageData);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      const mockDetection = this.generateMockDetection(frameWidth, frameHeight);
      
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();

      return mockDetection;
    } catch (error) {
      console.error('MediaPipe: Detection failed:', error);
      return {
        isAligned: false,
        confidence: 0,
        boundingBox: null,
        feedback: 'align_box',
      };
    }
  }

  private generateMockDetection(frameWidth: number, frameHeight: number): DetectionResult {
    const centerX = frameWidth / 2;
    const centerY = frameHeight / 2;
    
    const variation = Math.random();
    
    if (variation < 0.3) {
      return {
        isAligned: false,
        confidence: Math.floor(Math.random() * 50 + 20),
        boundingBox: {
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
          width: frameWidth * 0.3,
          height: frameHeight * 0.2,
        },
        feedback: Math.random() > 0.5 ? 'move_closer' : 'align_box',
      };
    } else if (variation < 0.5) {
      return {
        isAligned: false,
        confidence: Math.floor(Math.random() * 35 + 50),
        boundingBox: {
          x: centerX - 50,
          y: centerY - 30,
          width: frameWidth * 0.5,
          height: frameHeight * 0.35,
        },
        feedback: 'rotate_box',
      };
    } else {
      const confidence = Math.floor(Math.random() * 15 + 85);
      return {
        isAligned: confidence >= this.CONFIDENCE_THRESHOLD,
        confidence,
        boundingBox: {
          x: centerX - (frameWidth * 0.25),
          y: centerY - (frameHeight * 0.15),
          width: frameWidth * 0.5,
          height: frameHeight * 0.3,
        },
        feedback: confidence >= this.CONFIDENCE_THRESHOLD ? 'ready' : 'hold_steady',
      };
    }
  }

  calculateAlignmentConfidence(
    boxCenter: { x: number; y: number },
    frameCenter: { x: number; y: number },
    boxArea: number,
    frameArea: number
  ): number {
    const distanceX = Math.abs(boxCenter.x - frameCenter.x) / frameCenter.x;
    const distanceY = Math.abs(boxCenter.y - frameCenter.y) / frameCenter.y;
    const centerScore = Math.max(0, 100 - (distanceX + distanceY) * 200);

    const areaRatio = boxArea / frameArea;
    const areaScore = (areaRatio >= this.MIN_BOX_AREA && areaRatio <= this.MAX_BOX_AREA) ? 100 : 0;

    return Math.floor((centerScore * 0.6 + areaScore * 0.4));
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
  }
}

export const mediaPipeService = new MediaPipeService();
