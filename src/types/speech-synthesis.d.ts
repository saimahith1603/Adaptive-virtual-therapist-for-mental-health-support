
interface SpeechSynthesisUtterance extends EventTarget {
  text: string;
  lang: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechSynthesisErrorEvent) => void;
  onpause: (event: Event) => void;
  onresume: (event: Event) => void;
  onboundary: (event: SpeechSynthesisEvent) => void;
  onmark: (event: SpeechSynthesisEvent) => void;
}

interface SpeechSynthesisEvent extends Event {
  charIndex: number;
  elapsedTime: number;
  name: string;
  utterance: SpeechSynthesisUtterance;
}

interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  error: string;
}

interface SpeechSynthesisVoice {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
  voiceURI: string;
}

interface SpeechSynthesis {
  pending: boolean;
  speaking: boolean;
  paused: boolean;
  onvoiceschanged: () => void;
  getVoices(): SpeechSynthesisVoice[];
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
}

interface Window {
  SpeechSynthesisUtterance: {
    prototype: SpeechSynthesisUtterance;
    new(text?: string): SpeechSynthesisUtterance;
  };
  speechSynthesis: SpeechSynthesis;
}
