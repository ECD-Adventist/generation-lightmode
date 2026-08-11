import { Video, ImageIcon, Sparkles } from "lucide-react";

export const CONTENT_TYPES = [
  { id: "video", label: "Video", icon: Video, color: "#00CFFF" },
  { id: "poster", label: "Poster", icon: ImageIcon, color: "#FFD000" },
  { id: "animation", label: "Animation", icon: Sparkles, color: "#8A5CFF" },
];

export const CONTENT_LANGUAGES = [
  "English", "Kiswahili", "French", "Amharic", "Kinyarwanda",
  "Kirundi", "Luganda", "Malagasy", "Arabic", "Other",
];

export const typeMeta = (id) => CONTENT_TYPES.find(t => t.id === id) || CONTENT_TYPES[0];

// Content categories — each maps to the broader content type it belongs to.
export const CONTENT_CATEGORIES = [
  { id: "evangelistic_videos", label: "Evangelistic Videos", type: "video" },
  { id: "testimony_videos", label: "Testimony Videos", type: "video" },
  { id: "bible_study_guides", label: "Bible Study Guides", type: "video" },
  { id: "promotional_posters", label: "Promotional Posters", type: "poster" },
  { id: "quote_cards", label: "Quote Cards", type: "poster" },
  { id: "invitation_cards", label: "Invitation Cards", type: "poster" },
  { id: "motion_graphics_templates", label: "Motion Graphics Templates", type: "animation" },
];

export const categoryMeta = (id) => CONTENT_CATEGORIES.find(c => c.id === id) || null;