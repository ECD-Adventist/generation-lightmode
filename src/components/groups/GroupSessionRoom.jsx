import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const rtcConfig = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

export default function GroupSessionRoom({ user, session }) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState(session.is_active ? "Live" : "Waiting for host");
  const [isStarting, setIsStarting] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(session);
  const peerConnectionsRef = useRef({});
  const signalSubscriptionRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { sessionRef.current = session; }, [session]);

  const { data: messages = [] } = useQuery({ queryKey: ["groupSessionMessages", session.id], queryFn: () => base44.entities.GroupSessionMessage.filter({ session_id: session.id }, "created_date"), enabled: !!session.id });
  const { data: allUsers = [] } = useQuery({ queryKey: ["groupSessionUsers"], queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; }, enabled: !!user });

  useEffect(() => {
    const unsubM = base44.entities.GroupSessionMessage.subscribe(e => { if (e.data?.session_id === session.id) queryClient.invalidateQueries({ queryKey: ["groupSessionMessages", session.id] }); });
    const unsubS = base44.entities.GroupSession.subscribe(e => { if (e.data?.id === session.id) queryClient.invalidateQueries({ queryKey: ["groupSessionCurrent", session.id] }); });
    return () => { unsubM(); unsubS(); };
  }, [session.id, queryClient]);

  const stopHosting = async () => {
    if (signalSubscriptionRef.current) signalSubscriptionRef.current();
    Object.values(peerConnectionsRef.current).forEach(p => p.close());
    peerConnectionsRef.current = {};
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (sessionRef.current?.id) await base44.entities.GroupSession.update(sessionRef.current.id, { is_active: false });
    setStatus("Session ended");
  };

  const startHosting = async (mode) => {
    setIsStarting(true);
    const stream = mode === "screen" ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }) : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    await base44.entities.GroupSession.update(session.id, { is_active: true });
    setStatus(mode === "screen" ? "Sharing screen" : "Live");
    const createPeer = (viewerEmail) => {
      if (peerConnectionsRef.current[viewerEmail]) return peerConnectionsRef.current[viewerEmail];
      const peer = new RTCPeerConnection(rtcConfig);
      streamRef.current.getTracks().forEach(t => peer.addTrack(t, streamRef.current));
      peer.onicecandidate = e => { if (e.candidate) base44.entities.GroupSessionSignal.create({ session_id: session.id, sender_email: user.email, recipient_email: viewerEmail, signal_type: "candidate", payload: JSON.stringify({ candidate: e.candidate }) }); };
      peerConnectionsRef.current[viewerEmail] = peer;
      return peer;
    };
    signalSubscriptionRef.current = base44.entities.GroupSessionSignal.subscribe(async (event) => {
      const signal = event.data;
      if (event.type !== "create" || signal?.session_id !== session.id || signal?.recipient_email !== user.email) return;
      const payload = JSON.parse(signal.payload || "{}");
      if (signal.signal_type === "offer" && payload.sdp) { const peer = createPeer(signal.sender_email); await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp)); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await base44.entities.GroupSessionSignal.create({ session_id: session.id, sender_email: user.email, recipient_email: signal.sender_email, signal_type: "answer", payload: JSON.stringify({ sdp: peer.localDescription }) }); }
      if (signal.signal_type === "candidate" && payload.candidate && peerConnectionsRef.current[signal.sender_email]) await peerConnectionsRef.current[signal.sender_email].addIceCandidate(new RTCIceCandidate(payload.candidate));
    });
    setIsStarting(false);
  };

  useEffect(() => {
    if (session.host_email === user.email || !session.is_active) return;
    const remoteStream = new MediaStream();
    const peer = new RTCPeerConnection(rtcConfig);
    let unsub = null;
    peer.addTransceiver("video", { direction: "recvonly" });
    peer.addTransceiver("audio", { direction: "recvonly" });
    peer.ontrack = e => { e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t)); if (videoRef.current) videoRef.current.srcObject = remoteStream; setStatus("Live"); };
    peer.onicecandidate = e => { if (e.candidate) base44.entities.GroupSessionSignal.create({ session_id: session.id, sender_email: user.email, recipient_email: session.host_email, signal_type: "candidate", payload: JSON.stringify({ candidate: e.candidate }) }); };
    const connect = async () => {
      unsub = base44.entities.GroupSessionSignal.subscribe(async entry => { const signal = entry.data; if (entry.type !== "create" || signal?.session_id !== session.id || signal?.recipient_email !== user.email) return; const payload = JSON.parse(signal.payload || "{}"); if (signal.signal_type === "answer" && payload.sdp) await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp)); if (signal.signal_type === "candidate" && payload.candidate) await peer.addIceCandidate(new RTCIceCandidate(payload.candidate)); });
      const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
      await base44.entities.GroupSessionSignal.create({ session_id: session.id, sender_email: user.email, recipient_email: session.host_email, signal_type: "offer", payload: JSON.stringify({ sdp: peer.localDescription }) });
    };
    connect();
    return () => { unsub?.(); peer.close(); remoteStream.getTracks().forEach(t => t.stop()); };
  }, [session.id, session.host_email, session.is_active, user.email]);

  const getName = (email) => allUsers.find(u => u.email === email)?.full_name || email?.split("@")[0] || "Believer";
  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 font-['Inter']">
      <div className="rounded-[1.75rem] p-4" style={cardStyle}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <Link to={createPageUrl("GlowGroups")} className="text-sm transition" style={{ color: "#0B3FD9" }}>← Back to GlowGroups</Link>
            <h1 className="text-2xl font-bold mt-2" style={{ color: "#0B1B3D" }}>{session.title}</h1>
            <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>{status}</p>
          </div>
          {session.host_email === user.email && !session.is_active && (
            <div className="flex gap-3">
              <button onClick={() => startHosting("camera")} disabled={isStarting} className="px-4 py-2 rounded-2xl font-semibold disabled:opacity-50" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Start camera</button>
              <button onClick={() => startHosting("screen")} disabled={isStarting} className="px-4 py-2 rounded-2xl font-semibold disabled:opacity-50" style={{ background: "#0B1B3D", color: "#FFFFFF" }}>Share screen</button>
            </div>
          )}
          {session.host_email === user.email && session.is_active && <button onClick={stopHosting} className="px-4 py-2 rounded-2xl font-semibold" style={{ background: "#EF4444", color: "#FFFFFF" }}>End session</button>}
        </div>
        <video ref={videoRef} autoPlay playsInline muted={session.host_email === user.email} className="w-full rounded-2xl bg-black min-h-[320px] lg:min-h-[560px] object-contain" />
      </div>

      <div className="rounded-[1.75rem] overflow-hidden flex flex-col min-h-[70vh]" style={cardStyle}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
          <h3 className="text-lg font-bold" style={{ color: "#0B1B3D" }}>Group chat</h3>
          <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Chat history is saved.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F6F8FC" }}>
          {messages.map(msg => (
            <div key={msg.id} className="rounded-2xl px-4 py-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#0B3FD9" }}>{getName(msg.user_email)}</div>
              <div className="text-sm" style={{ color: "#0B1B3D" }}>{msg.content}</div>
            </div>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!draft.trim()) return; base44.entities.GroupSessionMessage.create({ session_id: session.id, user_email: user.email, content: draft }); setDraft(""); }} className="px-4 py-3 border-t flex gap-2" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Send a message..." className="flex-1 h-11 rounded-2xl px-4 focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
          <button type="submit" className="px-4 rounded-2xl font-semibold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Send</button>
        </form>
      </div>
    </div>
  );
}