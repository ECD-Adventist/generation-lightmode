import React, { useState } from "react";
import { Check, Copy, MessageCircle, X, Share2, Twitter, Facebook, Linkedin, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  copyShareLink,
  logShareError,
  openShareWindow,
  whatsappShareUrl,
  twitterShareUrl,
  facebookShareUrl,
  linkedinShareUrl,
  emailShareUrl,
} from "@/lib/shareActions";

export default function ShareFallbackDialog({ share, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!share) return null;

  const copy = async () => {
    try {
      await copyShareLink(share.url);
      setCopied(true);
      toast.success("Link copied");
    } catch (error) {
      logShareError("copy_link", error, { contentId: share.id });
      toast.error("Copy failed — select and copy the link below");
    }
  };

  const whatsapp = () => {
    if (!openShareWindow(whatsappShareUrl(share.text), { contentId: share.id, platform: "whatsapp" })) copy();
  };
  const twitter = () => {
    if (!openShareWindow(twitterShareUrl(share.text, share.url), { contentId: share.id, platform: "twitter" })) copy();
  };
  const facebook = () => {
    if (!openShareWindow(facebookShareUrl(share.url), { contentId: share.id, platform: "facebook" })) copy();
  };
  const linkedin = () => {
    if (!openShareWindow(linkedinShareUrl(share.url, share.title), { contentId: share.id, platform: "linkedin" })) copy();
  };
  const email = () => {
    if (!openShareWindow(emailShareUrl(share.title, share.text), { contentId: share.id, platform: "email" })) copy();
  };

  const nativeShare = async () => {
    if (typeof navigator.share !== "function") {
      toast.error("Native sharing is not available on this device");
      return;
    }
    try {
      await navigator.share({ title: share.title || "Generation LightMode", text: share.text, url: share.url });
      toast.success("Shared successfully");
    } catch (error) {
      if (error?.name !== "AbortError") {
        logShareError("native_share", error, { contentId: share.id });
      }
    }
  };

  const hasNativeShare = typeof navigator.share === "function";

  const platformBtns = [
    { label: "WhatsApp", icon: <MessageCircle className="w-4 h-4" />, bg: "#25D366", onClick: whatsapp },
    { label: "X / Twitter", icon: <Twitter className="w-4 h-4" />, bg: "#000000", onClick: twitter },
    { label: "Facebook", icon: <Facebook className="w-4 h-4" />, bg: "#1877F2", onClick: facebook },
    { label: "LinkedIn", icon: <Linkedin className="w-4 h-4" />, bg: "#0A66C2", onClick: linkedin },
    { label: "Email", icon: <Mail className="w-4 h-4" />, bg: "#4A5878", onClick: email },
  ];

  return (
    <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#0B1B3D]">Share post</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-[#4A5878]" /></button>
        </div>
        <p className="text-sm text-[#4A5878] mb-4 line-clamp-2">{share.title}</p>

        {hasNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 mb-3"
            style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)" }}
          >
            <Share2 className="w-4 h-4" /> Share via device
          </button>
        )}

        <div className="grid grid-cols-5 gap-2 mb-3">
          {platformBtns.map(btn => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              title={btn.label}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center text-white"
                style={{ background: btn.bg }}
              >
                {btn.icon}
              </span>
              <span className="text-[10px] font-semibold text-[#4A5878] leading-tight text-center">{btn.label}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={copy} className="w-full rounded-2xl bg-[#EEF3FF] py-3 text-sm font-bold text-[#0B3FD9] flex items-center justify-center gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copied" : "Copy link"}
        </button>

        <input readOnly value={share.url} onFocus={(event) => event.target.select()} className="mt-4 w-full rounded-xl border border-[#D6E4FF] bg-[#F8FAFC] px-3 py-2 text-xs text-[#4A5878]" />
      </div>
    </div>
  );
}