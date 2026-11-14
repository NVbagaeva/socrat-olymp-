/**
 * Мурчание — синтез через WebAudio, без звуковых файлов: тихий низкий
 * шум, пульсирующий с частотой ~27 Гц (вибрация мурчания), с плавным
 * «вдохом-выдохом» раз в ~2,6 с. Включается только по нажатию.
 */

export interface Myrr {
  stop: () => void;
}

export function myrr(): Myrr | null {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const dlina = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, dlina, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < dlina; i += 1) {
    /* Коричневый шум: мягкий, без шипения. */
    b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = b * 3.5;
  }
  const shum = ctx.createBufferSource();
  shum.buffer = buf;
  shum.loop = true;
  const filtr = ctx.createBiquadFilter();
  filtr.type = 'lowpass';
  filtr.frequency.value = 180;
  /* Пульс мурчания: амплитуда качается с частотой 27 Гц. */
  const puls = ctx.createGain();
  puls.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 27;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.5;
  lfo.connect(lfoGain).connect(puls.gain);
  /* Дыхание: медленная волна громкости. */
  const dyh = ctx.createGain();
  dyh.gain.value = 0.6;
  const dyhLfo = ctx.createOscillator();
  dyhLfo.frequency.value = 1 / 2.6;
  const dyhGain = ctx.createGain();
  dyhGain.gain.value = 0.4;
  dyhLfo.connect(dyhGain).connect(dyh.gain);
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.2);
  shum.connect(filtr).connect(puls).connect(dyh).connect(master).connect(ctx.destination);
  shum.start();
  lfo.start();
  dyhLfo.start();
  return {
    stop() {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.6);
      window.setTimeout(() => void ctx.close(), 700);
    },
  };
}
