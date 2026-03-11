import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import LiveEngagementPanel from "./LiveEngagementPanel";

const rtcConfig = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

export default function LiveBroadcastStudio({ user, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [session, setSession] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const signalSubscriptionRef = useRef(null);

  const createPeer = (viewerEmail, liveSession) => {
    if (peerConnectionsRef.current[viewerEmail]) return peerConnectionsRef.current[viewerEmail];

    const peer = new RTCPeerConnection(rtcConfig);
    streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        base44.entities.LiveSignal.create({
          session_id: liveSession.id,
          sender_email: user.email,
          recipient_email: viewerEmail,
          signal_type: "candidate",
          payload: JSON.stringify({ candidate: event.candidate }),
        });
      }
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        peer.close();
        delete peerConnectionsRef.current[viewerEmail];
      }
    };

    peerConnectionsRef.current[viewerEmail] = peer;
    return peer;
  };

  const stopBroadcast = async (shouldClose = true) => {
    if (signalSubscriptionRef.current) signalSubscriptionRef.current();
    Object.values(peerConnectionsRef.current).forEach((peer) => peer.close());
    peerConnectionsRef.current = {};
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (sessionRef.current?.id) await base44.entities.LiveSession.update(sessionRef.current.id, { is_active: false });
    sessionRef.current = null;
    setSession(null);
    if (shouldClose) onClose();
  };

  useEffect(() => () => {
    stopBroadcast(false);
  }, []);

  const startBroadcast = async () => {
    setIsStarting(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;

    const liveSession = await base44.entities.LiveSession.create({
      broadcaster_email: user.email,
      title,
      description,
      is_active: true,
      started_at: new Date().toISOString(),
    });

    signalSubscriptionRef.current = base44.entities.LiveSignal.subscribe(async (event) => {
      const signal = event.data;
      if (event.type !== "create" || signal?.session_id !== liveSession.id || signal?.recipient_email !== user.email) return;
      const payload = JSON.parse(signal.payload || "{}");

      if (signal.signal_type === "offer" && payload.sdp) {
        const peer = createPeer(signal.sender_email, liveSession);
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await base44.entities.LiveSignal.create({
          session_id: liveSession.id,
          sender_email: user.email,
          recipient_email: signal.sender_email,
          signal_type: "answer",
          payload: JSON.stringify({ sdp: peer.localDescription }),
        });
      }

      if (signal.signal_type === "candidate" && payload.candidate && peerConnectionsRef.current[signal.sender_email]) {
        await peerConnectionsRef.current[signal.sender_email].addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    sessionRef.current = liveSession;
    setSession(liveSession);
    setIsStarting(false);
  };

  if (!session) {
    return (
      <div className="bg-[#121826] border border-white/10 rounded-3xl p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Start a live broadcast</h2>
        <p className="text-gray-400 mb-6">Go live for testimonies, devotionals, worship, and prayer moments.</p>
        <div className="space-y-4">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Live session title" className="w-full h-12 rounded-2xl bg-[#0F1524] border border-white/10 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you sharing today?" className="w-full min-h-[110px] rounded-2xl bg-[#0F1524] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40" />
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-white/10 text-white font-semibold">Cancel</button>
            <button onClick={startBroadcast} disabled={!title.trim() || isStarting} className="px-5 py-3 rounded-2xl bg-[#00CFFF] text-black font-semibold disabled:opacity-50">{isStarting ? "Starting..." : "Go live"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="bg-[#121826] border border-white/10 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-bold mb-2">YOU ARE LIVE</div>
            <h2 className="text-xl font-bold text-white">{session.title}</h2>
          </div>
          <button onClick={() => stopBroadcast(true)} className="px-4 py-2 rounded-2xl bg-white text-black font-semibold">End live</button>
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-3xl bg-black min-h-[320px] lg:min-h-[560px] object-cover" />
      </div>
      <LiveEngagementPanel session={session} currentUser={user} />
    </div>
  );
}