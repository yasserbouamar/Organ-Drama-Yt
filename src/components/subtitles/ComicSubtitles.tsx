import React from 'react';
import {Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {getActiveLine, SCRIPT_60S} from '../../data/script60s';
import {SPEAKER_STYLES} from '../../data/speakers';
import {FONTS, PALETTE} from '../../theme';
import type {Speaker} from '../../types/characters';
import type {DialogueEvent, WordTiming} from '../../types/dialogue';
import {getWordIndexAt, getWordTimings} from '../../utils/lipSync';
import {SpeakerBadge} from '../comic/SpeakerBadge';

/** Speakers with no on-screen puppet: their badge rides on the caption instead. */
const CAPTION_BADGE_SPEAKERS: readonly Speaker[] = ['HOST'];

const MAX_WORDS = 5;
const MAX_CHARS = 30;
const CAPTION_BOTTOM = 78;

const normalise = (w: string): string => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');

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
    chars += w.text.length + (page.length > 1 ? 1 : 0);
    const endsSentence = /([.!?]+|\.\.\.|…)$/.test(w.text);
    const endsClause = /[,;:]$/.test(w.text) && page.length >= 3;
    if (endsSentence || endsClause) {
      pages.push(page);
      page = [];
      chars = 0;
    }
  });
  if (page.length > 0) {
    pages.push(page);
  }
  // Fold one-word orphans back into the previous page when that page didn't end a sentence.
  for (let i = pages.length - 1; i > 0; i--) {
    const prev = pages[i - 1];
    const prevEndsSentence = /([.!?]+|\.\.\.|…)$/.test(words[prev[prev.length - 1]].text);
    const chars = [...prev, ...pages[i]].reduce((acc, wi) => acc + words[wi].text.length + 1, -1);
    if (pages[i].length === 1 && !prevEndsSentence && chars <= MAX_CHARS + 8) {
      pages.splice(i - 1, 2, [...prev, ...pages[i]]);
    }
  }
  return pages;
};

const Caption: React.FC<{line: DialogueEvent; local: number}> = ({line, local}) => {
  const {fps} = useVideoConfig();
  const words = getWordTimings(line);
  const pages = paginate(words);
  const current = getWordIndexAt(words, local + 2);
  const pageIndex = Math.max(0, pages.findIndex((p) => p.includes(Math.max(0, current))));
  const page = pages[pageIndex];
  const style = SPEAKER_STYLES[line.speaker];
  const emphasis = new Set((line.emphasis ?? []).map(normalise));
  const shout = line.delivery === 'shout';

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: CAPTION_BOTTOM,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        columnGap: 26,
        rowGap: 4,
        padding: '0 80px',
        flexWrap: 'wrap',
      }}
    >
      {page.map((wi, slot) => {
        const w = words[wi];
        // The whole chunk pops in together (staggered), then the spoken word is highlighted.
        const pageStart = words[page[0]].startFrame;
        const appear = spring({
          frame: local - pageStart + 3 - slot * 1.5,
          fps,
          config: line.delivery === 'calm' ? {damping: 18, stiffness: 160} : {damping: 11, stiffness: 220},
        });
        const spoken = local + 2 >= w.startFrame;
        const isActive = wi === current && local < w.endFrame + 4;
        const isEmphasis = emphasis.has(normalise(w.text));
        const jitter = shout && isActive ? Math.sin(local * 2.3 + wi) * 2.5 : 0;
        const scale = (0.55 + 0.45 * appear) * (isActive ? 1.08 : 1);
        const text = w.text.toUpperCase();
        return (
          <div
            key={`${line.id}-${wi}`}
            style={{
              position: 'relative',
              transform: `translateY(${(1 - appear) * 24}px) scale(${scale}) rotate(${isActive ? -2.5 : 0}deg) translateX(${jitter}px)`,
              transformOrigin: '50% 80%',
              opacity: Math.min(1, appear * 1.4) * (spoken || isActive ? 1 : 0.82),
              fontFamily: FONTS.body,
              fontWeight: 900,
              fontSize: 70,
              lineHeight: 1.08,
              letterSpacing: 0.5,
              padding: '6px 16px 2px',
              borderRadius: 16,
              background: isActive ? PALETTE.hazardYellow : 'transparent',
              border: isActive ? `5px solid ${PALETTE.ink}` : '5px solid transparent',
              boxShadow: isActive ? `0 0 0 6px ${PALETTE.white}, 8px 9px 0 6px ${PALETTE.ink}` : 'none',
              color: isActive ? PALETTE.ink : isEmphasis ? style.accent : PALETTE.white,
              WebkitTextStroke: isActive ? '0px transparent' : `12px ${PALETTE.ink}`,
              paintOrder: 'stroke fill',
              textShadow: isActive ? 'none' : `5px 6px 0 ${PALETTE.ink}`,
              whiteSpace: 'nowrap',
              zIndex: isActive ? 2 : 1,
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Word-by-word kinetic captions. Mounted at the top of the composition, so
 * `useCurrentFrame()` is the absolute frame; the active line comes straight
 * from `script60s.ts`.
 */
export const ComicSubtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const line = getActiveLine(frame);

  return (
    <>
      {/* Bottom scrim so captions stay legible on bright panels. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: 'linear-gradient(to top, rgba(15,12,32,0.72), rgba(15,12,32,0))',
          pointerEvents: 'none',
          zIndex: 70,
        }}
      />
      <div style={{position: 'absolute', inset: 0, zIndex: 71, pointerEvents: 'none'}}>
        {line ? <Caption line={line} local={frame - line.startFrame} /> : null}
        {SCRIPT_60S.filter((l) => CAPTION_BADGE_SPEAKERS.includes(l.speaker)).map((l) => (
          <Sequence key={l.id} from={l.startFrame} durationInFrames={l.durationInFrames} layout="none" name={`Caption badge ${l.id}`}>
            <SpeakerBadge speaker={l.speaker} x={960} y={1080 - CAPTION_BOTTOM - 128} durationInFrames={l.durationInFrames} tail rotation={-3} scale={0.82} />
          </Sequence>
        ))}
      </div>
    </>
  );
};
