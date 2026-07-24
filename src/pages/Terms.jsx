import React from "react";
import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
  { title: "1. Acceptance of Terms", content: "By accessing or using Generation LightMode, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform." },
  { title: "2. Accounts", content: "You must provide accurate information, keep your account secure, and promptly report unauthorized access. You are responsible for activity performed through your account." },
  { title: "3. Community Participation", content: "Use the platform respectfully and lawfully. Follow our Community Guidelines when posting Glow Drops, messages, prayer requests, comments, or other content." },
  { title: "4. Your Content", content: "You retain ownership of content you create. By posting it, you grant Generation LightMode permission to host, display, reproduce, and distribute it as needed to operate and promote the platform." },
  { title: "5. Prohibited Conduct", content: "Do not harass others, impersonate people, distribute harmful or illegal material, interfere with platform security, or use the service for spam, fraud, or unauthorized commercial activity." },
  { title: "6. Moderation and Termination", content: "We may review, restrict, remove, or preserve content and may suspend or terminate accounts that violate these terms, our guidelines, or applicable law." },
  { title: "7. Service Availability", content: "We work to keep Generation LightMode available and secure, but the platform is provided as available and may change, pause, or experience interruptions." },
  { title: "8. Changes to These Terms", content: "We may update these terms as the platform evolves. Continued use after an update means you accept the revised terms." }
];

export default function Terms() {
  return <LegalDocument title="Terms of Service" summary="These terms explain the rules and responsibilities that apply when you use Generation LightMode." sections={sections} />;
}