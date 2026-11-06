/**
 * Alarm tones — synthesized with WebAudio (no audio files to ship/host).
 *
 * System notifications use the OS default sound (browsers don't allow custom
 * sounds there), but the in-app popup can ring with a picked tone. That is
 * what Settings previews and what fires when an alarm pops in the app.
 */

export type AlarmToneId = "chime" | "piano" | "marimba" | "bell" | "wave";

export interface AlarmToneDef {
  id: AlarmToneId;
  name: string;
  emoji: string;
  blurb: string;
  gradient: string;
}

export const ALARM_TONES: AlarmToneDef[] = [
  { id: "chime", name: "Chime", emoji: "🔔", blurb: "Soft sine bells — calm and friendly.", gradient: "from-sky-500 to-blue-600" },
  { id: "piano", name: "Piano", emoji: "🎹", blurb: "Gentle piano arpeggio.", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "marimba", name: "Marimba", emoji: "🪘", blurb: "Warm wooden pops.", gradient: "from-amber-500 to-orange-600" },
  { id: "bell", name: "Bell", emoji: "🎐", blurb: "Classic temple bell.", gradient: "from-emerald-500 to-teal-600" },
  { id: "wave", name: "Wave", emoji: "🌊", blurb: "Smooth rising sweep.", gradient: "from-pink-500 to-rose-600" },
];

export const ALARM_TONE_KEY = "alarmTone";

export function getStoredAlarmTone(): AlarmToneId {
  try {
    const v = localStorage.getItem(ALARM_TONE_KEY);
    if (v === "chime" || v === "piano" || v === "marimba" || v === "bell" || v === "wave") return v;
  } catch {
    /* ignore */
  }
  return "chime";
}

export function setStoredAlarmTone(id: AlarmToneId) {
  try {
    localStorage.setItem(ALARM_TONE_KEY, id);
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  time: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

/** Play a one-shot preview of the tone (~2s). Safe to call without a gesture — it no-ops if blocked. */
export function playAlarmTone(id: AlarmToneId = getStoredAlarmTone(), volume = 0.5) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.05;
  const v = Math.max(0.05, Math.min(1, volume));
  try {
    switch (id) {
      case "chime": {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, t + i * 0.22, f, 1.1, "sine", v * 0.5));
        break;
      }
      case "piano": {
        [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(ac, t + i * 0.16, f, 0.9, "triangle", v * 0.6));
        break;
      }
      case "marimba": {
        [349.23, 440, 523.25, 698.46].forEach((f, i) => tone(ac, t + i * 0.14, f, 0.5, "sine", v * 0.8));
        break;
      }
      case "bell": {
        tone(ac, t, 209.3, 2.2, "sine", v * 0.6);
        tone(ac, t, 418.6, 1.6, "sine", v * 0.3);
        tone(ac, t, 627.4, 1.2, "sine", v * 0.18);
        break;
      }
      case "wave": {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(392, t);
        osc.frequency.exponentialRampToValueAtTime(783.99, t + 1.2);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(v * 0.4, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + 1.5);
        break;
      }
      default: {
        tone(ac, t, 880, 0.6, "sine", v * 0.5);
      }
    }
  } catch {
    /* audio blocked — OS notification still shows */
  }
}
