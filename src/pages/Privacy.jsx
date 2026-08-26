import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePrivacy from "@/components/privacy/MobilePrivacy";

const sections = [
  {
    title: "1. Who we are and scope",
    content: `Privacy at a glance. Generation LightMode is a faith-based digital community operated by the Communication & Media Department of the East-Central Africa Division of the Seventh-day Adventist Church. This Policy explains what information we collect, why we use it, when it may be shared, and the choices available to you.

This Privacy Policy applies to the Generation LightMode Android application (package com.base69a6fca6155ae283f1b55144.app), the Generation LightMode website, and related services, features, communications, and administrative tools (together, the “Service”).

The Android application provides access to the web-based Generation LightMode Service. Information entered or generated through the app may therefore be processed by the same systems used by the website.

For purposes of applicable data-protection law, the East-Central Africa Division of the Seventh-day Adventist Church is the organization responsible for the personal information described in this Policy, unless another church institution clearly identifies itself as responsible for a particular activity.`
  },
  {
    title: "2. Information we may collect",
    content: `We collect information you provide, information created through your use of the Service, and limited technical information needed to operate and secure the Service.

**2.1 Information you provide**
- Account and profile information, such as your name, email address, profile photograph, country, territory, institution, church affiliation, role, and other profile details you choose to provide.
- Content and communications, including posts, comments, reactions, stories, direct and group messages, prayer requests, challenge submissions, study responses, reports, feedback, and files, photographs, audio, or video you upload.
- Participation information, such as pledges, GlowGroup membership, event responses, progress, certificates, badges, milestones, saved content, follows, and leaderboard activity.
- Institution and leadership information submitted for institution pages, account claims, leader accounts, compliance reporting, or administrative access.
- Support and safety information, including enquiries, complaints, content reports, blocked-user selections, moderation records, and correspondence with us.

**2.2 Information collected automatically**
- Device and technical information, such as device type, operating system, app or browser version, language, IP address, diagnostic logs, crash information, and security events.
- Usage information, such as pages or features viewed, interactions, session times, referrals, and approximate region inferred from network information.
- Identifiers and local storage, such as account identifiers, notification tokens, cookies, or similar technologies used to keep you signed in, remember preferences, prevent abuse, and understand Service performance.

**2.3 Device permissions and optional information**
The app or website may request access only when a feature needs it. Depending on your device and the features you choose, this may include camera, photos or media, microphone, notifications, or location. You can refuse or withdraw a permission in your device settings, although the related feature may then be unavailable. We do not claim to access a permission that is not requested by the installed version of the app.

Prayer requests, messages, photographs, and other user-generated content may reveal sensitive information, including religious beliefs, health concerns, or personal circumstances. Please share only what you are comfortable providing and use the available audience or privacy controls carefully.`
  },
  {
    title: "3. How we use information",
    content: `We use information to:

- Provide, personalize, maintain, and improve the Service and its faith, community, learning, media, group, and institution features.
- Create and manage accounts, authenticate users, maintain profiles, and apply role-based administrative access.
- Deliver messages, notifications, live sessions, challenges, devotionals, certificates, badges, leaderboards, and other requested features.
- Display content to the audience selected by the user or reasonably indicated by the feature, such as a public feed, group, institution page, or private conversation.
- Moderate content, respond to reports, enforce community rules, prevent fraud or abuse, and protect users, the Church, and the Service.
- Provide support, respond to enquiries, communicate important Service or policy changes, and administer programmes and events.
- Generate aggregated statistics and analytics about participation, reach, engagement, institutions, territories, and Service performance.
- Comply with legal obligations, lawful requests, safeguarding duties, and the establishment, exercise, or defence of legal claims.`
  },
  {
    title: "4. Legal grounds for processing",
    content: `Where applicable law requires a legal basis, we process information because it is necessary to provide the Service you request; because you have given consent; because we have legitimate interests in operating, securing, improving, and administering the Service; to protect vital interests; or to comply with legal obligations. Where we rely on consent, you may withdraw it at any time, without affecting processing already carried out lawfully.`
  },
  {
    title: "5. How information is shared",
    content: `We do not sell or rent personal information. We may share information only as reasonably necessary in the following circumstances:

- With other users or the public, according to the feature used, your settings, and the audience you select. Public posts, comments, profile details, institution pages, leaderboard activity, and public prayer requests may be visible beyond your immediate group.
- With authorized church leaders, moderators, institution administrators, and support personnel who need access for administration, safeguarding, reporting, moderation, or support.
- With service providers that host data, provide authentication, storage, analytics, messaging, notifications, media delivery, security, or technical support, subject to appropriate contractual and confidentiality safeguards.
- With third-party platforms when you choose to sign in, share content, open an external link, watch embedded media, or use an integrated service. Their own privacy terms apply to their processing.
- When required by law, court order, lawful authority, or when reasonably necessary to protect rights, safety, security, property, users, or the public.
- As part of an organizational restructuring or transfer of the Service, provided the recipient continues to protect the information consistently with applicable law.`
  },
  {
    title: "6. International data transfers",
    content: `Generation LightMode serves users across East-Central Africa and may use service providers or systems located in other countries. Personal information may therefore be processed outside your country. Where required, we use appropriate safeguards for cross-border transfers, such as contractual protections, access controls, security measures, and assessments required by applicable law.`
  },
  {
    title: "7. Data retention",
    content: `We retain personal information only for as long as reasonably necessary for the purposes described in this Policy, including providing the Service, maintaining community and institutional records, resolving disputes, enforcing agreements, safeguarding users, and meeting legal or audit obligations. Retention periods depend on the type of information, the context in which it was collected, legal requirements, and whether an account or content remains active. We may retain de-identified or aggregated information that no longer identifies you.`
  },
  {
    title: "8. Security",
    content: `We use reasonable administrative, technical, and organizational measures designed to protect personal information, including access controls, authentication, role-based permissions, monitoring, backups, and secure service providers where appropriate. No internet transmission or storage system is completely secure, so we cannot guarantee absolute security. Keep your sign-in credentials confidential and notify us promptly if you suspect unauthorized access.`
  },
  {
    title: "9. Your rights and choices",
    content: `Subject to applicable law, you may have the right to:

- Request access to, correction of, or a copy of your personal information.
- Request deletion, restriction, or objection to certain processing.
- Withdraw consent where processing is based on consent.
- Request data portability where applicable.
- Complain to the relevant data-protection authority.

You may update certain profile information and preferences within the Service. To request account or data deletion, email lightmode@ecd.adventist.org from the email address linked to your account and use the subject “Generation LightMode Data Deletion Request.” We may need to verify your identity. Some information may be retained where required by law, for safety and security, or to preserve records that cannot reasonably be separated from other users’ lawful content; where possible, such information will be restricted or de-identified.`
  },
  {
    title: "10. Children and young people",
    content: `Generation LightMode serves a faith community that may include young people. Users who are minors under the law of their country should use the Service with the knowledge and involvement of a parent or legal guardian. Where consent of a parent or guardian is legally required, we expect that consent to be obtained before a minor creates an account or submits personal information.

We do not knowingly seek to collect a child’s personal information without the authorization required by applicable law. Parents or guardians who believe a child has provided personal information without proper consent may contact us to request review or deletion. We encourage minors not to publish home addresses, phone numbers, school details, precise locations, or other information that could create a safety risk.`
  },
  {
    title: "11. User-generated content and community visibility",
    content: `The Service includes social and community features. Content you post may be copied, reshared, captured, or viewed by others according to the feature and audience. Removing content from your account may not remove copies already shared by others or retained for legitimate safety, moderation, legal, or backup purposes. Use private or limited-audience features for sensitive communications and avoid posting confidential information.`
  },
  {
    title: "12. Third-party services and external links",
    content: `The Service may contain links to, embeds from, or sign-in options provided by third parties such as Google, Microsoft, Facebook, Apple, video platforms, mapping services, social networks, or other ministry resources. Generation LightMode does not control those third parties’ privacy practices. Review their privacy notices before providing information or using their services.`
  },
  {
    title: "13. Notifications and communications",
    content: `We may send service, security, account, group, event, programme, or content notifications. You can control push notifications through the Service or your device settings where available. Essential administrative or security messages may still be sent when necessary to operate or protect your account.`
  },
  {
    title: "14. Changes to this Policy",
    content: `We may update this Privacy Policy as the Service, our practices, or legal requirements change. We will post the revised Policy and update the “Last updated” date. Where changes are material, we may provide additional notice through the Service or other appropriate means. Continued use after the effective date is subject to the revised Policy, to the extent permitted by law.`
  },
  {
    title: "15. Contact us",
    content: `For privacy questions, rights requests, complaints, or account/data deletion requests, contact:

**Generation LightMode**
Communication & Media Department
East-Central Africa Division of the Seventh-day Adventist Church
Magadi Road, Ongata Rongai, Nairobi, Kenya
Email: info@generationlightmode.org
General office: info@ecd.adventist.org | +254 20 514 4400`
  }
];

export default function Privacy() {
  const isMobile = useIsMobile();
  if (isMobile) return <MobilePrivacy sections={sections} />;

  return (
    <div style={{ background: "#0B0F1A", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(180deg, rgba(0,207,255,0.06) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(0,207,255,0.1)",
        padding: "60px 24px 40px"
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Link
            to={createPageUrl("Home")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#00CFFF", textDecoration: "none", fontSize: 13, fontFamily: "Inter, sans-serif", marginBottom: 28, opacity: 0.8 }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={22} color="#00CFFF" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Legal Document</div>
              <h1 className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 44px)", color: "#FFFFFF", margin: 0 }}>Privacy Policy</h1>
            </div>
          </div>

          <p className="glm-body" style={{ fontSize: 15, maxWidth: 680, marginBottom: 12 }}>
            This policy explains what information Generation LightMode collects, why it is used, when it may be shared, and the choices available to you.
          </p>
          <p style={{ fontSize: 13, color: "#4A5568", fontFamily: "Inter, sans-serif" }}>
            Last updated: <strong style={{ color: "#8A9BB0" }}>26 August 2026</strong> &nbsp;·&nbsp; Effective date: <strong style={{ color: "#8A9BB0" }}>26 August 2026</strong>
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sections.map((section, i) => (
            <div key={i} style={{
              background: "rgba(18,24,38,0.6)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: "28px 32px"
            }}>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "#00CFFF",
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: "1px solid rgba(0,207,255,0.1)"
              }}>
                {section.title}
              </h2>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#C8D0E0", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {section.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                  j % 2 === 1
                    ? <strong key={j} style={{ color: "#FFFFFF" }}>{part}</strong>
                    : part
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 48,
          padding: "20px 28px",
          background: "rgba(0,207,255,0.04)",
          border: "1px solid rgba(0,207,255,0.15)",
          borderRadius: 14,
          textAlign: "center"
        }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8A9BB0" }}>
            Questions about this policy? Email us at{" "}
            <a href="mailto:info@generationlightmode.org" style={{ color: "#00CFFF" }}>
              info@generationlightmode.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}