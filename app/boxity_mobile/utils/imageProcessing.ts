import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  hash: string;
  size: number;
}

class ImageProcessingUtil {
  async compressImage(imageUri: string, quality = 0.8): Promise<ProcessedImage> {
    console.log('ImageProcessing: Compressing image:', imageUri);

    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1920 } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const fileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      const hash = await this.generateHash(manipulatedImage.uri);

      console.log('ImageProcessing: Compression complete', {
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        size,
        hash,
      });

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        hash,
        size,
      };
    } catch (error) {
      console.error('ImageProcessing: Compression failed:', error);
      throw error;
    }
  }

  async generateHash(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64
      );

      console.log('ImageProcessing: Hash generated:', hash.substring(0, 16) + '...');
      return hash;
    } catch (error) {
      console.error('ImageProcessing: Hash generation failed:', error);
      return 'hash_error_' + Date.now();
    }
  }

  async validateImageQuality(imageUri: string): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        return { isValid: false, reason: 'File does not exist' };
      }

      if ('size' in fileInfo && fileInfo.size < 10000) {
        return { isValid: false, reason: 'Image file too small' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('ImageProcessing: Validation failed:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }
}

export const imageProcessing = new ImageProcessingUtil();
