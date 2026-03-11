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
    let unsubscribe = null;

    peer.addTransceiver("video", { direction: "recvonly" });
    peer.addTransceiver("audio", { direction: "recvonly" });
    peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      if (videoRef.current) videoRef.current.srcObject = remoteStream;
      setStatus("Live");
    };
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        base44.entities.LiveSignal.create({
          session_id: session.id,
          sender_email: user.email,
          recipient_email: session.broadcaster_email,
          signal_type: "candidate",
          payload: JSON.stringify({ candidate: event.candidate }),
        });
      }
    };

    const connect = async () => {
      unsubscribe = base44.entities.LiveSignal.subscribe(async (entry) => {
        const signal = entry.data;
        if (entry.type !== "create" || signal?.session_id !== session.id || signal?.recipient_email !== user.email) return;
        const payload = JSON.parse(signal.payload || "{}");

        if (signal.signal_type === "answer" && payload.sdp) {
          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }

        if (signal.signal_type === "candidate" && payload.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await base44.entities.LiveSignal.create({
        session_id: session.id,
        sender_email: user.email,
        recipient_email: session.broadcaster_email,
        signal_type: "offer",
        payload: JSON.stringify({ sdp: peer.localDescription }),
      });
    };

    connect();

    return () => {
      unsubscribe?.();
      peer.close();
      remoteStream.getTracks().forEach((track) => track.stop());
    };
  }, [session.id, session.broadcaster_email, user.email]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="bg-[#121826] border border-white/10 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button onClick={onBack} className="text-sm text-[#00CFFF] hover:text-white transition mb-2">← Back to live sessions</button>
            <h2 className="text-xl font-bold text-white">{session.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{status}</p>
          </div>
        </div>
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-3xl bg-black min-h-[320px] lg:min-h-[560px] object-contain" />
      </div>
      <LiveEngagementPanel session={session} currentUser={user} />
    </div>
  );
}