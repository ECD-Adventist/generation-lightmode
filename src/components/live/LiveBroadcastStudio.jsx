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
    streamRef.current.getTracks().forEach(t => peer.addTrack(t, streamRef.current));
    peer.onicecandidate = e => { if (e.candidate) base44.entities.LiveSignal.create({ session_id: liveSession.id, sender_email: user.email, recipient_email: viewerEmail, signal_type: "candidate", payload: JSON.stringify({ candidate: e.candidate }) }); };
    peer.onconnectionstatechange = () => { if (["failed","closed","disconnected"].includes(peer.connectionState)) { peer.close(); delete peerConnectionsRef.current[viewerEmail]; } };
    peerConnectionsRef.current[viewerEmail] = peer;
    return peer;
  };

  const stopBroadcast = async (shouldClose = true) => {
    if (signalSubscriptionRef.current) signalSubscriptionRef.current();
    Object.values(peerConnectionsRef.current).forEach(p => p.close());
    peerConnectionsRef.current = {};
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (sessionRef.current?.id) await base44.entities.LiveSession.update(sessionRef.current.id, { is_active: false });
    sessionRef.current = null; setSession(null);
    if (shouldClose) onClose();
  };

  useEffect(() => () => { stopBroadcast(false); }, []);

  const startBroadcast = async () => {
    setIsStarting(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    const liveSession = await base44.entities.LiveSession.create({ broadcaster_email: user.email, title, description, is_active: true, started_at: new Date().toISOString() });
    signalSubscriptionRef.current = base44.entities.LiveSignal.subscribe(async (event) => {
      const signal = event.data;
      if (event.type !== "create" || signal?.session_id !== liveSession.id || signal?.recipient_email !== user.email) return;
      const payload = JSON.parse(signal.payload || "{}");
      if (signal.signal_type === "offer" && payload.sdp) { const peer = createPeer(signal.sender_email, liveSession); await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp)); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await base44.entities.LiveSignal.create({ session_id: liveSession.id, sender_email: user.email, recipient_email: signal.sender_email, signal_type: "answer", payload: JSON.stringify({ sdp: peer.localDescription }) }); }
      if (signal.signal_type === "candidate" && payload.candidate && peerConnectionsRef.current[signal.sender_email]) await peerConnectionsRef.current[signal.sender_email].addIceCandidate(new RTCIceCandidate(payload.candidate));
    });
    sessionRef.current = liveSession; setSession(liveSession); setIsStarting(false);
  };

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };
  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  if (!session) {
    return (
      <div className="rounded-[1.75rem] p-6 max-w-2xl mx-auto font-['Inter']" style={cardStyle}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Start a live broadcast</h2>
        <p className="mb-6" style={{ color: "#6B7FA0" }}>Go live for testimonies, devotionals, worship, and prayer moments.</p>
        <div className="space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Live session title" className="w-full h-12 rounded-2xl px-4 focus:outline-none" style={inputStyle} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you sharing today?" className="w-full min-h-[110px] rounded-2xl px-4 py-3 focus:outline-none" style={inputStyle} />
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-3 rounded-2xl font-semibold" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>Cancel</button>
            <button onClick={startBroadcast} disabled={!title.trim() || isStarting} className="px-5 py-3 rounded-2xl font-semibold disabled:opacity-50" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>{isStarting ? "Starting..." : "Go live"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 font-['Inter']">
      <div className="rounded-[1.75rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#DC2626", border: "1px solid #FCA5A5" }}>YOU ARE LIVE</div>
            <h2 className="text-xl font-bold" style={{ color: "#0B1B3D" }}>{session.title}</h2>
          </div>
          <button onClick={() => stopBroadcast(true)} className="px-4 py-2 rounded-2xl font-semibold" style={{ background: "#EF4444", color: "#FFFFFF" }}>End live</button>
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-2xl bg-black min-h-[320px] lg:min-h-[560px] object-cover" />
      </div>
      <LiveEngagementPanel session={session} currentUser={user} />
    </div>
  );
}