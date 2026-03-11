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

  const { data: messages = [] } = useQuery({
    queryKey: ["groupSessionMessages", session.id],
    queryFn: () => base44.entities.GroupSessionMessage.filter({ session_id: session.id }, "created_date"),
    enabled: !!session.id,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["groupSessionUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const unsubscribeMessages = base44.entities.GroupSessionMessage.subscribe((event) => {
      if (event.data?.session_id === session.id) queryClient.invalidateQueries({ queryKey: ["groupSessionMessages", session.id] });
    });
    const unsubscribeSession = base44.entities.GroupSession.subscribe((event) => {
      if (event.data?.id === session.id) queryClient.invalidateQueries({ queryKey: ["groupSessionCurrent", session.id] });
    });
    return () => {
      unsubscribeMessages();
      unsubscribeSession();
    };
  }, [session.id, queryClient]);

  const stopHosting = async () => {
    if (signalSubscriptionRef.current) signalSubscriptionRef.current();
    Object.values(peerConnectionsRef.current).forEach((peer) => peer.close());
    peerConnectionsRef.current = {};
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (sessionRef.current?.id) await base44.entities.GroupSession.update(sessionRef.current.id, { is_active: false });
    setStatus("Session ended");
  };

  const startHosting = async (mode) => {
    setIsStarting(true);
    const stream = mode === "screen"
      ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    await base44.entities.GroupSession.update(session.id, { is_active: true });
    setStatus(mode === "screen" ? "Sharing screen" : "Live");

    const createPeer = (viewerEmail) => {
      if (peerConnectionsRef.current[viewerEmail]) return peerConnectionsRef.current[viewerEmail];
      const peer = new RTCPeerConnection(rtcConfig);
      streamRef.current.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          base44.entities.GroupSessionSignal.create({
            session_id: session.id,
            sender_email: user.email,
            recipient_email: viewerEmail,
            signal_type: "candidate",
            payload: JSON.stringify({ candidate: event.candidate }),
          });
        }
      };
      peerConnectionsRef.current[viewerEmail] = peer;
      return peer;
    };

    signalSubscriptionRef.current = base44.entities.GroupSessionSignal.subscribe(async (event) => {
      const signal = event.data;
      if (event.type !== "create" || signal?.session_id !== session.id || signal?.recipient_email !== user.email) return;
      const payload = JSON.parse(signal.payload || "{}");

      if (signal.signal_type === "offer" && payload.sdp) {
        const peer = createPeer(signal.sender_email);
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await base44.entities.GroupSessionSignal.create({
          session_id: session.id,
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

    setIsStarting(false);
  };

  useEffect(() => {
    if (session.host_email === user.email) return;
    if (!session.is_active) return;

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
        base44.entities.GroupSessionSignal.create({
          session_id: session.id,
          sender_email: user.email,
          recipient_email: session.host_email,
          signal_type: "candidate",
          payload: JSON.stringify({ candidate: event.candidate }),
        });
      }
    };

    const connect = async () => {
      unsubscribe = base44.entities.GroupSessionSignal.subscribe(async (entry) => {
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
      await base44.entities.GroupSessionSignal.create({
        session_id: session.id,
        sender_email: user.email,
        recipient_email: session.host_email,
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
  }, [session.id, session.host_email, session.is_active, user.email]);

  const getName = (email) => allUsers.find((entry) => entry.email === email)?.full_name || email?.split("@")[0] || "Believer";

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="bg-[#121826] border border-white/10 rounded-3xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <Link to={createPageUrl("GlowGroups")} className="text-sm text-[#00CFFF] hover:text-white transition">← Back to GlowGroups</Link>
            <h1 className="text-2xl font-bold text-white mt-2">{session.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{status}</p>
          </div>
          {session.host_email === user.email && !session.is_active && (
            <div className="flex gap-3">
              <button onClick={() => startHosting("camera")} disabled={isStarting} className="px-4 py-2 rounded-2xl bg-[#00CFFF] text-black font-semibold disabled:opacity-50">Start camera</button>
              <button onClick={() => startHosting("screen")} disabled={isStarting} className="px-4 py-2 rounded-2xl bg-white text-black font-semibold disabled:opacity-50">Share screen</button>
            </div>
          )}
          {session.host_email === user.email && session.is_active && (
            <button onClick={stopHosting} className="px-4 py-2 rounded-2xl bg-white text-black font-semibold">End session</button>
          )}
        </div>
        <video ref={videoRef} autoPlay playsInline muted={session.host_email === user.email} className="w-full rounded-3xl bg-black min-h-[320px] lg:min-h-[560px] object-contain" />
      </div>

      <div className="bg-[#121826] border border-white/10 rounded-3xl overflow-hidden flex flex-col min-h-[70vh]">
        <div className="px-4 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Group chat</h3>
          <p className="text-sm text-gray-400 mt-1">Chat history is saved for group members.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0F1524]">
          {messages.map((message) => (
            <div key={message.id} className="bg-white/5 rounded-2xl px-4 py-3">
              <div className="text-xs font-semibold text-[#00CFFF] mb-1">{getName(message.user_email)}</div>
              <div className="text-sm text-white">{message.content}</div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            base44.entities.GroupSessionMessage.create({ session_id: session.id, user_email: user.email, content: draft });
            setDraft("");
          }}
          className="px-4 py-3 border-t border-white/10 flex gap-2"
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message..."
            className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
          />
          <button type="submit" className="px-4 rounded-2xl bg-[#00CFFF] text-black font-semibold">Send</button>
        </form>
      </div>
    </div>
  );
}