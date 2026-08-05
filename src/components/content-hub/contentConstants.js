export const CONTENT_TYPES = [
  { id: "video", label: "Video", emoji: "🎬", color: "#00CFFF" },
  { id: "poster", label: "Poster", emoji: "🖼️", color: "#FFD000" },
  { id: "animation", label: "Animation", emoji: "✨", color: "#8A5CFF" },
];

export const CONTENT_LANGUAGES = [
  "English", "Kiswahili", "French", "Amharic", "Kinyarwanda",
  "Kirundi", "Luganda", "Malagasy", "Arabic", "Other",
];

export const typeMeta = (id) => CONTENT_TYPES.find(t => t.id === id) || CONTENT_TYPES[0];