import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Upload as UploadIcon, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { ipfsService } from '@/services/ipfs';
import { apiService } from '@/services/api';
import { imageProcessing } from '@/utils/imageProcessing';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-constants';

export default function UploadScreen() {
  const { currentBatch, capturedImages, clearCapturedImages, addUpload } = useApp();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  const handleUpload = async () => {
    if (!currentBatch || !user || capturedImages.length === 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    try {
      const totalSteps = capturedImages.length * 3;
      let completedSteps = 0;

      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        console.log(`Processing image ${i + 1}/${capturedImages.length}`);

        setCurrentStep(`Compressing image ${i + 1}...`);
        const processedImage = await imageProcessing.compressImage(image.uri, 0.85);
        completedSteps++;
        setUploadProgress((completedSteps / totalSteps) * 100);

        setCurrentStep(`Uploading to IPFS ${i + 1}...`);
        const ipfsUrl = await ipfsService.uploadImage(processedImage.uri);
        completedSteps++;
        setUploadProgress((completedSteps / totalSteps) * 100);

        setCurrentStep(`Saving metadata ${i + 1}...`);
        const metadata = {
          batchId: currentBatch.batchId,
          viewType: image.viewType,
          ipfsUrl,
          imageHash: processedImage.hash,
          timestamp: image.timestamp,
          actorRole: user.role,
          deviceId: Device.default.deviceId || 'unknown',
          imageSize: processedImage.size,
          imageWidth: processedImage.width,
          imageHeight: processedImage.height,
        };

        await apiService.uploadMetadata(metadata);
        
        await addUpload({
          id: `upload_${Date.now()}_${i}`,
          batchId: metadata.batchId,
          viewType: metadata.viewType,
          ipfsUrl: metadata.ipfsUrl,
          timestamp: metadata.timestamp,
          actorRole: metadata.actorRole,
          deviceId: metadata.deviceId,
          status: 'uploaded',
          productName: currentBatch.productName,
        });

        completedSteps++;
        setUploadProgress((completedSteps / totalSteps) * 100);
      }

      setUploadComplete(true);
      setCurrentStep('Upload complete!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await new Promise(resolve => setTimeout(resolve, 2500));
      clearCapturedImages();
      router.push('/(tabs)/history');
    } catch (error) {
      console.error('Upload failed:', error);
      setCurrentStep('Upload failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentBatch || capturedImages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AlertCircle size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>No Images to Upload</Text>
          <Text style={styles.errorText}>
            Please capture images first
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/capture')}
          >
            <Text style={styles.buttonText}>Go to Capture</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review & Upload</Text>
          <Text style={styles.headerSubtitle}>
            Batch: {currentBatch.batchId}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captured Images</Text>
          <View style={styles.imagesGrid}>
            {capturedImages.map((image, index) => (
              <View key={index} style={styles.imageCard}>
                <Image source={{ uri: image.uri }} style={styles.image} contentFit="cover" />
                <View style={styles.imageLabel}>
                  <Text style={styles.imageLabelText}>
                    {image.viewType === 'first_view' ? 'First View' : 'Second View'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Batch ID</Text>
              <Text style={styles.metadataValue}>{currentBatch.batchId}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Product</Text>
              <Text style={styles.metadataValue}>{currentBatch.productName}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Actor Role</Text>
              <Text style={styles.metadataValue}>{user?.role}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Images</Text>
              <Text style={styles.metadataValue}>{capturedImages.length}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Timestamp</Text>
              <Text style={styles.metadataValue}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {!uploadComplete && (
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <>
                <UploadIcon size={20} color={theme.colors.background} />
                <Text style={styles.uploadButtonText}>Upload to IPFS</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressStep}>{currentStep}</Text>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${uploadProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(uploadProgress)}%
            </Text>
          </View>
        )}

        {uploadComplete && (
          <View style={styles.successCard}>
            <CheckCircle size={48} color={theme.colors.success} />
            <Text style={styles.successTitle}>Upload Complete!</Text>
            <Text style={styles.successText}>
              Images uploaded to IPFS and metadata synced
            </Text>
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>
                Blockchain Sync Pending
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  imagesGrid: {
    gap: theme.spacing.md,
  },
  imageCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageLabel: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
  },
  imageLabelText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
    textAlign: 'center',
  },
  metadataCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  metadataValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold' as const,
    color: theme.colors.background,
  },
  progressContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressStep: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as const,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.success,
    marginTop: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.success,
  },
  successText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  syncBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  syncBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600' as const,
    color: theme.colors.background,
  },
  errorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.background,
  },
});
