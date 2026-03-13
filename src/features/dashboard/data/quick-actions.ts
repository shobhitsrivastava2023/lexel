export interface QuickAction {
  title: string;
  description: string;
  href: string;
  imageSrc: string;
};

export const quickActions: QuickAction[] = [
  {
    title: "Narrate a Story",
    description: "Bring characters to life with expressive AI narration",
    href: "/text-to-speech?text=In a village tucked between mist-covered mountains, there lived an old clockmaker whose clocks never told the right time — but they always told the truth. One rainy evening, a stranger walked in and asked for a clock that could show him his future.",
    imageSrc: "/lexel/voice_4.jpg",
  },
  {
    title: "Record an Ad",
    description: "Create professional advertisements with lifelike AI voices",
    href: "/text-to-speech?text=Introducing BrightBean Coffee — the smoothest roast you'll ever taste. Sourced from high-altitude farms, slow-roasted to perfection, and delivered fresh to your door every single week. Wake up to something extraordinary. Try BrightBean today and get your first bag free.",
    imageSrc: "/lexel/voice3.jpg",
  },
  {
    title: "Direct a Movie Scene",
    description: "Generate dramatic dialogue for film and video",
    href: "/text-to-speech?text=The rain hammered against the window as she turned to face him. You knew, didn't you? she whispered, her voice barely holding together. He stepped forward, jaw clenched. I did what I had to do. The silence between them was louder than the storm outside.",
    imageSrc: "/lexel/voice_5.jpg",
  },
  {
    title: "Voice a Game Character",
    description: "Build immersive worlds with dynamic character voices",
    href: "/text-to-speech?text=Listen up, adventurer. The realm of Ashenvale is crumbling, and the Crystal of Eternity has been shattered into seven pieces. You are the only one who can reassemble it. Gather your courage, sharpen your blade, and meet me at the Gates of Dawn. Time is not on our side.",
    imageSrc: "/lexel/female_voice1jpg.jpg",
  },
  {
    title: "Introduce Your Podcast",
    description: "Hook your listeners from the very first second",
    href: "/text-to-speech?text=Hey everyone, welcome back to another episode of The Curious Mind — the podcast where we dig into the stories, science, and strange ideas that shape our world. I'm your host, and today we have an incredible guest who's going to challenge everything you thought you knew.",
    imageSrc: "/lexel/female_voice2.jpg",
  },
  {
    title: "Guide a Meditation",
    description: "Craft soothing, calming audio for wellness content",
    href: "/text-to-speech?text=Close your eyes and take a deep breath in. Hold it gently... and release. Feel the weight of the day slowly melting away. With each breath, you're sinking deeper into calm. There is nowhere else you need to be. Just here. Just now. Breathe in peace, breathe out tension.",
    imageSrc: "/lexel/voice_6_image.jpg",
  },
];
