// Each story: { text, musicPrompt, sfxPrompt }
// Word counts calibrated per mood speed for target durations:
//   short ~15-20s, medium ~30-35s, long ~50-55s

export const STORIES = {
  // RELAX — speed 0.85 → short ~34w, medium ~63w, long ~103w
  relax: {
    short: [
      {
        text: "Close your eyes. Feel the warmth of sunlight on your skin. A gentle breeze touches your face. Let every thought dissolve. You are safe. You are still.",
        musicPrompt: "Gentle ambient piano with soft warm pads, very slow tempo, calming and meditative, no drums",
        sfxCues: [
          { at: 0.05, prompt: "Single deep relaxing breath inhale and slow exhale, close and intimate", duration: 3 },
          { at: 0.35, prompt: "Warm sunlight shimmer, soft bright tonal whoosh, gentle and brief", duration: 2 },
          { at: 0.65, prompt: "Single gentle breeze gust through grass, soft and passing", duration: 3 },
        ],
      },
      {
        text: "A gentle breeze moves through a quiet garden. Water trickles over smooth stones nearby. Your shoulders drop. Your breath slows. This moment is yours.",
        musicPrompt: "Soft acoustic guitar arpeggios with warm reverb and subtle string pads, peaceful",
        sfxCues: [
          { at: 0.1, prompt: "Gentle wind rustling through garden leaves, soft and brief", duration: 3 },
          { at: 0.4, prompt: "Water trickling over smooth stones, single gentle splash", duration: 2 },
          { at: 0.75, prompt: "Slow deep breath exhale, peaceful and releasing", duration: 3 },
        ],
      },
      {
        text: "Imagine sinking into a warm bath. The water holds you. Steam rises softly. Every muscle releases. There is nothing to do but float here, weightless.",
        musicPrompt: "Warm ambient pads with soft reverb and gentle melodic bells, spa-like atmosphere",
        sfxCues: [
          { at: 0.1, prompt: "Body slowly sinking into warm bathwater, gentle water displacement and soft splash", duration: 3 },
          { at: 0.45, prompt: "Single water droplet falling into still bath, echoing in tiled room", duration: 2 },
          { at: 0.8, prompt: "Soft contented sigh, relaxed and peaceful", duration: 2 },
        ],
      },
    ],
    medium: [
      {
        text: "Imagine a quiet garden at sunset. The air is warm and still. Flowers sway gently as golden light spills across the stone path. You sit on a wooden bench, close your eyes, and feel every muscle slowly release. There is nowhere to be. Nothing to do. Just this moment, stretching out before you like a calm sea.",
        musicPrompt: "Gentle ambient piano with soft warm pads, slow tempo, calming, sunset garden mood",
        sfxCues: [
          { at: 0.05, prompt: "Distant church bell ringing once at sunset, warm and resonant", duration: 4 },
          { at: 0.25, prompt: "Gentle rustling of flower petals in a light breeze", duration: 3 },
          { at: 0.5, prompt: "Wooden bench creaking softly as someone sits down", duration: 2 },
          { at: 0.8, prompt: "Long slow exhale breath, deeply relaxed", duration: 3 },
        ],
      },
      {
        text: "You lie in a hammock between two old oak trees. A soft breeze carries the scent of jasmine. Nearby, a stream whispers over smooth stones. Your breathing slows. Your thoughts drift like clouds across a pale blue sky. The hammock sways gently. You are held. You are at peace.",
        musicPrompt: "Slow ambient harp with ethereal pads and gentle wind chimes, deeply calming",
        sfxCues: [
          { at: 0.1, prompt: "Hammock rope creaking gently as it sways between trees", duration: 3 },
          { at: 0.35, prompt: "Soft breeze carrying floral scent, gentle whoosh through leaves", duration: 3 },
          { at: 0.6, prompt: "Stream water bubbling over smooth stones, single gentle moment", duration: 3 },
          { at: 0.85, prompt: "Single bird call, soft and distant, peaceful", duration: 2 },
        ],
      },
      {
        text: "Picture a small cabin by a lake. Rain taps softly on the roof. Inside, a fire crackles. You wrap yourself in a thick blanket and watch raindrops trace lines down the window. The world outside fades. All that remains is warmth, the sound of rain, and the comfort of having nowhere else to be.",
        musicPrompt: "Warm cello melody with soft piano, slow and contemplative, cozy cabin mood",
        sfxCues: [
          { at: 0.05, prompt: "Rain starting to tap on a wooden roof, first few drops", duration: 3 },
          { at: 0.3, prompt: "Fireplace log cracking and popping with warm crackle", duration: 3 },
          { at: 0.55, prompt: "Thick wool blanket being pulled and wrapped, soft fabric sound", duration: 2 },
          { at: 0.8, prompt: "Single raindrop sliding down window glass, quiet and intimate", duration: 2 },
        ],
      },
    ],
    long: [
      {
        text: "You walk barefoot along a forest trail at golden hour. Moss cushions every step, cool and soft beneath your feet. Sunlight filters through the canopy in soft beams that dance across the ground. Birds sing far above, their melodies weaving through the branches. With each breath, you feel lighter. The scent of pine fills your lungs and settles deep in your chest. A small clearing opens ahead, where wildflowers sway in a gentle breeze. You sit down on the soft grass and lean back against a fallen log. The bark is warm from the afternoon sun. Patches of blue sky drift between the leaves. A butterfly lands nearby, resting in the golden light. There is no hurry. No place to be. The forest holds you gently, asking nothing in return. You close your eyes and let the sounds of nature wash over you.",
        musicPrompt: "Ambient nature-inspired soundscape with soft synth pads and gentle melodic bells, forest meditation",
        sfxCues: [
          { at: 0.05, prompt: "Bare feet stepping softly on moss and forest floor, gentle footsteps", duration: 3 },
          { at: 0.2, prompt: "Bird singing a melodic phrase high in the canopy, clear and beautiful", duration: 4 },
          { at: 0.4, prompt: "Deep breath inhaling pine-scented forest air, slow and satisfying", duration: 3 },
          { at: 0.6, prompt: "Sitting down on soft grass with gentle rustling, settling in", duration: 2 },
          { at: 0.8, prompt: "Butterfly wings fluttering very softly, delicate and close", duration: 2 },
          { at: 0.95, prompt: "Gentle wind through leaves, peaceful forest exhale", duration: 4 },
        ],
      },
      {
        text: "A quiet beach stretches before you at dawn. The sand is cool beneath your feet, still holding the calm of night. Waves arrive in slow, steady rhythms, each one washing a little further up the shore before retreating in a soft whisper. You walk along the water's edge, letting the tide brush your toes. Shells glint in the early light, scattered like small treasures across the sand. The horizon glows pink and amber as the sun begins its slow ascent. A warm breeze carries the faint scent of salt. You find a smooth rock, sit down, and watch the sun climb higher into the pale sky. Seagulls drift overhead in lazy circles, calling softly to one another. The world feels unhurried. Peace fills every corner of your mind. You breathe deeply and let the rhythm of the waves carry your thoughts out to sea.",
        musicPrompt: "Soft acoustic guitar with warm reverb and ocean-inspired pads, peaceful dawn atmosphere",
        sfxCues: [
          { at: 0.05, prompt: "Bare feet on cool morning sand, soft crunching steps", duration: 3 },
          { at: 0.2, prompt: "Single ocean wave washing up shore and retreating, gentle and rhythmic", duration: 5 },
          { at: 0.4, prompt: "Small seashell being picked up from wet sand, tiny clink", duration: 2 },
          { at: 0.55, prompt: "Warm morning breeze gust carrying salt air, soft whoosh", duration: 3 },
          { at: 0.75, prompt: "Seagull calling softly in the distance, single cry", duration: 3 },
          { at: 0.9, prompt: "Deep peaceful breath by the ocean, slow exhale", duration: 3 },
        ],
      },
    ],
  },

  // FOCUS — speed 0.95 → short ~38w, medium ~71w, long ~115w
  focus: {
    short: [
      {
        text: "Your mind is clear. One task sits before you, sharp and obvious. You begin. Each thought connects to the next like stepping stones. Distractions dissolve. Your hands move with purpose. This is flow.",
        musicPrompt: "Minimal lo-fi beat with soft Rhodes piano chords, steady gentle rhythm, study music",
        sfxCues: [
          { at: 0.1, prompt: "Pen clicking once, sharp and decisive", duration: 2 },
          { at: 0.5, prompt: "Keyboard keys typing a short burst, focused and rhythmic", duration: 3 },
          { at: 0.85, prompt: "Page turning in a notebook, crisp paper sound", duration: 2 },
        ],
      },
      {
        text: "Take a breath. Set your intention. The noise fades. What remains is clarity, purpose, and the quiet power of a focused mind. You begin. One step. Then another. Momentum builds naturally.",
        musicPrompt: "Clean ambient electronic with subtle pulse and soft pad layers, minimal and focused",
        sfxCues: [
          { at: 0.05, prompt: "Deep focused breath inhale, intentional and clear", duration: 3 },
          { at: 0.4, prompt: "Soft mechanical click, like a switch being turned on", duration: 2 },
          { at: 0.75, prompt: "Footstep on hard floor, single confident step forward", duration: 2 },
        ],
      },
      {
        text: "Imagine a single flame in a dark room. Steady. Unwavering. That flame is your attention. Everything outside its glow falls away into shadow. There is only the light and the work before you.",
        musicPrompt: "Gentle downtempo beat with muted piano and warm bass, steady and unobtrusive",
        sfxCues: [
          { at: 0.1, prompt: "Match striking and lighting with a small flame whoosh", duration: 2 },
          { at: 0.5, prompt: "Candle flame flickering steadily, soft warm crackle", duration: 3 },
          { at: 0.85, prompt: "Soft ambient room tone settling into silence", duration: 3 },
        ],
      },
    ],
    medium: [
      {
        text: "Your desk is clear. Your mind is sharp. A single task sits before you with perfect clarity. Each thought connects to the next like links in a chain. Your fingers find the keyboard and begin to move. Distractions try to form but dissolve before they take shape. The rhythm of your work becomes steady, almost musical. You are in the zone — precise, calm, unstoppable.",
        musicPrompt: "Minimal lo-fi hip hop beat with soft Rhodes piano, steady rhythm, warm and focused",
        sfxCues: [
          { at: 0.05, prompt: "Coffee mug being set down on a wooden desk, gentle ceramic thud", duration: 2 },
          { at: 0.3, prompt: "Keyboard typing burst, rhythmic and confident", duration: 3 },
          { at: 0.6, prompt: "Mouse click, single precise click", duration: 2 },
          { at: 0.85, prompt: "Satisfied quiet exhale, focused and content", duration: 2 },
        ],
      },
      {
        text: "Imagine your mind as a beam of light. Scattered rays begin to converge into one brilliant point. Every idea sharpens. Every decision becomes obvious. The clutter falls away and what remains is signal, pure and clear. You move through your work with quiet confidence. No hesitation. No second-guessing. Just forward motion, steady and sure.",
        musicPrompt: "Soft jazzy lo-fi beat with vinyl crackle and mellow keys, concentration music",
        sfxCues: [
          { at: 0.1, prompt: "Soft light switch click, illuminating", duration: 2 },
          { at: 0.35, prompt: "Pen writing on paper, smooth and deliberate strokes", duration: 3 },
          { at: 0.65, prompt: "Book page turning crisply, focused reading", duration: 2 },
          { at: 0.9, prompt: "Confident footstep forward on hard floor", duration: 2 },
        ],
      },
      {
        text: "You sit in a quiet room. The clock ticks steadily. Your fingers move across the keyboard with purpose. Each line, each word falls into place like pieces of a puzzle. Time stretches. An hour feels like ten minutes. There is only the work and the deep satisfaction of doing it well. This is flow.",
        musicPrompt: "Minimal techno-ambient with slow evolving textures and steady soft kick, deep focus",
        sfxCues: [
          { at: 0.05, prompt: "Clock ticking three times, steady and rhythmic", duration: 3 },
          { at: 0.3, prompt: "Keyboard typing, focused burst of keys", duration: 3 },
          { at: 0.6, prompt: "Puzzle piece clicking into place, satisfying snap", duration: 2 },
          { at: 0.9, prompt: "Deep satisfied breath, flow state achieved", duration: 3 },
        ],
      },
    ],
    long: [
      {
        text: "Picture a mountain climber on a clear morning. The air is crisp and thin. Each handhold is deliberate. Each step is measured. There is no rush — only steady upward progress. The valley below grows smaller with every move. Clouds drift far beneath. The climber does not look down. Eyes forward, breath steady, one move at a time. The rock is solid beneath your fingers. Your grip is sure. That climber is you, and the summit is your goal for today. You can see it clearly now. The path is hard but simple. Each step is obvious once you commit. Doubt has no place here on the mountain. The wind carries it away. And you are ready. You have always been ready. One more step. Then another. The summit draws closer.",
        musicPrompt: "Clean ambient electronic with building layers, subtle pulse, minimal and focused, ascending energy",
        sfxCues: [
          { at: 0.05, prompt: "Crisp mountain morning breath, cold air inhale", duration: 3 },
          { at: 0.2, prompt: "Hand gripping rock face, solid stone scrape", duration: 2 },
          { at: 0.4, prompt: "Boot stepping firmly on mountain ledge, confident placement", duration: 2 },
          { at: 0.6, prompt: "Wind gust at high altitude, powerful but brief", duration: 3 },
          { at: 0.8, prompt: "Eagle cry in the distance, soaring and free", duration: 3 },
          { at: 0.95, prompt: "Final step onto summit, gravel crunch with triumphant wind", duration: 3 },
        ],
      },
      {
        text: "Your workspace is your sanctuary. The door closes and the noise stays outside. Here, there is only the task and your ability to complete it. You take a deep breath and set your intention. The screen glows softly. Your hands find their rhythm. Ideas arrive in a steady stream — each one clear, each one useful. Minutes pass unnoticed. The work builds on itself, layer by layer. You are not forcing anything. Focus arrived naturally, like a river finding its course. And now you ride it, carried forward by effortless concentration. Each completed step fuels the next. Your thoughts align like compass needles pointing north. The outside world can wait. This hour belongs to you and the work that matters. Your fingers move with quiet certainty. Nothing else exists.",
        musicPrompt: "Gentle downtempo beat with muted piano and warm bass, building slowly, deep work sanctuary",
        sfxCues: [
          { at: 0.05, prompt: "Door closing softly, shutting out the world", duration: 2 },
          { at: 0.15, prompt: "Deep intentional breath, setting focus", duration: 3 },
          { at: 0.35, prompt: "Computer screen humming to life, soft electronic glow", duration: 2 },
          { at: 0.55, prompt: "Keyboard typing in steady rhythm, productive flow", duration: 4 },
          { at: 0.75, prompt: "Coffee cup being lifted and sipped, warm ceramic", duration: 2 },
          { at: 0.9, prompt: "Pen checking off a completed task, satisfying scratch", duration: 2 },
        ],
      },
    ],
  },

  // ENERGY — speed 1.1 → short ~44w, medium ~82w, long ~133w
  energy: {
    short: [
      {
        text: "The sun breaks through the clouds and hits your face. Electricity runs through your veins. Your heart beats strong and steady. Today is your day. Every step shakes the ground. Every word carries thunder. You are unstoppable.",
        musicPrompt: "Upbeat electronic track with driving synth bass and energetic drums, motivational",
        sfxCues: [
          { at: 0.05, prompt: "Dramatic sunlight breakthrough, bright warm whoosh with sparkle", duration: 3 },
          { at: 0.4, prompt: "Powerful heartbeat thumping twice, deep and strong", duration: 3 },
          { at: 0.8, prompt: "Thunder crack in the distance, powerful and rolling", duration: 4 },
        ],
      },
      {
        text: "You wake up and your feet hit the floor with purpose. Coffee tastes better. Ideas come fast, one after another, like sparks from a fire. Energy flows through you like a river breaking through a dam. Today, you dominate.",
        musicPrompt: "High energy drum and bass with soaring synth leads and punchy kicks, adrenaline",
        sfxCues: [
          { at: 0.05, prompt: "Feet hitting floor with impact, powerful morning wake up", duration: 2 },
          { at: 0.35, prompt: "Coffee being poured into mug, energetic liquid splash", duration: 2 },
          { at: 0.7, prompt: "Dam breaking with rushing water, powerful energy release", duration: 4 },
        ],
      },
      {
        text: "A deep breath fills your lungs. Your fists clench. Your eyes open wide. The fire inside you roars to life. It burns away doubt. It burns away hesitation. What remains is pure, unstoppable force. Let's go.",
        musicPrompt: "Powerful orchestral hybrid with epic percussion and rising brass, cinematic motivation",
        sfxCues: [
          { at: 0.05, prompt: "Deep powerful breath inhale, filling lungs completely", duration: 3 },
          { at: 0.4, prompt: "Fire roaring to life, intense flames whooshing", duration: 3 },
          { at: 0.85, prompt: "Explosive energy burst, like a rocket igniting with power", duration: 3 },
        ],
      },
    ],
    medium: [
      {
        text: "The sun breaks through the clouds and hits your face like a call to action. You feel electricity run through your entire body. Your spine straightens. Your chin lifts. Today is your day, and you feel it in every cell. Every step is powerful. Every word carries weight. The world is full of obstacles, and you welcome every one. Because obstacles are just puzzles, and you love puzzles. You are unstoppable.",
        musicPrompt: "Upbeat electronic track with driving synth bass and energetic drums, building energy",
        sfxCues: [
          { at: 0.05, prompt: "Clouds parting with dramatic light breakthrough, cinematic whoosh", duration: 3 },
          { at: 0.25, prompt: "Electric static crackle, energy surging through body", duration: 2 },
          { at: 0.5, prompt: "Powerful confident footstep on pavement, impactful", duration: 2 },
          { at: 0.75, prompt: "Obstacle smashing, breaking through a barrier with force", duration: 3 },
          { at: 0.95, prompt: "Triumphant power surge, rising energy whoosh", duration: 3 },
        ],
      },
      {
        text: "Imagine standing at the starting line. Your heart pounds like a war drum. Your muscles coil with potential energy. The crowd falls silent. Time slows down. You hear your own breathing, deep and steady. Then the signal fires and you launch forward with everything you have. Wind rushes past your ears. The ground blurs beneath your feet. You are speed. You are strength. Nothing can slow you down.",
        musicPrompt: "Fast-paced indie rock with driving guitars and energetic drums, uplifting and bold",
        sfxCues: [
          { at: 0.05, prompt: "Crowd murmuring with anticipation, building tension", duration: 3 },
          { at: 0.2, prompt: "Deep powerful heartbeat, war drum rhythm", duration: 3 },
          { at: 0.4, prompt: "Crowd falling silent, dramatic tension pause", duration: 2 },
          { at: 0.5, prompt: "Starting gun firing, sharp crack with echo", duration: 2 },
          { at: 0.7, prompt: "Wind rushing past ears at high speed, adrenaline whoosh", duration: 3 },
          { at: 0.9, prompt: "Rapid powerful footsteps on track, sprinting at full speed", duration: 3 },
        ],
      },
      {
        text: "Picture a thunderstorm of creativity inside your mind. Dark clouds of potential gather and swirl. Then lightning strikes — a brilliant idea, sharp and electric. Rolling thunder of motivation follows, shaking loose every doubt. The rain washes away fear and the voice that says you cannot. What remains is pure, raw, crackling energy — ready to be channeled into something extraordinary. You are the storm.",
        musicPrompt: "Uplifting future bass with bright chords and powerful drops, festival energy",
        sfxCues: [
          { at: 0.1, prompt: "Dark storm clouds gathering, low rumbling wind building", duration: 4 },
          { at: 0.35, prompt: "Lightning strike, sharp electric crack with bright flash", duration: 2 },
          { at: 0.5, prompt: "Deep rolling thunder, powerful and shaking", duration: 4 },
          { at: 0.7, prompt: "Heavy rain pouring down, washing and cleansing", duration: 3 },
          { at: 0.9, prompt: "Electric crackling energy, raw power surging", duration: 3 },
        ],
      },
    ],
    long: [
      {
        text: "You stand on a rooftop at sunrise. The city stretches below, full of possibility. Lights flicker in a thousand windows. Cars begin to move. The world is waking up, and you are already ahead of it. You take a deep breath and feel power fill your lungs. Your mind races — not with anxiety, but with excitement. Ideas collide and spark. Plans crystallize. Today you build something that matters. Today you create something that lasts. Today you move mountains — not because anyone asked, but because you can. You turn from the edge, walk to the door, and step into the day like you own every second of it.",
        musicPrompt: "Powerful orchestral hybrid with epic percussion, rising brass, and electronic elements, cinematic sunrise",
        sfxCues: [
          { at: 0.05, prompt: "Rooftop door opening to morning wind, dramatic reveal", duration: 3 },
          { at: 0.15, prompt: "City waking up below, distant car horns and movement starting", duration: 4 },
          { at: 0.35, prompt: "Deep powerful breath on rooftop, wind in face", duration: 3 },
          { at: 0.55, prompt: "Ideas sparking, electric crackle of inspiration", duration: 2 },
          { at: 0.75, prompt: "Mountain moving, deep rumble of earth shifting with power", duration: 4 },
          { at: 0.9, prompt: "Door opening confidently, stepping into the day with impact", duration: 3 },
        ],
      },
      {
        text: "The alarm goes off and you are already awake. Not groggy. Not reluctant. Alive. Your feet hit the cold floor and it feels like a starting gun. Coffee brews while you stretch. Music plays — something with a beat that matches your heartbeat. You look at your to-do list and smile. Not because it is easy, but because you are ready. Each task is a challenge you chose. Each obstacle is a puzzle you will solve. By the time the world catches up, you will already be three steps ahead. This is your day. Claim it with both hands.",
        musicPrompt: "High energy electronic with building layers, driving bass, and triumphant synth leads, morning anthem",
        sfxCues: [
          { at: 0.05, prompt: "Alarm clock buzzing briefly then being slapped off, energetic", duration: 2 },
          { at: 0.15, prompt: "Feet hitting cold floor with impact, like a starting gun crack", duration: 2 },
          { at: 0.3, prompt: "Coffee machine brewing with steam hiss, morning energy", duration: 3 },
          { at: 0.5, prompt: "Paper list being unfolded, crisp and ready", duration: 2 },
          { at: 0.7, prompt: "Hands clapping together once, let's do this energy", duration: 2 },
          { at: 0.9, prompt: "Door bursting open to city sounds, stepping out with power", duration: 3 },
        ],
      },
    ],
  },

  // SLEEP — speed 0.75 → short ~30w, medium ~56w, long ~91w
  sleep: {
    short: [
      {
        text: "Stars appear one by one. Your eyelids grow heavy. Each breath takes you deeper. The universe hums a lullaby just for you. You are safe. You are warm.",
        musicPrompt: "Dreamy ambient soundscape with very slow evolving pads and soft celestial tones, sleep music",
        sfxCues: [
          { at: 0.1, prompt: "Soft magical sparkle, like a star appearing in the sky", duration: 2 },
          { at: 0.45, prompt: "Very slow deep breath, sleepy and heavy", duration: 3 },
          { at: 0.8, prompt: "Gentle cosmic hum, deep and warm, like the universe singing", duration: 4 },
        ],
      },
      {
        text: "Soft sheets surround you. Warm darkness fills the room. Your body sinks into the mattress. Thoughts dissolve like snowflakes on warm skin. Sleep arrives gently.",
        musicPrompt: "Ultra-slow piano notes with long reverb tails and warm drone, lullaby ambient",
        sfxCues: [
          { at: 0.1, prompt: "Soft sheets rustling as body settles in, cozy fabric sound", duration: 3 },
          { at: 0.5, prompt: "Body sinking into soft mattress, gentle compression", duration: 2 },
          { at: 0.85, prompt: "Very soft sleepy exhale, drifting off", duration: 3 },
        ],
      },
      {
        text: "You float on still water under a sky full of stars. The water is warm. There is no sound, no movement. You are weightless. Dreams begin at the edges.",
        musicPrompt: "Deep space ambient with very slow tones and subtle shimmer, weightless and calm",
        sfxCues: [
          { at: 0.1, prompt: "Body gently entering warm still water, soft splash", duration: 3 },
          { at: 0.5, prompt: "Water lapping very softly against floating body, barely audible", duration: 3 },
          { at: 0.85, prompt: "Dreamy shimmer sound, like stars twinkling, ethereal", duration: 3 },
        ],
      },
    ],
    medium: [
      {
        text: "The stars appear one by one in a velvet sky. You lie in a field of soft grass. The constellations turn slowly overhead. Your eyelids grow heavy. Each breath takes you deeper into comfort. The grass is soft as any bed. The universe hums a lullaby, low and gentle, meant only for you.",
        musicPrompt: "Dreamy ambient soundscape with slow evolving pads and celestial tones, starfield sleep",
        sfxCues: [
          { at: 0.05, prompt: "Soft magical sparkle, star appearing in night sky", duration: 2 },
          { at: 0.25, prompt: "Body lying down in soft grass, gentle rustling", duration: 3 },
          { at: 0.5, prompt: "Slow heavy eyelids closing, soft facial movement", duration: 2 },
          { at: 0.75, prompt: "Distant owl hooting once, soft and dreamy", duration: 3 },
          { at: 0.9, prompt: "Deep cosmic hum, warm lullaby vibration", duration: 4 },
        ],
      },
      {
        text: "You float on a calm, warm sea under a canopy of stars. The water supports you perfectly. Gentle currents rock you slowly, back and forth. Your thoughts dissolve into the darkness. Sleep arrives like a soft wave rolling in from far away, carrying you to a place of deep rest.",
        musicPrompt: "Gentle harp notes with warm analog pad swells, extremely slow, ocean night sleep",
        sfxCues: [
          { at: 0.1, prompt: "Body settling into warm water, gentle buoyant splash", duration: 3 },
          { at: 0.35, prompt: "Gentle water current rocking, soft rhythmic lapping", duration: 4 },
          { at: 0.6, prompt: "Thoughts dissolving, soft ethereal shimmer fading away", duration: 3 },
          { at: 0.85, prompt: "Soft distant wave rolling in slowly, carrying to sleep", duration: 5 },
        ],
      },
      {
        text: "A quiet room. Soft sheets. Moonlight seeps through the curtains. Your body sinks into the mattress. Every worry melts away like snow in spring. Your breathing deepens. Your mind grows quiet. Dreams begin to form at the edges, soft shapes and warm colors.",
        musicPrompt: "Soft music box melody with gentle ambient pads, nursery dreamscape, moonlit bedroom",
        sfxCues: [
          { at: 0.05, prompt: "Curtain swaying gently, soft fabric movement with moonlight", duration: 3 },
          { at: 0.3, prompt: "Body sinking into soft mattress, gentle settling", duration: 2 },
          { at: 0.55, prompt: "Ice melting, soft dripping like worries dissolving", duration: 3 },
          { at: 0.8, prompt: "Dreamy music box note, single gentle chime", duration: 3 },
        ],
      },
    ],
    long: [
      {
        text: "Imagine walking through a field of lavender at twilight. Purple flowers brush against your hands as you move slowly forward. The air is sweet and heavy with fragrance. With each step, you feel sleepier. The sky deepens from amber to indigo, and the first stars begin to appear. Fireflies glow in the distance, drifting like tiny lanterns through the warm evening air. The path beneath your feet is soft and worn. At the end of the field, beneath an old oak tree, a soft bed waits. White sheets glow in the moonlight. You lie down and pull the covers close. The lavender scent wraps around you like a blanket. The branches sway above you, whispering ancient lullabies. Crickets sing their quiet song. The night embraces you completely, and sleep comes easily, carrying you into gentle dreams.",
        musicPrompt: "Ultra-slow piano with long reverb and warm drone, lullaby ambient, lavender twilight",
        sfxCues: [
          { at: 0.05, prompt: "Soft footsteps through lavender field, gentle plant brushing", duration: 3 },
          { at: 0.2, prompt: "Deep breath inhaling sweet lavender fragrance, slow and dreamy", duration: 3 },
          { at: 0.35, prompt: "Soft magical sparkle, firefly glowing in warm air", duration: 2 },
          { at: 0.55, prompt: "Soft sheets being pulled back, gentle fabric rustle", duration: 2 },
          { at: 0.7, prompt: "Oak tree branches swaying, ancient wood creaking softly", duration: 4 },
          { at: 0.9, prompt: "Single cricket beginning its lullaby song, soft and rhythmic", duration: 4 },
        ],
      },
      {
        text: "A train moves slowly through a snowy landscape at night. You sit by the window, wrapped in a thick blanket, watching the world pass in silence. The rhythmic clatter of wheels on the tracks creates a perfect lullaby. Snowflakes drift past the glass, catching the pale light from inside the cabin. The compartment is warm and dim. Soft shadows dance on the walls as the train sways. A cup of chamomile tea steams beside you on the small wooden table. You take a sip and feel warmth spread through your chest and into your limbs. Your eyelids grow heavy. The snow-covered trees outside blur into soft white shapes. Your eyes close. The train rocks gently, steadily, like a cradle. The world outside disappears. The journey continues in your dreams, carrying you deeper into peaceful sleep.",
        musicPrompt: "Soft music box with gentle ambient pads and warm swells, train journey lullaby, snowy night",
        sfxCues: [
          { at: 0.05, prompt: "Train wheels beginning to clatter on tracks, rhythmic and steady", duration: 4 },
          { at: 0.2, prompt: "Blanket being wrapped around shoulders, warm cozy fabric", duration: 2 },
          { at: 0.35, prompt: "Snowflakes tapping softly against train window glass", duration: 3 },
          { at: 0.5, prompt: "Hot tea being sipped from ceramic cup, warm liquid sound", duration: 2 },
          { at: 0.7, prompt: "Distant train whistle, muffled and dreamy through snow", duration: 4 },
          { at: 0.9, prompt: "Train rocking gently like a cradle, soft rhythmic sway", duration: 4 },
        ],
      },
    ],
  },
};
