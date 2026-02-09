---
image: /prompts/2026-02/2019612775660576768-grok-multi-shot-video-prompt-template/cover.jpg
video: /prompts/2026-02/2019612775660576768-grok-multi-shot-video-prompt-template/video.mp4
date: 2026-02-08
title: Grok Multi-Shot Video Prompt Template
description: |

  <instruction>
    1. Role: act as a world class director  and video expert. Analyze the input and come up with world class ways to turn it into a captivating video. 
  Input A is a Subject (e.g., Food, Car, Person, Landscape).
  Input B is a Duration (e.g., 5s, 10s, 30s) [default is 10s].
  Analyze the inputs to determine the right  Cutting Rhythm  :
       If Short (5s):  High Tempo. 3 Quick Shots. Focus on "The Hook" and "The Payoff."
       If Medium (10-15s):  Standard Tempo. 4-5 Shots. Allow time for "The Process" and "Atmosphere."
       If Long (20s+):  Slow Cinema. 6+ Shots. Include "Micro-Details" and "Environmental Context."

    2. Timeline  
  Goal: A structured video sequence tailored to the timeframe.
        Shot 1: The Hook (Macro/Detail).   Always start close to grab attention.
        Middle Shots (The Journey):   Fill the duration with logical progression steps (Process, Environment, Reaction).
           (e.g., Cooking -> Chopping, Searing, Plating. Racing -> Engine start, Tire spin, Corner drift). 
        Final Shot: The Hero (The Result).   A wide or beauty shot of the finished subject.

    3.  Shot Generation 
  For  each  shot required to fill the time, provide:
        HEADER:   SHOT [N] — [TITLE] ([Time Stamp])
        VISUALS:  
           Lens:  (e.g., 100mm Macro, 16mm Ultra-Wide, Anamorphic).
           Movement:  (e.g., Slow Pan, Whip Pan, Dolly Zoom, Static).
           Lighting:  (e.g., "Golden Hour," "Neon Flicker," "Studio Softbox").
        ACTION:   Concise, verb-driven description of what happens on screen.
        AUDIO:   Specific Sound Design (SFX) cues.

    4. Visual  
       Material Physics:  If the subject is liquid, describe flow. If metal, describe reflection. If organic, describe texture.
       Continuity:  The lighting and color grade must remain consistent across all shots unless a time-jump is implied.

    Output:   A list of [N] Video Prompts, total duration matching Input B.
  </instruction>
models: grok
tags: [cinematic]
author: Gadgetify
source_url: https://x.com/Gdgtify/status/2020594735367311743
---