import React from "react";
import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
  { title: "1. Lead With Respect", content: "Treat every person with dignity. Disagreement is allowed; harassment, bullying, threats, humiliation, and hateful conduct are not." },
  { title: "2. Keep the Community Safe", content: "Do not share content that promotes violence, self-harm, exploitation, illegal activity, or dangerous behavior. Never expose another person’s private information without consent." },
  { title: "3. Share Authentic Content", content: "Post content you created or have permission to use. Do not impersonate others, misrepresent affiliations, manipulate engagement, or knowingly spread false information." },
  { title: "4. Protect Young People", content: "Content that exploits, sexualizes, targets, or endangers minors is strictly prohibited. Report safety concerns immediately using the available reporting tools." },
  { title: "5. Keep Content Appropriate", content: "Do not post explicit sexual content, graphic violence, spam, scams, malicious links, or repeated promotional material that disrupts the community." },
  { title: "6. Faith and Encouragement", content: "Generation LightMode welcomes sincere faith conversations, testimonies, questions, and prayer. Do not use faith as a reason to shame, coerce, threaten, or exclude others." },
  { title: "7. Reporting and Enforcement", content: "Use the report tools when content may violate these guidelines. We may remove content, limit features, or suspend accounts based on severity, context, and repeated violations." },
  { title: "8. Help Us Improve", content: "These guidelines may evolve as the community grows. We welcome constructive feedback that helps keep Generation LightMode safe, uplifting, and trustworthy." }
];

export default function CommunityGuidelines() {
  return <LegalDocument title="Community Guidelines" summary="These guidelines help everyone build a safe, respectful, faith-centered Generation LightMode community." sections={sections} />;
}