import { Play, Headphones, BookOpen } from "lucide-react";

export const mediaItems = [];

export const downloads = [
  {
    category: "Strategy Documents",
    color: "#00CFFF",
    icon: "📘",
    items: [
      {
        title: "Generation LightMode: Faith. Always On.",
        desc: "The official ECD Digital Discipleship Strategy manual — full guide for leaders, youth, and ambassadors.",
        type: "PDF",
        size: "2.4 MB",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/27ca4494b_GENERATIONLIGHTMODE-NEW-2.pdf",
      },
    ],
  },
  {
    category: "Branding & Graphics",
    color: "#8A5CFF",
    icon: "🎨",
    items: [
      {
        title: "GLM Logo (Color Version)",
        desc: "Official Generation LightMode logo — high resolution for print and digital use.",
        type: "PNG",
        size: "1.1 MB",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/e51a96559_GENERATIONLIGHTMODE-LOGO.png",
      },
      {
        title: "GLM Poster Design 1",
        desc: "High-quality promotional poster for events and social media.",
        type: "PNG",
        size: "2.1 MB",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/09b9053aa_GenerationLightMode.png",
      },
      {
        title: "GLM Poster Design 2",
        desc: "Alternative poster layout for campaigns and church displays.",
        type: "PNG",
        size: "1.8 MB",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/4d7820e8f_GenerationLightMode2.png",
      },
      {
        title: "GLM Poster Design 3",
        desc: "Youth-focused campaign poster for social media sharing.",
        type: "PNG",
        size: "1.6 MB",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/b53e576f7_GenerationLightMode3.png",
      },
      {
        title: "GLM Poster Design 4",
        desc: "Movement themed graphic for digital and print distribution.",
        type: "PNG",
        size: "1.9 MB",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/cbd01116b_GenerationLightMode4.png",
      },
    ],
  },
  {
    category: "Toolkits & Templates",
    color: "#FFD000",
    icon: "🛠️",
    items: [
      { title: "LightMode Pledge Card", desc: "Printable pledge card for churches and schools — take the commitment publicly.", type: "Coming Soon", size: "", url: null },
      { title: "Social Media Starter Pack", desc: "Canva-ready templates for Instagram, TikTok, WhatsApp Status, and Facebook.", type: "Coming Soon", size: "", url: null },
      { title: "GlowGroup Leader Guide", desc: "Step-by-step manual for leading a micro-discipleship GlowGroup of 4–6 youth.", type: "Coming Soon", size: "", url: null },
    ],
  },
];

export const typeIcon = { video: Play, podcast: Headphones, devotional: BookOpen };
export const typeColor = { video: "#00CFFF", podcast: "#8A5CFF", devotional: "#FFD000" };
export const categories = ["all"];