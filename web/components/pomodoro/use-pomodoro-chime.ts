"use client";

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

  if (!AudioContextClass) return null;

  context ??= new AudioContextClass();
  return context;
}

export function unlockPomodoroChime() {
  const audioContext = getAudioContext();
  if (audioContext?.state === "suspended") void audioContext.resume();
}

export function playPomodoroChime() {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  if (audioContext.state === "suspended") void audioContext.resume();

  const start = audioContext.currentTime;

  [740, 988].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const offset = index * 0.18;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.16);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + 0.18);
  });
}
