import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import type { BatchInfo, CapturedImage, UploadRecord } from '@/types';

const UPLOADS_KEY = '@boxity_uploads';
const THEME_KEY = '@boxity_theme';

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentBatch, setCurrentBatch] = useState<BatchInfo | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [uploadsData, themeData] = await Promise.all([
        AsyncStorage.getItem(UPLOADS_KEY),
        AsyncStorage.getItem(THEME_KEY),
      ]);

      if (uploadsData) {
        setUploads(JSON.parse(uploadsData));
      }
      if (themeData) {
        setIsDarkMode(JSON.parse(themeData));
      }
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  };

  const setBatch = (batch: BatchInfo | null) => {
    console.log('Setting batch:', batch);
    setCurrentBatch(batch);
  };

  const addCapturedImage = (image: CapturedImage) => {
    console.log('Adding captured image:', image.viewType);
    setCapturedImages((prev) => [...prev, image]);
  };

  const clearCapturedImages = () => {
    console.log('Clearing captured images');
    setCapturedImages([]);
  };

  const removeCapturedImage = (viewType: 'first_view' | 'second_view') => {
    console.log('Removing captured image:', viewType);
    setCapturedImages((prev) => prev.filter((img) => img.viewType !== viewType));
  };

  const addUpload = async (upload: UploadRecord) => {
    console.log('Adding upload record:', upload.id);
    const newUploads = [...uploads, upload];
    setUploads(newUploads);
    await AsyncStorage.setItem(UPLOADS_KEY, JSON.stringify(newUploads));
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
  };

  return {
    currentBatch,
    capturedImages,
    uploads,
    isDarkMode,
    setBatch,
    addCapturedImage,
    clearCapturedImages,
    removeCapturedImage,
    addUpload,
    toggleTheme,
  };
});
