# Review checklist

Go through this on the contact sheet (`out/episodes/<slug>/contact-sheet.png`,
one frame per beat) and again on a few frames of the final render. Fix
anything that fails, then re-run `stills`.

## Story

- [ ] The first 3–4 seconds say what the video is about (hook line or card).
- [ ] Every fact the narrator states is in `facts` with a source, worded the
      same way (no stronger claims than the source).
- [ ] The tip is concrete and safe.
- [ ] The video ends on a character's punchline, not the narrator.
- [ ] Length is within ~10% of what the user asked for (`check` prints it).

## Picture

- [ ] Whoever is speaking is on screen, facing/looking at who they talk to.
- [ ] No character is cropped by the frame edge or hidden behind a pop-up
      (move them with `x`, or pick a different pop-up).
- [ ] Characters don't overlap each other (keep ~300 px between centres;
      more for big puppets).
- [ ] Every beat has visible acting: expression or gesture changes on the
      speaker, a reaction on the listener.
- [ ] Pop-ups are readable and don't cover faces; at most one per beat.
- [ ] Surprise entrances (`hidden` → `visible`) land on the line that
      introduces the character.
- [ ] Held props sit in the hand (`gesture: 'hold'`).
- [ ] No captions, no channel name or logo, no subscribe outro, no wipes.

## Sound

- [ ] Every line is voiced (`check` shows 🔊 for each).
- [ ] Voices are distinct and fit the characters (re-voice with `--force --only id`).
- [ ] SFX land on visual hits and are sparse.
- [ ] Music is audible under the dialogue (it ducks automatically).
- [ ] The render measures about −20 LUFS:
      `ffmpeg -i out/episodes/<slug>.mp4 -af ebur128 -f null -`.
