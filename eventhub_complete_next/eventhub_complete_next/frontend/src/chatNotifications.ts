const CHAT_SOUND_KEY = "eh_chat_sound_enabled";

export function isChatSoundEnabled() {
  return localStorage.getItem(CHAT_SOUND_KEY) === "true";
}

export function setChatSoundEnabled(enabled: boolean) {
  localStorage.setItem(CHAT_SOUND_KEY, String(enabled));
}

export function playChatNotification() {
  if (!isChatSoundEnabled() || typeof window.AudioContext === "undefined") return;
  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.13);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => void context.close();
  void context.resume().then(() => {
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  }).catch(() => void context.close());
}
