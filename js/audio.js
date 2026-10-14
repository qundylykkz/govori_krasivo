/**
 * Модуль звуковых эффектов на базе Web Audio API
 * Не требует загрузки внешних mp3-файлов, работает мгновенно и офлайн.
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('govori_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('govori_sound_muted', this.isMuted);
    return this.isMuted;
  }

  playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

      gainNode.gain.setValueAtTime(gainLevel, this.ctx.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration);
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  playCorrect() {
    if (this.isMuted) return;
    // Приятное мажорное трезвучие (До - Ми - Соль - До)
    this.playTone(523.25, 'sine', 0.15, 0.0, 0.2);     // C5
    this.playTone(659.25, 'sine', 0.18, 0.08, 0.2);    // E5
    this.playTone(783.99, 'sine', 0.25, 0.16, 0.25);   // G5
    this.playTone(1046.50, 'triangle', 0.4, 0.24, 0.3); // C6
  }

  playWrong() {
    if (this.isMuted) return;
    // Мягкий нерезкий низкий звук
    this.playTone(240, 'triangle', 0.15, 0.0, 0.2);
    this.playTone(200, 'sine', 0.25, 0.1, 0.25);
  }

  playStreak() {
    if (this.isMuted) return;
    // Быстрый перелив радости при комбо
    const notes = [587.33, 659.25, 783.99, 880.00, 1046.50];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.18, idx * 0.06, 0.18);
    });
  }

  playFanfare() {
    if (this.isMuted) return;
    // Победная фанфара для сертификата и ачивок
    const fanfareNotes = [
      { f: 523.25, t: 0.0, d: 0.12 },
      { f: 523.25, t: 0.12, d: 0.12 },
      { f: 523.25, t: 0.24, d: 0.12 },
      { f: 659.25, t: 0.36, d: 0.3 },
      { f: 587.33, t: 0.68, d: 0.12 },
      { f: 659.25, t: 0.80, d: 0.12 },
      { f: 783.99, t: 0.92, d: 0.5 }
    ];
    fanfareNotes.forEach(item => {
      this.playTone(item.f, 'triangle', item.d, item.t, 0.25);
    });
  }

  playClick() {
    if (this.isMuted) return;
    this.playTone(600, 'sine', 0.04, 0, 0.05);
  }
}

window.soundEffects = new SoundEffects();
