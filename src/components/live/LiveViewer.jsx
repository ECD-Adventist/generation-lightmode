import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import LiveEngagementPanel from "./LiveEngagementPanel";

const rtcConfig = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

export default function LiveViewer({ session, user, onBack }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const remoteStream = new MediaStream();
    const peer = new RTCPeerConnection(rtcConfig);
    let unsub = null;
    peer.addTransceiver("video", { direction: "recvonly" });
    peer.addTransceiver("audio", { direction: "recvonly" });
    peer.ontrack = e => { e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t)); if (videoRef.current) videoRef.current.srcObject = remoteStream; setStatus("Live"); };
    peer.onicecandidate = e => { if (e.candidate) base44.entities.LiveSignal.create({ session_id: session.id, sender_email: user.email, recipient_email: session.broadcaster_email, signal_type: "candidate", payload: JSON.stringify({ candidate: e.candidate }) }); };
    const connect = async () => {
      unsub = base44.entities.LiveSignal.subscribe(async entry => { const signal = entry.data; if (entry.type !== "create" || signal?.session_id !== session.id || signal?.recipient_email !== user.email) return; const payload = JSON.parse(signal.payload || "{}"); if (signal.signal_type === "answer" && payload.sdp) await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp)); if (signal.signal_type === "candidate" && payload.candidate) await peer.addIceCandidate(new RTCIceCandidate(payload.candidate)); });
      const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
      await base44.entities.LiveSignal.create({ session_id: session.id, sender_email: user.email, recipient_email: session.broadcaster_email, signal_type: "offer", payload: JSON.stringify({ sdp: peer.localDescription }) });
    };
    connect();
    return () => { unsub?.(); peer.close(); remoteStream.getTracks().forEach(t => t.stop()); };
  }, [session.id, session.broadcaster_email, user.email]);

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 font-['Inter']">
      <div className="rounded-[1.75rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <button onClick={onBack} className="text-sm transition mb-2" style={{ color: "#0B3FD9" }}>← Back to live sessions</button>
            <h2 className="text-xl font-bold" style={{ color: "#0B1B3D" }}>{session.title}</h2>
            <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>{status}</p>
          </div>
        </div>
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl bg-black min-h-[320px] lg:min-h-[560px] object-contain" />
      </div>
      <LiveEngagementPanel session={session} currentUser={user} />
    </div>
  );
}