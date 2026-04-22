import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePrivacy from "@/components/privacy/MobilePrivacy";

const sections = [
  {
    title: "1. Introduction",
    content: `Generation LightMode ("we," "our," or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website, mobile application, and all related services (collectively, the "Platform").

By using the Platform, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not access or use our services.`
  },
  {
    title: "2. Information We Collect",
    content: `We collect the following categories of information:

**a) Information You Provide Directly**
- Full name, email address, and profile details
- Country of residence and church/ministry affiliation
- Glow Drops, prayer requests, testimonies, and other user-generated content
- Messages sent through the platform's communication features
- Participation in challenges, GlowGroups, and study plans

**b) Information Collected Automatically**
- Device information (browser type, operating system, device identifiers)
- Log data (IP address, access times, pages visited)
- Usage data (features used, interactions, session duration)
- Location data (country/region level, based on IP address)

**c) Information from Third Parties**
- If you sign in via a third-party authentication provider, we may receive basic profile information (name, email) from that provider in accordance with their privacy policies.`
  },
  {
    title: "3. How We Use Your Information",
    content: `We use the information we collect to:

- Provide, operate, and maintain the Platform
- Personalize your experience and deliver relevant content
- Send you notifications, updates, and spiritual encouragement via email or push notifications
- Monitor and analyze usage trends to improve our features
- Facilitate community features such as GlowGroups, prayer walls, and challenges
- Award Glow Points, certificates, and recognition milestones
- Communicate with you about your account, support requests, or platform changes
- Comply with legal obligations and enforce our Terms of Service
- Detect and prevent fraudulent, unauthorized, or illegal activity`
  },
  {
    title: "4. Legal Basis for Processing (GDPR)",
    content: `If you are located in the European Economic Area (EEA), we process your personal data under the following legal bases:

- **Consent**: Where you have given explicit consent (e.g., signing up, submitting Glow Drops)
- **Contractual necessity**: To provide the services you have requested
- **Legitimate interests**: To improve our services, prevent fraud, and ensure platform security
- **Legal obligation**: Where we are required to process data to comply with applicable law`
  },
  {
    title: "5. Electronic Communication Consent",
    content: `By registering on the Platform, you consent to receive electronic communications from Generation LightMode, including:

- Platform notifications and activity alerts
- Weekly devotional and spiritual encouragement emails
- Challenge updates, milestone recognitions, and community announcements
- Important service and policy updates

You may opt out of non-essential communications at any time through your account Settings or by clicking the unsubscribe link in any email.`
  },
  {
    title: "6. Sharing Your Information",
    content: `We do not sell your personal data. We may share your information only in the following circumstances:

- **With service providers**: Trusted third-party vendors who assist us in operating the Platform (e.g., hosting, analytics, email delivery), bound by confidentiality agreements
- **With your GlowGroup members**: Content you post in a GlowGroup is visible to other members of that group
- **Public profile content**: Your username, profile photo, Glow Drops, and public activity may be visible to other Platform users
- **Legal requirements**: If required by law, court order, or governmental authority
- **Business transfers**: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction
- **With your consent**: In any other case where you have given explicit permission`
  },
  {
    title: "7. Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us at privacy@generationlightmode.org.

Upon account deletion, we will delete or anonymize your personal data within 30 days, except where we are legally required to retain certain information.`
  },
  {
    title: "8. Data Security",
    content: `We implement industry-standard security measures to protect your personal information, including:

- Encrypted data transmission (TLS/SSL)
- Secure cloud infrastructure with access controls
- Regular security reviews and vulnerability assessments

However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.`
  },
  {
    title: "9. Children's Privacy",
    content: `The Platform is intended for users aged 13 and above. For users under 18, we encourage parental oversight. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal data, please contact us immediately at privacy@generationlightmode.org and we will take steps to delete such information.`
  },
  {
    title: "10. Your Rights",
    content: `Depending on your location, you may have the following rights regarding your personal data:

- **Access**: Request a copy of the personal data we hold about you
- **Correction**: Request correction of inaccurate or incomplete data
- **Deletion**: Request deletion of your personal data ("right to be forgotten")
- **Restriction**: Request that we restrict processing of your data
- **Portability**: Receive your data in a structured, machine-readable format
- **Objection**: Object to processing based on legitimate interests
- **Withdraw consent**: Withdraw consent at any time where processing is consent-based

To exercise any of these rights, contact us at privacy@generationlightmode.org. We will respond within 30 days.`
  },
  {
    title: "11. Cookies and Tracking Technologies",
    content: `We use cookies and similar tracking technologies to enhance your experience on the Platform. These may include:

- **Essential cookies**: Required for the Platform to function
- **Analytics cookies**: Help us understand how users interact with the Platform
- **Preference cookies**: Remember your settings and preferences

You can control cookie settings through your browser. Disabling certain cookies may affect Platform functionality.`
  },
  {
    title: "12. Third-Party Links",
    content: `The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party sites you visit.`
  },
  {
    title: "13. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. When we do, we will notify you via email or a prominent notice on the Platform. Your continued use of the Platform after changes take effect constitutes your acceptance of the revised policy.`
  },
  {
    title: "14. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:

**Generation LightMode**
Email: privacy@generationlightmode.org
Website: generationlightmode.org

We are committed to working with you to resolve any privacy concerns promptly and transparently.`
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
            This policy describes how Generation LightMode collects, uses, and protects your personal information when you use our platform.
          </p>
          <p style={{ fontSize: 13, color: "#4A5568", fontFamily: "Inter, sans-serif" }}>
            Last updated: <strong style={{ color: "#8A9BB0" }}>March 2026</strong> &nbsp;·&nbsp; Effective date: <strong style={{ color: "#8A9BB0" }}>March 2026</strong>
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
            <a href="mailto:privacy@generationlightmode.org" style={{ color: "#00CFFF" }}>
              privacy@generationlightmode.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}