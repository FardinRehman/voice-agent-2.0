import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  volume: number; // 0..1
  agentSpeaking: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  isSpeaking,
  volume,
  agentSpeaking,
}) => {
  // Generate 24 animated frequency bars
  const bars = Array.from({ length: 24 });

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-md mx-auto px-4">
      {bars.map((_, i) => {
        // Calculate dynamic height based on volume and state
        let height = 6;
        if (agentSpeaking) {
          // Agent is speaking - energetic symmetrical wave
          const offset = Math.sin((i / bars.length) * Math.PI) * 100;
          height = Math.max(10, Math.min(60, offset * (0.5 + Math.sin(Date.now() / 200 + i) * 0.4)));
        } else if (isSpeaking) {
          // Customer is speaking - responsive to real-time RMS volume
          const centerDist = 1 - Math.abs(i - bars.length / 2) / (bars.length / 2);
          height = Math.max(8, Math.min(60, (volume * 80 + 10) * centerDist * (0.8 + Math.random() * 0.4)));
        } else if (isActive) {
          // Idle listening pulse
          height = 8 + Math.sin(Date.now() / 300 + i * 0.5) * 4;
        }

        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              agentSpeaking
                ? 'bg-gradient-to-t from-teal-500 to-emerald-300'
                : isSpeaking
                ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                : isActive
                ? 'bg-slate-300 dark:bg-slate-700'
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
};
