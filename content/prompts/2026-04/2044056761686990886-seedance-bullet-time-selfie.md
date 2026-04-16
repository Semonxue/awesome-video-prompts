---
image: /prompts/2026-04/2044056761686990886-seedance-bullet-time-selfie/cover.jpg
video: /prompts/2026-04/2044056761686990886-seedance-bullet-time-selfie/video.mp4
date: '2026-04-14'
title: Bullet-Time Selfie Parameter Template
description: |-
  FORMAT: 15s / ONE CONTINUOUS SHOT / BULLET TIME SELFIE

  PARAMS:
  <CHARACTER>: define subject, outfit, state
  <ENVIRONMENT>: define location, time, atmosphere
  <UNEXPECTED_EVENT>: define threat / accident / impact
  <OUTCOME_ACTION>: define reaction (attack / dodge / collision / escape)
  <FINAL_STATE>: define ending state

  RULE:
  Freeze the world, keep only <CHARACTER> in real-time motion.
  Delay character action inside slow motion (~2s hold before selfie).
  Selfie must clearly include both <CHARACTER> and the <UNEXPECTED_EVENT> in the same frame.

  STRUCTURE:

  0.0–3.0s — SETUP
  <CHARACTER> in <ENVIRONMENT>, normal flow.
  <UNEXPECTED_EVENT> begins and escalates rapidly.

  3.0–10.0s — PEAK (SLOW MOTION)

  3.0–5.0s
  Time slows almost to a freeze at the critical moment.
  <CHARACTER> holds position, tension builds.

  5.0–10.0s
  [cam: close, slight orbit / bullet time]
  [sfx: ambience stretch, single phone snap]

  <CHARACTER> pulls out phone → takes selfie capturing the moment → puts it back.

  10.0–13.0s — OUTCOME ACTION
  Time snaps back instantly.

  <OUTCOME_ACTION> plays out.

  13.0–15.0s — END
  <FINAL_STATE>.
models:
- seedance2
tags:
- cinematic
- action
- slow-motion
- template
author: Kōda
source_url: https://x.com/aimikoda/status/2044056761686990886
full_text: |-
  Seedance 2.0 Parameter Based Prompts

  I've been experimenting with variable-based prompting in Seedance 2.0 and built a modular template for these bullet-time selfie sequences.
  The main video was made with a different prompt. I used it as a base to build this template. It won't always be perfect depending on the scene, but the parameter-based approach is still very usable.

  Dropped a few examples in the replies, you just need to change the variables.

  Prompt Template:

  FORMAT: 15s / ONE CONTINUOUS SHOT / BULLET TIME SELFIE

  PARAMS:
  <CHARACTER>: define subject, outfit, state
  <ENVIRONMENT>: define location, time, atmosphere
  <UNEXPECTED_EVENT>: define threat / accident / impact
  <OUTCOME_ACTION>: define reaction (attack / dodge / collision / escape)
  <FINAL_STATE>: define ending state

  RULE:
  Freeze the world, keep only <CHARACTER> in real-time motion.
  Delay character action inside slow motion (~2s hold before selfie).
  Selfie must clearly include both <CHARACTER> and the <UNEXPECTED_EVENT> in the same frame.

  STRUCTURE:

  0.0–3.0s — SETUP
  <CHARACTER> in <ENVIRONMENT>, normal flow.
  <UNEXPECTED_EVENT> begins and escalates rapidly.

  3.0–10.0s — PEAK (SLOW MOTION)

  3.0–5.0s
  Time slows almost to a freeze at the critical moment.
  <CHARACTER> holds position, tension builds.

  5.0–10.0s
  [cam: close, slight orbit / bullet time]
  [sfx: ambience stretch, single phone snap]

  <CHARACTER> pulls out phone → takes selfie capturing the moment → puts it back.

  10.0–13.0s — OUTCOME ACTION
  Time snaps back instantly.

  <OUTCOME_ACTION> plays out.

  13.0–15.0s — END
  <FINAL_STATE>.
draft: false
---

FORMAT: 15s / ONE CONTINUOUS SHOT / BULLET TIME SELFIE

PARAMS:
<CHARACTER>: define subject, outfit, state
<ENVIRONMENT>: define location, time, atmosphere
<UNEXPECTED_EVENT>: define threat / accident / impact
<OUTCOME_ACTION>: define reaction (attack / dodge / collision / escape)
<FINAL_STATE>: define ending state

RULE:
Freeze the world, keep only <CHARACTER> in real-time motion.
Delay character action inside slow motion (~2s hold before selfie).
Selfie must clearly include both <CHARACTER> and the <UNEXPECTED_EVENT> in the same frame.

STRUCTURE:

0.0–3.0s — SETUP
<CHARACTER> in <ENVIRONMENT>, normal flow.
<UNEXPECTED_EVENT> begins and escalates rapidly.

3.0–10.0s — PEAK (SLOW MOTION)

3.0–5.0s
Time slows almost to a freeze at the critical moment.
<CHARACTER> holds position, tension builds.

5.0–10.0s
[cam: close, slight orbit / bullet time]
[sfx: ambience stretch, single phone snap]

<CHARACTER> pulls out phone → takes selfie capturing the moment → puts it back.

10.0–13.0s — OUTCOME ACTION
Time snaps back instantly.

<OUTCOME_ACTION> plays out.

13.0–15.0s — END
<FINAL_STATE>.
---
