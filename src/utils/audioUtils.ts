/**
 * Real-time Audio processing, VAD, PCM encoding/decoding, and gapless playback for Gemini Live API
 */

export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  // VAD & Silence detection state
  private isUserSpeaking: boolean = false;
  private silenceTimer: any = null;
  private speechStartTimestamp: number = 0;
  private silenceThresholdMs: number = 1000; // 1 second silence = speech end
  private energyThreshold: number = 0.02; // RMS threshold

  private onAudioDataCallback: ((base64Pcm: string) => void) | null = null;
  private onSpeakingStateChange: ((isSpeaking: boolean) => void) | null = null;
  private onSpeechEndCallback: (() => void) | null = null;
  private onVolumeChangeCallback: ((volume: number) => void) | null = null;

  public async start(
    onAudioData: (base64Pcm: string) => void,
    onSpeakingState?: (isSpeaking: boolean) => void,
    onSpeechEnd?: () => void,
    onVolume?: (volume: number) => void
  ): Promise<void> {
    this.onAudioDataCallback = onAudioData;
    this.onSpeakingStateChange = onSpeakingState || null;
    this.onSpeechEndCallback = onSpeechEnd || null;
    this.onVolumeChangeCallback = onVolume || null;

    // Standard 16kHz for Gemini Live
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass({ sampleRate: 16000 });

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    this.source.connect(this.analyser);

    // Buffer size 4096 = ~256ms chunk at 16kHz
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      const inputBuffer = e.inputBuffer.getChannelData(0);

      // 1. Calculate RMS energy for VAD
      let sum = 0;
      for (let i = 0; i < inputBuffer.length; i++) {
        sum += inputBuffer[i] * inputBuffer[i];
      }
      const rms = Math.sqrt(sum / inputBuffer.length);
      const volumeLevel = Math.min(1, rms * 5); // Normalized 0..1
      if (this.onVolumeChangeCallback) {
        this.onVolumeChangeCallback(volumeLevel);
      }

      // 2. Voice Activity Detection logic
      if (rms > this.energyThreshold) {
        if (!this.isUserSpeaking) {
          this.isUserSpeaking = true;
          this.speechStartTimestamp = Date.now();
          if (this.onSpeakingStateChange) {
            this.onSpeakingStateChange(true);
          }
        }
        // Reset silence timer whenever energy is above threshold
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      } else if (this.isUserSpeaking) {
        // Customer was speaking and is now silent
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.isUserSpeaking = false;
            this.silenceTimer = null;
            if (this.onSpeakingStateChange) {
              this.onSpeakingStateChange(false);
            }
            if (this.onSpeechEndCallback) {
              this.onSpeechEndCallback();
            }
          }, this.silenceThresholdMs);
        }
      }

      // 3. Convert Float32 [-1.0, 1.0] to 16-bit signed PCM LE
      const pcm16 = new Int16Array(inputBuffer.length);
      for (let i = 0; i < inputBuffer.length; i++) {
        const s = Math.max(-1, Math.min(1, inputBuffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // 4. Base64 encode
      const base64 = int16ToBase64(pcm16);
      if (this.onAudioDataCallback) {
        this.onAudioDataCallback(base64);
      }
    };
  }

  public setMute(muted: boolean): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public stop(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.isUserSpeaking = false;
  }
}

export class GaplessAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying: boolean = false;
  private onSpeakingChange: ((isSpeaking: boolean) => void) | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 1.0;

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange || null;
  }

  private initCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // Gemini Live model output audio is 24kHz
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  public playChunk(base64Pcm: string): void {
    const ctx = this.initCtx();
    const pcmData = base64ToInt16(base64Pcm);
    if (!pcmData || pcmData.length === 0) return;

    // Convert Int16 to Float32
    const float32 = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7fff);
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    if (this.gainNode) {
      source.connect(this.gainNode);
    } else {
      source.connect(ctx.destination);
    }

    const currentTime = ctx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.03; // small jitter buffer
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.activeSources.push(source);

    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onSpeakingChange) this.onSpeakingChange(true);
    }

    source.onended = () => {
      const index = this.activeSources.indexOf(source);
      if (index > -1) {
        this.activeSources.splice(index, 1);
      }
      if (this.activeSources.length === 0 && ctx.currentTime >= this.nextStartTime) {
        this.isPlaying = false;
        if (this.onSpeakingChange) this.onSpeakingChange(false);
      }
    };
  }

  /**
   * Stop immediately when customer interrupts or call ends
   */
  public stopAndClearQueue(): void {
    this.activeSources.forEach(src => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.isPlaying = false;
    if (this.onSpeakingChange) {
      this.onSpeakingChange(false);
    }
  }

  public close(): void {
    this.stopAndClearQueue();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

// Helpers
function int16ToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
}
