---
title: Parametric Prompt Engine for Video Generation
image: /prompts/2026-04/2046347547103596679-parametric-prompt-engine-seedance-2/cover.jpg
video: /prompts/2026-04/2046347547103596679-parametric-prompt-engine-seedance-2/video.mp4
date: '2026-04-21'
models:
- seedance2
tags:
- cinematic
- action
- tracking
- car
- prompt-generator
author: willie
source_url: https://x.com/ReflctWillie/status/2046347547103596679
description: "## ANALYSIS PHASE (internal, do not output)\n \nBefore writing the prompt,\
  \ determine:\n \n**Scene archetype** — Classify into one of: `combat` / `dialogue`\
  \ / `chase` / `intimate` / `discovery` / `performance` / `environmental` / `transformation`\
  \ / `ensemble` / `montage`. This selects which specialized modules to include.\n\
  \ \n**Character extraction** — From each image, extract: build, apparent age, wardrobe,\
  \ distinctive features, posture/attitude. Write these as compact identity anchors\
  \ (e.g., \"tall, lean, mid-30s, black tactical jacket, close-cropped hair, watchful\
  \ stance\") — enough for identity consistency without over-constraining. Target\
  \ 8–15 words per character.\n \n**Environmental logic** — Infer materials, lighting\
  \ conditions, spatial scale, interactive elements (what can be touched, moved, broken,\
  \ climbed). Note time of day and weather if implied.\n \n**Emotional spine** — Identify\
  \ the scene's core tension or question. Every beat should serve this.\n \n**Natural\
  \ arc** — Determine the scene's rhythm: does it build, release, oscillate, or sustain?\
  \ This drives the ESCALATION and HERO MOMENT equivalents.\n \n**Asymmetric intent**\
  \ — Identify what each character wants *individually*. Dramatic charge comes from\
  \ mismatched motivations, not shared ones.\n \n---\n \n## OUTPUT STRUCTURE\n \n\
  Assemble the prompt using these blocks. Modules marked *(conditional)* only appear\
  \ when relevant to the scene archetype.\n \n```\nFORMAT: [duration] / [continuity\
  \ descriptor — e.g., continuous, single-take, interleaved, montage]\n \nCHARACTERS\n\
  A: [identity anchor from image analysis + role in scene]\nB: [identity anchor from\
  \ image analysis + role in scene]\n[additional characters as needed]\n \nENVIRONMENT\n\
  [2–4 sentence description: space, materials, lighting, atmosphere, interactive elements,\
  \ time/weather]\n \nSCENE PROFILE\nTYPE: [scene archetype]\nTONE: [e.g., tender\
  \ / menacing / bittersweet / reverent / unnerving / euphoric — pick 1–2]\nENERGY:\
  \ [low / medium / high / explosive / suspended]\nSTAKES: [what is at risk or being\
  \ pursued]\nINTENT: [what each character wants from the scene — asymmetric where\
  \ possible]\n \nVISUAL\nCinematic realism, physical lighting, shallow DOF, subtle\
  \ grain, natural motion blur.\n[+ any archetype-specific additions: e.g., \"warm\
  \ practical sources\" for intimate, \"anamorphic flare\" for performance, \"handheld\
  \ intimacy\" for dialogue]\n \nDIRECTIVE\nNo fixed choreography. Scene emerges from\
  \ character intent, environment, and emotional momentum.\n \nBEHAVIOR\n- [3–5 bullets\
  \ describing what actions/reactions are encouraged, tuned to archetype]\n- Use environment\
  \ expressively (not decoratively)\n- Allow micro-behaviors: glances, breath, weight\
  \ shifts, hesitations\n \nRULES\n- Momentum and motivation chain only — no disconnected\
  \ beats\n- Clear spatial positioning at all times\n- Continuous, motivated camera\
  \ ([archetype-appropriate framings: e.g., OTS + push-in for dialogue; wide + low-angle\
  \ for performance; POV + handheld for discovery])\n- Environment reacts appropriately\
  \ ([archetype-specific: e.g., dust motes + light shifts for intimate; debris + splashes\
  \ for combat; reflections + condensation for atmospheric])\n \n[CONDITIONAL MODULE\
  \ — IMPACT] *(combat, chase, transformation)*\nStrong contacts/transitions: 2-frame\
  \ hold + brightness spike + micro shake resume\n \n[CONDITIONAL MODULE — CONNECTION]\
  \ *(intimate, dialogue)*\nKey emotional beats: slight hold on reaction + soft focus\
  \ pull + breath audible in mix\n \n[CONDITIONAL MODULE — REVELATION] *(discovery,\
  \ transformation)*\nRecognition beats: focus rack + slight push-in + ambient drop\n\
  \ \nMOTION\nSecondary delay (~2 frames) on hair, fabric, environment. Weight and\
  \ inertia respected throughout.\n \nRHYTHM\n[Archetype-tuned: e.g., \"Fast exchanges\
  \ + micro pauses + 1–2 slow-motion beats\" for combat; \"Long holds + small gestures\
  \ + one breath-catch beat\" for intimate; \"Sustained glide + one rupture + recovery\"\
  \ for discovery]\n \nESCALATION\nIntensity rises toward a defined apex. Include:\n\
  - one environment-driven or spatially expressive moment\n- one decisive beat that\
  \ shifts the scene's state\n \nHERO MOMENT (CRITICAL)\nGenerate one standout beat\
  \ that crystallizes the scene:\n- visually dominant, clearly readable\n- uses environment\
  \ or full-body expression\n- [archetype-appropriate entry] → defining action → brief\
  \ aftermath hold\n- ends with strong silhouette, composition, or emotional register\n\
  \ \nGUARDRAILS\n- Keep character identity and position consistent (no teleporting,\
  \ no feature drift)\n- Respect weight, inertia, and physical causality\n- Ensure\
  \ clear cause → effect in every beat\n- Keep camera readable and motivated (no random\
  \ spins or cuts)\n- Use environment logically (no clipping, no scale mismatch)\n\
  - Prioritize clarity and emotional truth over complexity\n \nOUTPUT\nFluid, physical,\
  \ cinematic scene with clear spatial logic, dynamic camera, environmental interaction,\
  \ and a memorable defining moment.\n```\n \n---\n \n## FEW-SHOT EXAMPLE 1 — COMBAT\
  \ (original archetype)\n \n**Input:**\n- Character images: [two martial figures\
  \ in dark practical clothing]\n- Scene description: \"A duel between rival assassins\
  \ in an abandoned warehouse at dusk. Brutal and tactical — neither will walk away\
  \ casually.\"\n**Output:**\n \n```\nFORMAT: 15s / continuous fight\n \nCHARACTERS\n\
  A: tall, lean, late-30s, black tactical jacket, close-cropped hair, controlled stance\
  \ — the veteran\nB: mid-30s, wiry, dark hooded pullover, fingerless gloves, restless\
  \ footwork — the challenger\n \nENVIRONMENT\nAbandoned warehouse, concrete floor\
  \ streaked with old oil, steel support columns at regular intervals. Dust motes\
  \ drift in horizontal shafts of dusk light through high broken windows. Stacked\
  \ wooden pallets, a chain hoist overhead, loose rebar near the walls. Cold, echoing,\
  \ scale large enough to allow distance and vertical play.\n \nSCENE PROFILE\nTYPE:\
  \ combat / duel\nTONE: brutal, tactical\nENERGY: high, escalating to explosive\n\
  STAKES: survival — only one leaves\nINTENT: A wants to end it quickly and cleanly;\
  \ B wants to prove something before the end\n \nVISUAL\nCinematic realism, physical\
  \ lighting, shallow DOF, subtle grain, natural motion blur. Dust catches the low\
  \ side-light; shadows long and hard-edged.\n \nDIRECTIVE\nNo fixed choreography.\
  \ Fight emerges dynamically from characters, environment, and momentum.\n \nBEHAVIOR\n\
  - Use environment freely (walls, columns, pallets, chain hoist)\n- Allow verticality\
  \ (climb, wall-run, elevation shifts)\n- Encourage unexpected but physically valid\
  \ actions\n- Micro-behaviors: breath control, weight resets, a wipe of blood from\
  \ the mouth\n \nRULES\n- Momentum chain only, no isolated actions\n- Clear positioning\
  \ at all times\n- Continuous, motivated camera (POV / OTS / wide / low-high as needed)\n\
  - Environment actively reacts (dust plumes, debris, sparks from rebar, chain swing)\n\
  \ \nIMPACT\nStrong contacts: 2-frame hold + brightness spike + micro shake resume\n\
  \ \nMOTION\nSecondary delay (~2 frames) on hair, fabric, environment. Weight and\
  \ inertia respected throughout.\n \nRHYTHM\nFast exchanges + micro pauses + 1–2\
  \ slow-motion beats (0.5–1s)\n \nESCALATION\nIntensity rises. Include:\n- one vertical/environment-driven\
  \ move (a column used to redirect, a pallet kicked into the space)\n- one decisive\
  \ high-impact action\n \nHERO MOMENT (CRITICAL)\nGenerate one standout finishing\
  \ beat:\n- visually dominant, clearly readable\n- uses environment or full-body\
  \ motion\n- slow-motion entry → sharp impact → brief aftermath hold\n- ends with\
  \ strong silhouette against the broken-window light, dust suspended, one figure\
  \ standing\n \nGUARDRAILS\n- Keep character identity and position consistent (no\
  \ teleporting)\n- Respect weight and inertia (no floaty or impossible motion)\n\
  - Ensure clear cause → effect in every action\n- Keep camera readable and motivated\
  \ (no random spins or cuts)\n- Use environment logically (no clipping or mismatch)\n\
  - Prioritize clarity and physical realism over complexity\n \nOUTPUT\nFluid, physical,\
  \ cinematic fight with clear spatial logic, dynamic camera, environmental interaction,\
  \ and a memorable final highlight moment.\n```\n \n---\n \n## FEW-SHOT EXAMPLE 2\
  \ — INTIMATE / REUNION\n \n**Input:**\n- Character images: [two figures, one in\
  \ worn leather jacket, one in business attire]\n- Scene description: \"A reunion\
  \ in a rain-soaked alley at night. They haven't seen each other in ten years. Tension\
  \ but not hostility — unfinished business.\"\n**Output:**\n \n```\nFORMAT: 12s /\
  \ continuous, single breath-like take\n \nCHARACTERS\nA: mid-30s, lean, worn brown\
  \ leather jacket over dark henley, unshaven, hands in pockets but shoulders tight\
  \ — arrived first, has been waiting\nB: mid-30s, charcoal overcoat over tailored\
  \ suit, damp hair, briefcase in left hand — arrived second, deliberate pace\n \n\
  ENVIRONMENT\nNarrow alley between brick buildings, slick with recent rain. Single\
  \ sodium streetlight from the far end casts long amber shadows; a neon sign two\
  \ buildings over bleeds red into puddles. Steam rises from a vent. Low ambient hum\
  \ of city beyond. Puddles, loose gravel, a metal dumpster, one flickering bulb above\
  \ a service door.\n \nSCENE PROFILE\nTYPE: intimate / reunion\nTONE: bittersweet,\
  \ suspended, quietly charged\nENERGY: low, with one surge\nSTAKES: acknowledgment\
  \ — whether ten years can be spoken to or must stay unspoken\nINTENT: A wants to\
  \ know if B remembers; B wants to leave before admitting they do\n \nVISUAL\nCinematic\
  \ realism, physical lighting, shallow DOF, subtle grain, natural motion blur. Warm\
  \ sodium + cold neon color contrast. Wet surfaces catch and fracture light. Breath\
  \ visible in cold air.\n \nDIRECTIVE\nNo fixed choreography. Scene emerges from\
  \ character intent, environment, and emotional momentum.\n \nBEHAVIOR\n- Micro-behaviors\
  \ lead: glances held a beat too long, weight shifts, a hand half-raised then dropped\n\
  - Physical distance negotiated without language — one step closer, one step back\n\
  - Environment expressive: a puddle disturbed, breath fogging, the flickering bulb\
  \ timing a pause\n- Allow silence to carry weight; dialogue optional and sparse\n\
  \ \nRULES\n- Momentum and motivation chain only — no disconnected beats\n- Clear\
  \ spatial positioning at all times\n- Continuous, motivated camera: slow push-in\
  \ on A from behind B's shoulder, drift to profile two-shot, one handheld rack to\
  \ B's hand on the briefcase\n- Environment reacts: rain drips from a gutter, steam\
  \ curls between them, a distant car passes casting moving shadow\n \nCONNECTION\n\
  Key emotional beats: slight hold on reaction + soft focus pull + breath audible\
  \ in mix\n \nMOTION\nSecondary delay (~2 frames) on hair, fabric, environment. Weight\
  \ and inertia respected throughout.\n \nRHYTHM\nLong holds + small gestures + one\
  \ breath-catch beat. Two moments where time almost stops. One slow exhale that releases\
  \ the tension without resolving it.\n \nESCALATION\nIntensity rises toward a defined\
  \ apex. Include:\n- one environment-driven moment (the bulb flickers at the exact\
  \ wrong second, or a passing car's light sweeps across both faces)\n- one decisive\
  \ beat that shifts the scene's state (B sets the briefcase down, or A takes the\
  \ half-step forward)\n \nHERO MOMENT (CRITICAL)\nGenerate one standout beat that\
  \ crystallizes the scene:\n- visually dominant, clearly readable\n- uses environment\
  \ or full-body expression\n- Slow focus rack from A's eyes to B's hand loosening\
  \ on the briefcase handle → the hand opens slightly → hold on the small space between\
  \ them, neon reflected in a puddle at their feet\n- ends with two figures in silhouette\
  \ against amber light, close but not touching\n \nGUARDRAILS\n- Keep character identity\
  \ and position consistent (no teleporting, no feature drift)\n- Respect weight,\
  \ inertia, and physical causality\n- Ensure clear cause → effect in every beat\n\
  - Keep camera readable and motivated (no random spins or cuts)\n- Use environment\
  \ logically (no clipping, no scale mismatch)\n- Prioritize clarity and emotional\
  \ truth over complexity\n \nOUTPUT\nFluid, physical, cinematic scene with clear\
  \ spatial logic, dynamic camera, environmental interaction, and a memorable defining\
  \ moment.\n```"
draft: false
---

## ANALYSIS PHASE (internal, do not output)
 
Before writing the prompt, determine:
 
**Scene archetype** — Classify into one of: `combat` / `dialogue` / `chase` / `intimate` / `discovery` / `performance` / `environmental` / `transformation` / `ensemble` / `montage`. This selects which specialized modules to include.
 
**Character extraction** — From each image, extract: build, apparent age, wardrobe, distinctive features, posture/attitude. Write these as compact identity anchors (e.g., "tall, lean, mid-30s, black tactical jacket, close-cropped hair, watchful stance") — enough for identity consistency without over-constraining. Target 8–15 words per character.
 
**Environmental logic** — Infer materials, lighting conditions, spatial scale, interactive elements (what can be touched, moved, broken, climbed). Note time of day and weather if implied.
 
**Emotional spine** — Identify the scene's core tension or question. Every beat should serve this.
 
**Natural arc** — Determine the scene's rhythm: does it build, release, oscillate, or sustain? This drives the ESCALATION and HERO MOMENT equivalents.
 
**Asymmetric intent** — Identify what each character wants *individually*. Dramatic charge comes from mismatched motivations, not shared ones.
 
---
 
## OUTPUT STRUCTURE
 
Assemble the prompt using these blocks. Modules marked *(conditional)* only appear when relevant to the scene archetype.
 
```
FORMAT: [duration] / [continuity descriptor — e.g., continuous, single-take, interleaved, montage]
 
CHARACTERS
A: [identity anchor from image analysis + role in scene]
B: [identity anchor from image analysis + role in scene]
[additional characters as needed]
 
ENVIRONMENT
[2–4 sentence description: space, materials, lighting, atmosphere, interactive elements, time/weather]
 
SCENE PROFILE
TYPE: [scene archetype]
TONE: [e.g., tender / menacing / bittersweet / reverent / unnerving / euphoric — pick 1–2]
ENERGY: [low / medium / high / explosive / suspended]
STAKES: [what is at risk or being pursued]
INTENT: [what each character wants from the scene — asymmetric where possible]
 
VISUAL
Cinematic realism, physical lighting, shallow DOF, subtle grain, natural motion blur.
[+ any archetype-specific additions: e.g., "warm practical sources" for intimate, "anamorphic flare" for performance, "handheld intimacy" for dialogue]
 
DIRECTIVE
No fixed choreography. Scene emerges from character intent, environment, and emotional momentum.
 
BEHAVIOR
- [3–5 bullets describing what actions/reactions are encouraged, tuned to archetype]
- Use environment expressively (not decoratively)
- Allow micro-behaviors: glances, breath, weight shifts, hesitations
 
RULES
- Momentum and motivation chain only — no disconnected beats
- Clear spatial positioning at all times
- Continuous, motivated camera ([archetype-appropriate framings: e.g., OTS + push-in for dialogue; wide + low-angle for performance; POV + handheld for discovery])
- Environment reacts appropriately ([archetype-specific: e.g., dust motes + light shifts for intimate; debris + splashes for combat; reflections + condensation for atmospheric])
 
[CONDITIONAL MODULE — IMPACT] *(combat, chase, transformation)*
Strong contacts/transitions: 2-frame hold + brightness spike + micro shake resume
 
[CONDITIONAL MODULE — CONNECTION] *(intimate, dialogue)*
Key emotional beats: slight hold on reaction + soft focus pull + breath audible in mix
 
[CONDITIONAL MODULE — REVELATION] *(discovery, transformation)*
Recognition beats: focus rack + slight push-in + ambient drop
 
MOTION
Secondary delay (~2 frames) on hair, fabric, environment. Weight and inertia respected throughout.
 
RHYTHM
[Archetype-tuned: e.g., "Fast exchanges + micro pauses + 1–2 slow-motion beats" for combat; "Long holds + small gestures + one breath-catch beat" for intimate; "Sustained glide + one rupture + recovery" for discovery]
 
ESCALATION
Intensity rises toward a defined apex. Include:
- one environment-driven or spatially expressive moment
- one decisive beat that shifts the scene's state
 
HERO MOMENT (CRITICAL)
Generate one standout beat that crystallizes the scene:
- visually dominant, clearly readable
- uses environment or full-body expression
- [archetype-appropriate entry] → defining action → brief aftermath hold
- ends with strong silhouette, composition, or emotional register
 
GUARDRAILS
- Keep character identity and position consistent (no teleporting, no feature drift)
- Respect weight, inertia, and physical causality
- Ensure clear cause → effect in every beat
- Keep camera readable and motivated (no random spins or cuts)
- Use environment logically (no clipping, no scale mismatch)
- Prioritize clarity and emotional truth over complexity
 
OUTPUT
Fluid, physical, cinematic scene with clear spatial logic, dynamic camera, environmental interaction, and a memorable defining moment.
```
 
---
 
## FEW-SHOT EXAMPLE 1 — COMBAT (original archetype)
 
**Input:**
- Character images: [two martial figures in dark practical clothing]
- Scene description: "A duel between rival assassins in an abandoned warehouse at dusk. Brutal and tactical — neither will walk away casually."
**Output:**
 
```
FORMAT: 15s / continuous fight
 
CHARACTERS
A: tall, lean, late-30s, black tactical jacket, close-cropped hair, controlled stance — the veteran
B: mid-30s, wiry, dark hooded pullover, fingerless gloves, restless footwork — the challenger
 
ENVIRONMENT
Abandoned warehouse, concrete floor streaked with old oil, steel support columns at regular intervals. Dust motes drift in horizontal shafts of dusk light through high broken windows. Stacked wooden pallets, a chain hoist overhead, loose rebar near the walls. Cold, echoing, scale large enough to allow distance and vertical play.
 
SCENE PROFILE
TYPE: combat / duel
TONE: brutal, tactical
ENERGY: high, escalating to explosive
STAKES: survival — only one leaves
INTENT: A wants to end it quickly and cleanly; B wants to prove something before the end
 
VISUAL
Cinematic realism, physical lighting, shallow DOF, subtle grain, natural motion blur. Dust catches the low side-light; shadows long and hard-edged.
 
DIRECTIVE
No fixed choreography. Fight emerges dynamically from characters, environment, and momentum.
 
BEHAVIOR
- Use environment freely (walls, columns, pallets, chain hoist)
- Allow verticality (climb, wall-run, elevation shifts)
- Encourage unexpected but physically valid actions
- Micro-behaviors: breath control, weight resets, a wipe of blood from the mouth
 
RULES
- Momentum chain only, no isolated actions
- Clear positioning at all times
- Continuous, motivated camera (POV / OTS / wide / low-high as needed)
- Environment actively reacts (dust plumes, debris, sparks from rebar, chain swing)
 
IMPACT
Strong contacts: 2-frame hold + brightness spike + micro shake resume
 
MOTION
Secondary delay (~2 frames) on hair, fabric, environment. Weight and inertia respected throughout.
 
RHYTHM
Fast exchanges + micro pauses + 1–2 slow-motion beats (0.5–1s)
 
ESCALATION
Intensity rises. Include:
- one vertical/environment-driven move (a column used to redirect, a pallet kicked into the space)
- one decisive high-impact action
 
HERO MOMENT (CRITICAL)
Generate one standout finishing beat:
- visually dominant, clearly readable
- uses environment or full-body motion
- slow-motion entry → sharp impact → brief aftermath hold
- ends with strong silhouette against the broken-window light, dust suspended, one figure standing
 
GUARDRAILS
- Keep character identity and position consistent (no teleporting)
- Respect weight and inertia (no floaty or impossible motion)
- Ensure clear cause → effect in every action
- Keep camera readable and motivated (no random spins or cuts)
- Use environment logically (no clipping or mismatch)
- Prioritize clarity and physical realism over complexity
 
OUTPUT
Fluid, physical, cinematic fight with clear spatial logic, dynamic camera, environmental interaction, and a memorable final highlight moment.
```
 
---
 
## FEW-SHOT EXAMPLE 2 — INTIMATE / REUNION
 
**Input:**
- Character images: [two figures, one in worn leather jacket, one in business attire]
- Scene description: "A reunion in a rain-soaked alley at night. They haven't seen each other in ten years. Tension but not hostility — unfinished business."
**Output:**
 
```
FORMAT: 12s / continuous, single breath-like take
 
CHARACTERS
A: mid-30s, lean, worn brown leather jacket over dark henley, unshaven, hands in pockets but shoulders tight — arrived first, has been waiting
B: mid-30s, charcoal overcoat over tailored suit, damp hair, briefcase in left hand — arrived second, deliberate pace
 
ENVIRONMENT
Narrow alley between brick buildings, slick with recent rain. Single sodium streetlight from the far end casts long amber shadows; a neon sign two buildings over bleeds red into puddles. Steam rises from a vent. Low ambient hum of city beyond. Puddles, loose gravel, a metal dumpster, one flickering bulb above a service door.
 
SCENE PROFILE
TYPE: intimate / reunion
TONE: bittersweet, suspended, quietly charged
ENERGY: low, with one surge
STAKES: acknowledgment — whether ten years can be spoken to or must stay unspoken
INTENT: A wants to know if B remembers; B wants to leave before admitting they do
 
VISUAL
Cinematic realism, physical lighting, shallow DOF, subtle grain, natural motion blur. Warm sodium + cold neon color contrast. Wet surfaces catch and fracture light. Breath visible in cold air.
 
DIRECTIVE
No fixed choreography. Scene emerges from character intent, environment, and emotional momentum.
 
BEHAVIOR
- Micro-behaviors lead: glances held a beat too long, weight shifts, a hand half-raised then dropped
- Physical distance negotiated without language — one step closer, one step back
- Environment expressive: a puddle disturbed, breath fogging, the flickering bulb timing a pause
- Allow silence to carry weight; dialogue optional and sparse
 
RULES
- Momentum and motivation chain only — no disconnected beats
- Clear spatial positioning at all times
- Continuous, motivated camera: slow push-in on A from behind B's shoulder, drift to profile two-shot, one handheld rack to B's hand on the briefcase
- Environment reacts: rain drips from a gutter, steam curls between them, a distant car passes casting moving shadow
 
CONNECTION
Key emotional beats: slight hold on reaction + soft focus pull + breath audible in mix
 
MOTION
Secondary delay (~2 frames) on hair, fabric, environment. Weight and inertia respected throughout.
 
RHYTHM
Long holds + small gestures + one breath-catch beat. Two moments where time almost stops. One slow exhale that releases the tension without resolving it.
 
ESCALATION
Intensity rises toward a defined apex. Include:
- one environment-driven moment (the bulb flickers at the exact wrong second, or a passing car's light sweeps across both faces)
- one decisive beat that shifts the scene's state (B sets the briefcase down, or A takes the half-step forward)
 
HERO MOMENT (CRITICAL)
Generate one standout beat that crystallizes the scene:
- visually dominant, clearly readable
- uses environment or full-body expression
- Slow focus rack from A's eyes to B's hand loosening on the briefcase handle → the hand opens slightly → hold on the small space between them, neon reflected in a puddle at their feet
- ends with two figures in silhouette against amber light, close but not touching
 
GUARDRAILS
- Keep character identity and position consistent (no teleporting, no feature drift)
- Respect weight, inertia, and physical causality
- Ensure clear cause → effect in every beat
- Keep camera readable and motivated (no random spins or cuts)
- Use environment logically (no clipping, no scale mismatch)
- Prioritize clarity and emotional truth over complexity
 
OUTPUT
Fluid, physical, cinematic scene with clear spatial logic, dynamic camera, environmental interaction, and a memorable defining moment.
```