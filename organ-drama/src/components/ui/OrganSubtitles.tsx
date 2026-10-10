import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {getActiveLine, speakerLabel} from '../../data/scriptData';
import {FONTS, PALETTE, TONES} from '../../theme';
import type {DialogueLine, SpeakerId, WordTiming} from '../../types/dialogue';
import {getLineTrack} from '../../utils/lipSync';

/** Tag colours per speaker: `[BRAIN]` in brain pink, `[STOMACH]` in ochre, and so on. */
export const SPEAKER_STYLES: Record<SpeakerId, {color: string; text: string}> = {
  NARRATOR: {color: TONES.sky, text: PALETTE.ink},
  BRAIN: {color: PALETTE.brainPink, text: PALETTE.ink},
  STOMACH: {color: PALETTE.stomachOchre, text: PALETTE.ink},
  LETTER: {color: PALETTE.white, text: TONES.waxRed},
  HEART: {color: PALETTE.heartRed, text: PALETTE.white},
  PIZZA: {color: '#FB923C', text: PALETTE.ink},
};

const MAX_WORDS = 6;
const MAX_CHARS = 32;
const BOTTOM = 70;

const normalise = (w: string): string => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');
const endsSentence = (w: string) => /([.!?]+|\.\.\.|…)$/.test(w);

/** Splits a line's words into caption pages that each fit on one row. */
export const paginate = (words: readonly WordTiming[]): number[][] => {
  const pages: number[][] = [];
  let page: number[] = [];
  let chars = 0;
  words.forEach((w, i) => {
    const len = w.text.length + (page.length > 0 ? 1 : 0);
    if (page.length > 0 && (page.length >= MAX_WORDS || chars + len > MAX_CHARS)) {
      pages.push(page);
      page = [];
      chars = 0;
    }
    page.push(i);
    chars += len;
    if (endsSentence(w.text) && i < words.length - 1 && page.length >= 2) {
      pages.push(page);
      page = [];
      chars = 0;
    }
  });
  if (page.length > 0) {
    pages.push(page);
  }
  return pages;
};

const SpeakerTag: React.FC<{speakers: readonly SpeakerId[]; local: number}> = ({speakers, local}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: local, fps, config: {damping: 11, stiffness: 220}});
  const style = SPEAKER_STYLES[speakers[0]];
  const second = speakers[1] ? SPEAKER_STYLES[speakers[1]] : null;
  return (
    <div
      style={{
        transform: `scale(${s}) rotate(${-3 + (1 - s) * -12}deg)`,
        marginBottom: 12,
        padding: '4px 22px 0',
        borderRadius: 999,
        background: second ? `linear-gradient(90deg, ${style.color} 50%, ${second.color} 50%)` : style.color,
        border: `5px solid ${PALETTE.ink}`,
        boxShadow: `0 0 0 6px ${PALETTE.white}, 7px 8px 0 6px ${PALETTE.ink}`,
        fontFamily: FONTS.display,
        fontSize: 40,
        letterSpacing: 3,
        lineHeight: 1.15,
        color: style.text,
        whiteSpace: 'nowrap',
      }}
    >
      [{speakerLabel(speakers)}]
    </div>
  );
};

const Caption: React.FC<{line: DialogueLine; local: number}> = ({line, local}) => {
  const {fps} = useVideoConfig();
  const track = getLineTrack(line);
  // Words come from the clip's analysed timing (or the babble plan); never later than the window.
  const words = track.words;
  const pages = paginate(words);
  let current = -1;
  words.forEach((w, i) => {
    if (local + 2 >= w.startFrame) {
      current = i;
    }
  });
  const pageIndex = Math.max(0, pages.findIndex((p) => p.includes(Math.max(0, current))));
  const page = pages[pageIndex];
  const accent = SPEAKER_STYLES[line.speakers[0]].color;
  const emphasis = new Set((line.emphasis ?? []).map(normalise));
  const shout = line.delivery === 'shout';

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end', columnGap: 20, flexWrap: 'wrap', padding: '0 90px'}}>
      {page.map((wi, slot) => {
        const w = words[wi];
        const pageStart = words[page[0]].startFrame;
        const appear = spring({
          frame: local - pageStart + 3 - slot * 1.5,
          fps,
          config: line.delivery === 'drowsy' || line.delivery === 'whisper' ? {damping: 18, stiffness: 150} : {damping: 11, stiffness: 230},
        });
        const isActive = wi === current && local < w.endFrame + 5;
        const isEmphasis = emphasis.has(normalise(w.text));
        const jitter = shout && isActive ? Math.sin(local * 2.3 + wi) * 2.5 : 0;
        const scale = (0.55 + 0.45 * appear) * (isActive ? 1.08 : 1);
        return (
          <div
            key={`${line.id}-${wi}`}
            style={{
              transform: `translateY(${(1 - appear) * 26}px) scale(${scale}) rotate(${isActive ? -2.5 : 0}deg) translateX(${jitter}px)`,
              transformOrigin: '50% 80%',
              opacity: Math.min(1, appear * 1.4),
              fontFamily: FONTS.body,
              fontWeight: 900,
              fontSize: 64,
              lineHeight: 1.1,
              padding: '4px 14px 0',
              borderRadius: 14,
              background: isActive ? accent : 'transparent',
              border: isActive ? `5px solid ${PALETTE.ink}` : '5px solid transparent',
              boxShadow: isActive ? `0 0 0 5px ${PALETTE.white}, 7px 8px 0 5px ${PALETTE.ink}` : 'none',
              color: isActive ? SPEAKER_STYLES[line.speakers[0]].text : isEmphasis ? TONES.gold : PALETTE.white,
              WebkitTextStroke: isActive ? '0px transparent' : `11px ${PALETTE.ink}`,
              paintOrder: 'stroke fill',
              textShadow: isActive ? 'none' : `4px 5px 0 ${PALETTE.ink}`,
              whiteSpace: 'nowrap',
            }}
          >
            {w.text.toUpperCase()}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Bold kinetic subtitles centred at the bottom: a coloured speaker tag
 * (`[BRAIN]`, `[STOMACH]`, `[NARRATOR]`…) over word-by-word captions that pop
 * in with the voice and highlight the word being spoken. Mounted at the top
 * of the composition, so `useCurrentFrame()` is the absolute frame.
 */
export const OrganSubtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const line = getActiveLine(frame);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: 'linear-gradient(to top, rgba(30,27,75,0.7), rgba(30,27,75,0))',
          pointerEvents: 'none',
          zIndex: 70,
        }}
      />
      {line ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: BOTTOM, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 71, pointerEvents: 'none'}}>
          <SpeakerTag speakers={line.speakers} local={frame - line.startFrame} />
          <Caption line={line} local={frame - line.startFrame} />
        </div>
      ) : null}
    </>
  );
};
