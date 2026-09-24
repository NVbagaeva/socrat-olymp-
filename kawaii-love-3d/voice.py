#!/usr/bin/env python3
"""
Озвучка мультика: синтез голосов Наты и Оли и сборка звуковой дорожки.

Реплики, их время и настроение берутся прямо из констант LINES и T в index.html,
поэтому после правки текста достаточно перезапустить скрипт.
Каждая реплика начинается ровно тогда, когда в облачке появляется первая буква.

Синтезатор — RHVoice с русскими голосами (Linux / WSL):
    sudo apt install rhvoice rhvoice-russian ffmpeg
Ударения в «трудных» словах размечаются знаком + перед ударной гласной (словарь STRESS),
для этого в /etc/RHVoice/RHVoice.conf нужна строка:
    languages.Russian.stress_marker=+

Примеры:
    python voice.py                               # → voice.wav
    python voice.py --video out.mp4 -o final.mp4  # и сразу наложить на видео
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SR = 48000

# Голоса: база RHVoice, высота тона (% от исходной), темп (%), «размер» голоса —
# лёгкий сдвиг формант делает голос маленьким и мультяшным.
VOICES = {
    'nata': dict(voice='arina', pitch=150, rate=100, formant=1.06),     # эмоциональная, повыше
    'olya': dict(voice='victoria', pitch=120, rate=96, formant=1.04),   # спокойная, тёплая, пониже
}
# Интонация по настроению облачка (mood в LINES)
MOODS = {
    'normal': dict(pitch=0, rate=4, volume=1.0),
    'sad': dict(pitch=-10, rate=-10, volume=.85),     # тише и медленнее
    'soft': dict(pitch=-6, rate=-14, volume=.7),      # почти шёпотом, «минуты тишины»
}
# Ударения там, где синтезатор может ошибиться
STRESS = {
    'Олечка': '+Олечка', 'косячная': 'кос+ячная', 'ценны': 'ц+енны', 'создаю': 'созда+ю',
    'луны': 'лун+ы', 'обратно': 'обр+атно', 'минуты': 'мин+уты', 'рядом': 'р+ядом',
}


def ffmpeg_bin():
    exe = shutil.which('ffmpeg')
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit('Нужен ffmpeg: sudo apt install ffmpeg  (или pip install imageio-ffmpeg)')


def read_script(html):
    """Достаёт LINES, T.end и TYPE_SPEED из index.html."""
    src = Path(html).read_text(encoding='utf-8')
    lines = []
    for m in re.finditer(r"\{\s*who:\s*'(\w+)',\s*at:\s*([\d.]+),\s*text:\s*'([^']*)'(?:,\s*mood:\s*'(\w+)')?\s*\}", src):
        lines.append(dict(who=m[1], at=float(m[2]), text=m[3], mood=m[4] or 'normal'))
    end = float(re.search(r"\bend:\s*([\d.]+)", src)[1])
    speed = float(re.search(r"TYPE_SPEED\s*=\s*([\d.]+)", src)[1])
    if not lines:
        sys.exit('Не нашёл LINES в ' + str(html))
    return lines, end, speed


def mark_stress(text):
    for word, marked in STRESS.items():
        text = re.sub(rf'(?<![\w+]){word}(?!\w)', marked, text)
    return text


def read_wav(path):
    with wave.open(str(path)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        return x.reshape(-1, w.getnchannels()).mean(axis=1)


def synth(line, tmp, ff):
    v, m = VOICES[line['who']], MOODS.get(line['mood'], MOODS['normal'])
    raw, out = tmp / f"raw_{line['i']}.wav", tmp / f"line_{line['i']}.wav"
    text = mark_stress(line['text'])
    subprocess.run(['RHVoice-test', '-p', v['voice'], '-t', str(v['pitch'] + m['pitch']), '-r', str(v['rate'] + m['rate']),
                    '-o', str(raw)], input=text.encode('utf-8'), check=True, capture_output=True)
    k = v['formant']
    chain = (f"asetrate={24000 * k:.0f},aresample={SR},atempo={1 / k:.5f},"          # маленький мультяшный голос
             "highpass=f=110,lowpass=f=11000,"
             "equalizer=f=3200:t=q:w=1.2:g=2.5,"                                     # немного «воздуха» и разборчивости
             "acompressor=threshold=-20dB:ratio=3:attack=4:release=90:makeup=2,"
             "silenceremove=start_periods=1:start_threshold=-45dB,"                  # голос стартует сразу с первой буквой
             "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
             f"volume={m['volume']:.2f},afade=t=in:d=0.012")
    subprocess.run([ff, '-y', '-loglevel', 'error', '-i', str(raw), '-af', chain, '-ac', '1', '-ar', str(SR), str(out)], check=True)
    return read_wav(out)


def main():
    ap = argparse.ArgumentParser(description='Озвучка мультика голосами RHVoice')
    ap.add_argument('--html', default=str(HERE / 'index.html'))
    ap.add_argument('-o', '--out', default=None, help='voice.wav, либо итоговый MP4 при --video')
    ap.add_argument('--video', default=None, help='готовое видео: наложить на него озвучку')
    ap.add_argument('--update-html', action='store_true', help='записать в index.html огибающую голоса для движения ротика')
    ap.add_argument('--music', default=None, help='фоновая музыка (music.wav из music.py): подмешать под голос с приглушением на репликах')
    args = ap.parse_args()
    if not shutil.which('RHVoice-test'):
        sys.exit('Не найден RHVoice: sudo apt install rhvoice rhvoice-russian')
    ff = ffmpeg_bin()
    lines, end, speed = read_script(args.html)

    track = np.zeros(int((end + .5) * SR), np.float32)
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        print(f"{'кто':5} {'старт':>6} {'голос':>6} {'печать':>7} {'облачко до':>11}  реплика")
        for i, l in enumerate(lines):
            l['i'] = i
            x = synth(l, tmp, ff)
            typed = len(l['text']) / speed
            nxt = min([o['at'] for o in lines if o['at'] > l['at']] + [end])
            dur = len(x) / SR
            limit = nxt - l['at'] - .15                      # голос не наезжает на следующую реплику
            if dur > limit:
                k = min(dur / limit, 1.2)
                subprocess.run([ff, '-y', '-loglevel', 'error', '-i', str(tmp / f'line_{i}.wav'), '-af', f'atempo={k:.4f}', str(tmp / f'fit_{i}.wav')], check=True)
                x = read_wav(tmp / f'fit_{i}.wav'); dur = len(x) / SR
            s = int(l['at'] * SR)
            track[s:s + len(x)] += x[:len(track) - s]
            print(f"{l['who']:5} {l['at']:6.2f} {dur:5.2f}с {typed:6.2f}с {l['at'] + typed + 2:10.2f}с  {l['text']}")
            l['voice'] = round(dur, 2)
            # огибающая громкости 30 раз в секунду: по ней ротик открывается на слогах
            n = int(np.ceil(dur * 30)); rms = np.array([np.sqrt(np.mean(x[int(j * SR / 30):int((j + 1) * SR / 30)] ** 2) + 1e-12) for j in range(n)])
            db = 20 * np.log10(rms / rms.max())
            env = np.clip((db + 16) / 16, 0, 1) ** 1.6            # гласные — ротик открыт, согласные и паузы — прикрыт
            l['env'] = [round(float(e), 2) for e in env]

        # общая «ночная» акустика: лёгкое эхо, громкость под телефон (-16 LUFS), стерео
        raw_mix = tmp / 'mix_raw.wav'
        with wave.open(str(raw_mix), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(track, -1, 1) * 32767).astype(np.int16).tobytes())
        voice = Path(args.out) if (args.out and not args.video) else HERE / 'voice.wav'
        subprocess.run([ff, '-y', '-loglevel', 'error', '-i', str(raw_mix), '-af',
                        'aecho=0.85:0.5:70|130:0.16|0.08,loudnorm=I=-16:TP=-1.5:LRA=11', '-ac', '2', '-ar', str(SR),
                        '-t', f'{end:.3f}', str(voice)], check=True)
    (HERE / 'voice_timing.json').write_text(json.dumps([{k: l[k] for k in ('who', 'at', 'voice', 'text')} for l in lines], ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Дорожка: {voice}')
    if args.update_html:
        html = Path(args.html); src = html.read_text(encoding='utf-8')
        block = 'const VOICE_ENV = {\n' + ''.join(f"  {l['i']}: [{','.join(f'{e:g}' for e in l['env'])}],\n" for l in lines) + '};'
        src, n = re.subn(r'/\* VOICE:BEGIN \*/.*?/\* VOICE:END \*/', lambda _: '/* VOICE:BEGIN */\n' + block + '\n/* VOICE:END */', src, flags=re.S)
        if not n:
            sys.exit('В index.html нет блока VOICE:BEGIN … VOICE:END')
        html.write_text(src, encoding='utf-8')
        print(f'Ротик синхронизирован с голосом: {html}')

    audio = voice
    if args.music:
        # музыка тише голоса и мягко приглушается, пока кто-то говорит (sidechain), затем общий уровень -16 LUFS
        audio = voice.with_name('mix.wav')
        subprocess.run([ff, '-y', '-loglevel', 'error', '-i', str(voice), '-i', args.music, '-filter_complex',
                        '[1:a]volume=0.9[m];[m][0:a]sidechaincompress=threshold=0.03:ratio=4:attack=60:release=700:makeup=1[md];'
                        '[md][0:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]',
                        '-map', '[out]', '-ar', str(SR), '-ac', '2', str(audio)], check=True)
        print(f'Голос + музыка: {audio}')
    if args.video:
        out = Path(args.out or Path(args.video).with_name(Path(args.video).stem + '_voice.mp4'))
        subprocess.run([ff, '-y', '-loglevel', 'error', '-i', args.video, '-i', str(audio), '-map', '0:v', '-map', '1:a',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(out)], check=True)
        print(f'Видео с озвучкой: {out}')


if __name__ == '__main__':
    main()
