---
image: /prompts/2026-04/2043162207236788442-anime-opening-continuous-camera/cover.jpg
video: /prompts/2026-04/2043162207236788442-anime-opening-continuous-camera/video.mp4
date: 2026-04-12
title: Anime Opening Continuous Camera Flythrough
description: |-
  アニメOPによくあるキャラが謎の空間を浮遊しながら次々にアップで 나오는やつ
  @TapNow_AI Seedance 2.0
  プロンプト共有するので是非キャラリファレンスやポーズ、背景など変えてやってみてください😁

  prompt:
  日本のフルカラーアニメ、高速なカット割り、メリハリのあるスピードランプ、作画枚数多め、２４FPS、アニメのオープニング, 右へ左へと飛び回るようなカメラワーク、ダイナミックなポーズ
    type: anime_opening_continuous_camera_flythrough
    style: dark fantasy anime, cel-shaded 2D, high contrast
    characters:
      $A:
        ref: @yachimat 
      $B:
        ref: @kotori 
      $C:
        ref: @mayoi 
      $D:
        ref: @thieves 
    concept: >
      One unbroken camera move flying rapidly through a blue void.
      Characters arranged along the path, revealed as camera sweeps past.
      No cuts, one continuous shot.
    camera: fast forward dolly with lateral drifts, rollercoaster POV, never stops
    environment:
      space: infinite deep blue void, white petals and feathers drifting, diagonal blades and ribbons floating past lens
      palette: deep crimson (#5A0000–#8B0000), cyan mint accents, black shadows
      lighting: dramatic rim light, deep shadows
    path:
      - subject: $A
        pose: sitting on a throne
        framing: push-in to close-up, drift past shoulder
      - subject: $B
        pose: mid-lunge with blade
        framing: quick arc around him
      - subject: $C
        pose: katana vertical, gripping blade, eyes over steel
        framing: lateral drift past the blade
      - subject: $D
        pose: finger to lips in shh gesture, blade tip in foreground
        framing: low angle, slow final push-in, camera rests
    foreground_wipes: diagonal blades, petals, feathers, ribbons passing close to lens between reveals
    negative: hard cuts, static camera, fades, text, photorealism
models:
  - seedance2
tags:
  - anime
  - action
author: yachimat_manga
source_url: https://x.com/yachimat_manga/status/2043162207236788442
draft: true

full_text: "アニメOPによくあるキャラが謎の空間を浮遊しながら次々にアップで 나오는やつ\n@TapNow_AI Seedance 2.0\nプロンプト共有するので是非キャラリファレンスやポーズ、背景など変えてやってみてください😁\n\nprompt:\n日本のフルカラーアニメ、高速なカット割り、メリハリのあるスピードランプ、作画枚数多め、２４FPS、アニメのオープニング, 右へ左へと飛び回るようなカメラワーク、ダイナミックなポーズ\n  type: anime_opening_continuous_camera_flythrough\n  style: dark fantasy anime, cel-shaded 2D, high contrast\n  characters:\n    $A:\n      ref: @yachimat \n    $B:\n      ref: @kotori \n    $C:\n      ref: @mayoi \n    $D:\n      ref: @thieves \n  concept: >\n    One unbroken camera move flying rapidly through a blue void.\n    Characters arranged along the path, revealed as camera sweeps past.\n    No cuts, one continuous shot.\n  camera: fast forward dolly with lateral drifts, rollercoaster POV, never stops\n  environment:\n    space: infinite deep blue void, white petals and feathers drifting, diagonal blades and ribbons floating past lens\n    palette: deep crimson (#5A0000–#8B0000), cyan mint accents, black shadows\n    lighting: dramatic rim light, deep shadows\n  path:\n    - subject: $A\n      pose: sitting on a throne\n      framing: push-in to close-up, drift past shoulder\n    - subject: $B\n      pose: mid-lunge with blade\n      framing: quick arc around him\n    - subject: $C\n      pose: katana vertical, gripping blade, eyes over steel\n      framing: lateral drift past the blade\n    - subject: $D\n      pose: finger to lips in shh gesture, blade tip in foreground\n      framing: low angle, slow final push-in, camera rests\n  foreground_wipes: diagonal blades, petals, feathers, ribbons passing close to lens between reveals\n  negative: hard cuts, static camera, fades, text, photorealism"
