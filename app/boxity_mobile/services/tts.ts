import { Audio } from 'expo-av';

type VoiceFeedback = 'move_closer' | 'move_farther' | 'align_box' | 'hold_steady' | 'rotate_box' | 'ready';

const FEEDBACK_MESSAGES: Record<VoiceFeedback, string> = {
  move_closer: 'Move closer to the box',
  move_farther: 'Move farther from the box',
  align_box: 'Align the box within the frame',
  hold_steady: 'Hold steady',
  rotate_box: 'Rotate the box',
  ready: 'Ready to capture',
};

class TTSService {
  private sound: Audio.Sound | null = null;
  private lastFeedbackTime = 0;
  private readonly COOLDOWN_MS = 2500;
  private audioCache: Map<VoiceFeedback, string> = new Map();
  private isEnabled = true;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      console.log('TTS: Audio mode configured');
    } catch (error) {
      console.error('TTS: Failed to configure audio mode:', error);
    }
  }

  async playFeedback(feedback: VoiceFeedback) {
    if (!this.isEnabled) return;

    const now = Date.now();
    if (now - this.lastFeedbackTime < this.COOLDOWN_MS) {
      console.log('TTS: Cooldown active, skipping feedback');
      return;
    }

    this.lastFeedbackTime = now;

    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const message = FEEDBACK_MESSAGES[feedback];
      console.log('TTS: Playing feedback:', message);

      const audioUri = await this.getOrGenerateAudio(feedback, message);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('TTS: Playback failed:', error);
    }
  }

  private async getOrGenerateAudio(feedback: VoiceFeedback, message: string): Promise<string> {
    if (this.audioCache.has(feedback)) {
      console.log('TTS: Using cached audio');
      return this.audioCache.get(feedback)!;
    }

    const mockAudioUri = `data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v////////////////////////////////////////////////////////////AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4Rjp8XIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBkGQ/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=`;
    
    this.audioCache.set(feedback, mockAudioUri);
    
    return mockAudioUri;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log('TTS: Voice guidance', enabled ? 'enabled' : 'disabled');
  }

  async cleanup() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }
}

export const ttsService = new TTSService();
