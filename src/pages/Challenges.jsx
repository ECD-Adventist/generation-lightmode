import { useState } from "react";
import { Zap, Clock, Users, Star, CheckCircle } from "lucide-react";
import LiveChallengesPage from "@/components/challenges/LiveChallengesPage";

const challenges = [
  {
    id: 1, title: "#LightOverLust", category: "Purity", difficulty: "Warrior",
    duration: "14 Days", participants: 18450, points: 200,
    description: "A purity & identity campaign. Choose Jesus over digital darkness and lust. Reclaim your feed.",
    color: "#00CFFF", badge: "🛡️",
    tasks: ["Day 1: Post your commitment to purity", "Day 7: Fast from social media for 24h", "Day 14: Share a victory testimony"],
  },
  {
    id: 2, title: "#GlowInTheDark", category: "Mental Health", difficulty: "Starter",
    duration: "7 Days", participants: 24200, points: 150,
    description: "Mental health and hope campaign. Be a light for someone struggling with anxiety or depression.",
    color: "#8A5CFF", badge: "🌟",
    tasks: ["Share a verse of hope for the anxious", "Check in on 3 friends privately", "Post a raw testimony of overcoming"],
  },
  {
    id: 3, title: "#FaithOnFridays", category: "Testimony", difficulty: "Starter",
    duration: "Weekly", participants: 45000, points: 50,
    description: "Every Friday, flood the internet with short, authentic testimonies of what God did this week.",
    color: "#FFD000", badge: "🔥",
    tasks: ["Reflect on your week", "Record a 30-sec testimony video", "Post with #FaithOnFridays"],
  },
  {
    id: 4, title: "#LitForLife", category: "Outreach", difficulty: "Trendsetter",
    duration: "30 Days", participants: 12000, points: 300,
    description: "Choosing Jesus over peer pressure. Stand boldly for your values at school and online.",
    color: "#1DA1FF", badge: "⚡",
    tasks: ["Start a GlowGroup at school", "Post your 'Why I Follow Jesus' story", "Invite 2 peers to your GlowGroup"],
  },
  {
    id: 5, title: "Switch It On Summit", category: "Event", difficulty: "Champion",
    duration: "1 Day", participants: 5000, points: 300,
    description: "Attend or host a LightMode gathering in your city. Bring your GlowGroup and celebrate together.",
    color: "#FFD000", badge: "🏆",
    tasks: ["Register your city", "Invite your GlowGroup", "Document your Summit moment"],
  },
  {
    id: 6, title: "GlowDrop Consistency", category: "Devotional", difficulty: "Champion",
    duration: "30 Days", participants: 8500, points: 400,
    description: "Drop a daily 'Glow Drop' — a Bible verse with reflection — for an entire month.",
    color: "#8A5CFF", badge: "📖",
    tasks: ["Create your Glow Drop template", "Post consistently for 30 days", "Earn your Bronze Glow Pin"],
  },
];

const difficultyColors = {
  Starter: "#00CFFF", Warrior: "#1DA1FF", Trendsetter: "#8A5CFF", Champion: "#FFD000"
};

export default function Challenges() {
  return <LiveChallengesPage />;
}