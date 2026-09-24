#!/usr/bin/env python3
"""
Фоновая музыка: Ф. Шопен, Прелюдия ля мажор, соч. 28 № 7 (Andantino).

Ноты берутся из открытой Humdrum-кодировки Крейга Сэппа (github.com/craigsapp/chopin-preludes),
исполнение собирается программно: живая агогика (растяжки в концах фраз, ritardando в финале),
выделенная мелодия, педаль по тактам. Темп подгоняется так, чтобы пьеса заняла весь мультик
и последний аккорд прозвучал на финальной надписи. Звук — рояль из саундфонта MuseScore General.

Зависимости (Linux / WSL):
    sudo apt install fluidsynth musescore-general-soundfont ffmpeg
    pip install music21 mido numpy

    python music.py            # → music.wav
"""
import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

import mido
import numpy as np
from music21 import converter, chord, note

HERE = Path(__file__).resolve().parent
KERN_URL = 'https://raw.githubusercontent.com/craigsapp/chopin-preludes/master/kern/prelude28-07.krn'
SOUNDFONTS = ['/usr/share/sounds/sf3/MuseScore_General_Full.sf3', '/usr/share/sounds/sf3/MuseScore_General.sf3', '/usr/share/sounds/sf2/FluidR3_GM.sf2']
START = 0.7          # музыка вступает на затемнении в начале, с
LAST_BAR_AT = 40.4   # финальный аккорд — вместе с финальной надписью, с


def film_end(html):
    return float(re.search(r"\bend:\s*([\d.]+)", Path(html).read_text(encoding='utf-8'))[1])


def load_notes():
    """(старт в четвертях, длительность, midi, роль) для каждого звука."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / 'prelude.krn'
        urllib.request.urlretrieve(KERN_URL, path)
        score = converter.parse(str(path))
    out = []
    for pi, part in enumerate(score.parts):
        treble = any(n.pitches and max(p.midi for p in n.pitches) > 64 for n in part.flatten().notes)
        for n in part.flatten().notes:
            pitches = sorted(p.midi for p in n.pitches)
            for j, m in enumerate(pitches):
                role = 'melody' if treble and j == len(pitches) - 1 else ('inner' if treble else ('bass' if j == 0 else 'inner'))
                out.append(dict(q=float(n.offset), dur=float(n.quarterLength), midi=m, role=role, size=len(pitches), k=j))
    return out


def beat_factor(beat):
    """Агогика: доля 0 — затакт, далее такты по 3 доли."""
    bar, pos = (0, 0) if beat < 1 else ((beat - 1) // 3 + 1, (beat - 1) % 3)
    f = 1.0
    if bar % 2 == 0 and pos == 2:
        f *= 1.14                                  # дыхание в конце каждой двутактовой фразы
    if bar in (11, 12):
        f *= 1.08                                  # кульминация — чуть шире
    if bar >= 15:
        f *= 1.12 + .14 * ((bar - 15) * 3 + pos)   # ritardando в последних тактах
    return f


def make_time_map(total_beats, film):
    beats = np.arange(int(np.ceil(total_beats)) + 1)
    f = np.array([beat_factor(b) for b in beats[:-1]])
    last_bar_q = 1 + 15 * 3
    base = (LAST_BAR_AT - START) / f[:last_bar_q].sum()
    edges = START + np.concatenate([[0], np.cumsum(f * base)])
    return lambda q: float(np.interp(q, beats, edges)), 60 / base


def main():
    ap = argparse.ArgumentParser(description='Шопен, Прелюдия соч. 28 № 7 → music.wav')
    ap.add_argument('--html', default=str(HERE / 'index.html'))
    ap.add_argument('-o', '--out', default=str(HERE / 'music.wav'))
    args = ap.parse_args()
    film = film_end(args.html)
    sf = next((s for s in SOUNDFONTS if Path(s).exists()), None)
    if not sf or not shutil.which('fluidsynth'):
        sys.exit('Нужны fluidsynth и саундфонт: sudo apt install fluidsynth musescore-general-soundfont')
    ff = shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()

    notes = load_notes()
    total = max(n['q'] + n['dur'] for n in notes)
    tmap, bpm = make_time_map(total, film)
    rng = np.random.default_rng(7)                       # «человеческие» микроотклонения, но всегда одинаковые

    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=500000))   # 1 тик = 1/960 с
    tr.append(mido.Message('program_change', program=0, time=0))
    ev = []
    to_tick = lambda s: int(round(s * 960))
    for n in notes:
        bar = 0 if n['q'] < 1 else int((n['q'] - 1) // 3 + 1)
        shape = 1 + .18 * np.sin(np.pi * np.clip((bar - 1) / 13, 0, 1))       # мягкая волна к кульминации
        vel = {'melody': 58, 'inner': 34, 'bass': 44}[n['role']] * shape + rng.normal(0, 2)
        if bar >= 15: vel *= .85                                              # диминуэндо в конце
        t0 = tmap(n['q']) + rng.normal(0, .006)
        if n['size'] > 3: t0 += .028 * n['k']                                 # большие аккорды — мягким арпеджио
        if n['role'] == 'melody': t0 -= .012                                  # мелодия чуть раньше аккомпанемента
        t1 = tmap(n['q'] + n['dur']) - .02
        if bar == 16: t1 = film + .5
        ev.append((to_tick(max(t0, 0)), 1, mido.Message('note_on', note=n['midi'], velocity=int(np.clip(vel, 18, 96)))))
        ev.append((to_tick(t1), 0, mido.Message('note_off', note=n['midi'], velocity=0)))
    for bar in range(1, 17):                                                  # педаль: взять после сильной доли, снять перед следующим тактом
        q0 = 1 + (bar - 1) * 3
        ev.append((to_tick(tmap(q0) + .04), 2, mido.Message('control_change', control=64, value=100)))
        if bar < 16:
            ev.append((to_tick(tmap(q0 + 3) - .015), -1, mido.Message('control_change', control=64, value=0)))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tick, _, msg in ev:
        tr.append(msg.copy(time=tick - last)); last = tick

    with tempfile.TemporaryDirectory() as td:
        td = Path(td); midp, raw = td / 'prelude.mid', td / 'raw.wav'
        mid.save(midp)
        subprocess.run(['fluidsynth', '-ni', '-q', '-F', str(raw), '-r', '48000', '-g', '0.7',
                        '-o', 'synth.reverb.active=1', '-o', 'synth.reverb.room-size=0.82', '-o', 'synth.reverb.damp=0.45',
                        '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.6', '-o', 'synth.chorus.active=0',
                        sf, str(midp)], check=True)
        # мягче и теплее: срез верхов, лёгкий подъём низа; вступление и затухание вместе с картинкой
        subprocess.run([ff, '-y', '-loglevel', 'error', '-i', str(raw), '-af',
                        f'highpass=f=35,lowpass=f=7500,equalizer=f=220:t=q:w=1:g=1.5,'
                        f'afade=t=in:st=0:d=1.2,afade=t=out:st={film - 2.2:.2f}:d=2.2,loudnorm=I=-22:TP=-2:LRA=14',
                        '-ar', '48000', '-ac', '2', '-t', f'{film:.3f}', args.out], check=True)
    print(f'Шопен, Прелюдия соч. 28 № 7: ~{bpm:.0f} уд/мин, финальный аккорд на {LAST_BAR_AT} с → {args.out}')


if __name__ == '__main__':
    main()
