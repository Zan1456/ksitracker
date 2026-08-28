"use client";

// Lightweight Web Audio beeps for the workout timers — synthesized on the fly,
// no audio assets to ship. A single AudioContext is reused across mounts
// (TaskRunner remounts on every task change via `key={task.id}`).
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, startOffset: number, durationSec: number, gain: number) {
  const context = getContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  const startAt = context.currentTime + startOffset;
  gainNode.gain.setValueAtTime(0, startAt);
  gainNode.gain.linearRampToValueAtTime(gain, startAt + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, startAt + durationSec);
  oscillator.connect(gainNode).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec + 0.02);
}

/** Short high beep — played once per second for the last 3 seconds of a countdown. */
export function playCountdownBeep() {
  tone(880, 0, 0.12, 0.2);
}

/** Rising two-tone chime — played whenever a round/rest/task switches over. */
export function playTransitionChime() {
  tone(587, 0, 0.1, 0.18);
  tone(880, 0.1, 0.16, 0.18);
}
