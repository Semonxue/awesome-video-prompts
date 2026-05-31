#!/bin/bash
set -e
BASE="/Users/semonxue/Workplace/Works/ai-dev/awesome-video-prompts"
STATIC="$BASE/static/_drafts/prompts/2026-05"
CONTENT="$BASE/content/prompts/2026-05"

process_tweet() {
  local tweet_id="$1"
  local slug="$2"
  local title="$3"
  local desc="$4"
  local models="$5"
  local tags="$6"
  local author="$7"
  local source_url="$8"
  local post_date="$9"

  local dir="$STATIC/$slug"
  local content_file="$CONTENT/$slug.md"

  # Copy cover and compress
  cp "$BASE/temp/$tweet_id/video_00001.jpg" "$dir/cover.jpg"
  convert "$dir/cover.jpg" -resize 600x -quality 60 "$dir/cover.jpg"

  # Copy preview video
  cp "$BASE/temp/$tweet_id/preview_1_480p.mp4" "$dir/video.mp4"

  # Create content markdown with proper front matter
  cat > "$content_file" << FRONTMATTER
---
image: /prompts/2026-05/$slug/cover.jpg
video: /prompts/2026-05/$slug/video.mp4
date: $post_date
title: "$title"
description: |-
$desc
models: [$models]
tags: [$tags]
author: "$author"
source_url: "$source_url"
draft: true
---

FRONTMATTER

  echo "Done: $slug"
}

# Tweet 1: Pixar quality 3D animation
process_tweet \
  "2060412949223866821" \
  "2060412949223866821-pixar-quality-3d-animation" \
  "Pixar Quality 3D Animation with One Prompt" \
  "including 'Pixar' in prompt brings AI video to next level. AI video has reached pixar quality - you can now generate 1 min 3D animation with one prompt." \
  "seedance" \
  "[cinematic, 3d, animation, pixar, quality]" \
  "el.cine" \
  "https://twitter.com/EHuanglu/status/2060412949223866821" \
  "2026-05-29"

# Tweet 2: Tokyo Luxury Travel Film
process_tweet \
  "2060658626394759495" \
  "2060658626394759495-tokyo-luxury-travel-film" \
  "Tokyo Luxury Travel Film" \
  "Ultra realistic cinematic travel film, luxury lifestyle aesthetic, premium tourism commercial quality, photorealistic, natural skin texture, realistic motion, shallow depth of field, cinematic color grading, smooth transitions, high dynamic range, authentic Tokyo atmosphere, consistent character identity across all shots, realistic crowd behavior, no character changes, no random scene jumps, seamless story progression.

ENVIRONMENT:
Tokyo, Japan.
Haneda International Airport arrival terminal, modern Japanese architecture, bilingual Japanese-English signage, polished floors, travelers moving naturally, airport exit area with city view, authentic Japanese restaurant with wooden interior and warm lanterns, luxury shopping mall with premium stores and reflective floors, cozy coffee shop overlooking neon-lit Tokyo streets, elegant luxury hotel lobby, rooftop terrace with panoramic Tokyo night skyline, illuminated skyscrapers, city lights stretching into the distance.

CHARACTER SETUP:
Young adult woman matching the reference image exactly, consistent facial features, consistent hairstyle, consistent body proportions, consistent clothing throughout the entire video, stylish traveler outfit, carrying a modern suitcase, natural expressions, elegant posture, confident yet relaxed travel mood, realistic walking motion, authentic interactions with surroundings.

CAMERA SETUP:
Cinematic camera only.
Shot on ARRI Alexa Mini LF look.
4K HDR.
24fps.
Anamorphic cinematic look.
Natural motion blur.
Smooth gimbal movement.
Slow dolly shots.
Crane movements.
Tracking shots.
No handheld shake.
No abrupt cuts.
Professional travel commercial style.

LIGHTING PROGRESSION:
Arrival airport: bright clean daylight.
Restaurant: warm golden indoor lighting.
Shopping mall: vibrant commercial lighting.
Coffee shop: blue-hour transition with neon reflections.
Hotel: elegant ambient lighting.
Rooftop: cinematic Tokyo night glow with soft rim light.

SCENE:
Create a complete 10-second cinematic video using the storyboard below. Maintain the same female character throughout all scenes.

SHOT 1 (0.0s–1.2s)
The woman arrives at Haneda Airport, pulling her suitcase through the arrival hall. Travelers pass naturally around her. Smooth tracking shot following her movement.

SHOT 2 (1.2s–2.4s)
She exits the airport and pauses briefly while looking toward the Tokyo skyline. Slow dolly forward reveal of the city atmosphere.

SHOT 3 (2.4s–3.6s)
Inside an authentic Japanese restaurant, she sits and enjoys a traditional Japanese meal. Warm lantern lighting, elegant food presentation, cinematic orbit camera.

SHOT 4 (3.6s–4.8s)
She walks through a modern Tokyo shopping mall, observing storefronts and displays. Smooth gimbal tracking through the corridor.

SHOT 5 (4.8s–6.0s)
She continues shopping and walks confidently carrying shopping bags. Shallow depth of field with premium luxury atmosphere.

SHOT 6 (6.0s–7.2s)
Night begins. She sits at a cozy café beside a large window, enjoying a cup of coffee while neon Tokyo streets glow outside. Gentle push-in camera movement.

SHOT 7 (7.2s–8.4s)
She arrives at a luxury hotel and walks through the elegant lobby toward the rooftop area. Smooth follow shot with sophisticated ambiance.

SHOT 8 (8.4s–10.0s)
Final hero shot. The woman stands on a rooftop terrace overlooking the breathtaking Tokyo skyline at night. Slow crane-up and pull-back reveal, city lights sparkling across the horizon, cinematic ending, luxury travel advertisement quality.

MOOD KEYWORDS:
cinematic, travel lifestyle, elegant, luxury tourism, wanderlust, inspiring, immersive, sophisticated, authentic Japan, premium commercial

AUDIO TONE:
Emotional cinematic travel music, soft piano, atmospheric ambient textures, subtle city ambience, uplifting crescendo toward the final rooftop hero shot." \
  "seedance" \
  "[cinematic, travel, luxury, japan, tokyo]" \
  "Calira" \
  "https://twitter.com/CaliraVal/status/2060658626394759495" \
  "2026-05-30"

# Tweet 3: ChatGPT Image to Seedance Anime Storyboard
process_tweet \
  "2060726191984918810" \
  "2060726191984918810-chatgpt-image-seedance-anime-storyboard" \
  "ChatGPT Image to Seedance Anime Storyboard" \
  "creating anime with AI is crazy now. I used ChatGPT Image 2.0 to design a full anime short film storyboard. Then Seedance 2.0 turned it into a cinematic animated scene in minutes. Step by step tutorial with prompts in the linked post." \
  "seedance" \
  "[anime, storyboard, cinematic, image-to-video, tutorial]" \
  "Abhishek" \
  "https://twitter.com/HeyAbhishek/status/2060726191984918810" \
  "2026-05-30"

# Tweet 4: Cute Brand Character Animation
process_tweet \
  "2060633848723939590" \
  "2060633848723939590-cute-brand-character-animation" \
  "Cute Brand Character Animation" \
  "Wish to animate them all just like I did? Here is the prompt: Animate them all doing their own work, and at the end they come together saying: Hello, we are the cute version of Your Brand Name..." \
  "seedance" \
  "[3d, animation, character, ip-design, cute]" \
  "Future AI" \
  "https://twitter.com/FutureVibesAi/status/2060633848723939590" \
  "2026-05-30"

# Tweet 5: FPV Drone Dinosaur World Flight
process_tweet \
  "2060541144216600964" \
  "2060541144216600964-fpv-drone-dinosaur-world-flight" \
  "FPV Drone Dinosaur World Flight" \
  "Ultra-fast FPV drone flight through a prehistoric dinosaur world.

POV:
Pure first-person FPV drone perspective.
The camera is permanently attached to the drone and fully synchronized with its movement.
No third-person shots.
No external camera angles.
No perspective changes.

Main Subject:
Dinosaurs are the primary visual focus of the entire flight.

Scene:
Ancient Earth during the Late Cretaceous period.
A vast prehistoric ecosystem filled with gigantic dinosaurs.

Visible dinosaurs include:
Tyrannosaurus rex,
Triceratops,
Brachiosaurus,
Apatosaurus,
Ankylosaurus,
Velociraptors,
Pteranodons,
Parasaurolophus.

Large herds of dinosaurs move naturally across forests, plains, rivers, cliffs, and volcanic terrain.

Flight Path:
The drone starts at the designated start location and follows the route shown in the reference image.
Throughout the flight, the drone repeatedly interacts with dinosaurs:
* flies directly toward a massive Tyrannosaurus rex and narrowly avoids it
* races between the legs of gigantic sauropods
* skims just above a herd of running Triceratops
* passes beside charging dinosaurs at high speed
* flies underneath enormous dinosaur necks and tails
* follows migrating dinosaur herds across open plains
* dodges flying Pteranodons in the sky
* flies through a dense prehistoric jungle filled with dinosaurs
* repeatedly performs close fly-bys only a few meters from dinosaurs
The dinosaurs appear extremely large in frame and dominate the scenery.

Flight Behavior:
Extreme FPV racing drone speed.
Aggressive acceleration.
Sharp turns.
Rapid dives.
Steep climbs.
Low-altitude terrain hugging.
Continuous forward motion.

Final Sequence:
The landscape gradually transitions into an active volcanic region populated by dinosaurs.
The drone flies through the volcanic valley at maximum speed.
It approaches the giant volcano and dives directly into the crater without slowing down.

Camera:
Single continuous shot.
One uninterrupted take.
No cuts.
No transitions.
Strong sensation of speed.
Realistic FPV vibrations.
Natural motion blur.

Style:
Photorealistic.
Live-action cinematic realism.
Documentary-quality prehistoric world.
Epic scale.
Ultra detailed.
4K.
HDR.
Volumetric lighting.
Atmospheric depth.

Negative Prompt:
No map.
No route lines.
No red lines.
No text.
No captions.
No HUD.
No UI.
No waypoint markers.
No third-person view.
No camera switching.
No hovering.
No slow flight.
No game graphics.
No cartoon dinosaurs.
No toy dinosaurs.
No low-detail creatures." \
  "seedance" \
  "[fpv, drone, dinosaur, prehistoric, cinematic]" \
  "tanabe" \
  "https://twitter.com/tanabe_fragm/status/2060541144216600964" \
  "2026-05-30"

echo "All 5 tweets processed successfully!"

# Clean up temp directories
rm -rf "$BASE/temp/2060412949223866821"
rm -rf "$BASE/temp/2060658626394759495"
rm -rf "$BASE/temp/2060726191984918810"
rm -rf "$BASE/temp/2060633848723939590"
rm -rf "$BASE/temp/2060541144216600964"
echo "Temp directories cleaned"