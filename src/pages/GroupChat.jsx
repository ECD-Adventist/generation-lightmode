import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Paperclip, Users, Crown, ArrowLeft, MoreVertical, Trash2, Smile, Info, Calendar, Image as ImageIcon, X, MessageCircle, Loader2, LogOut, Bell, BellOff, Search } from "lucide-react";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";
const EMOJIS = ["👍","❤️","🙏","🔥","🎉","😊","😂","😢","💯","✨","🕊️","🙌"];

function parseDate(s) { if (!s) return null; return new Date(s.endsWith("Z") ? s : s + "Z"); }
function formatMessageTime(s) { const d = parseDate(s); if (!d) return ""; if (isToday(d)) return format(d, "HH:mm"); if (isYesterday(d)) return "Yesterday " + format(d, "HH:mm"); return format(d, "MMM d, HH:mm"); }
function formatDayDivider(s) { const d = parseDate(s); if (!d) return ""; if (isToday(d)) return "Today"; if (isYesterday(d)) return "Yesterday"; return format(d, "MMMM d, yyyy"); }

export default function GroupChat() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("id");
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if no groupId
  useEffect(() => {
    if (!groupId) navigate(createPageUrl("GlowGroups"));
  }, [groupId, navigate]);

  // Auth check
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.pathname + window.location.search); return null; }
      return base44.auth.me();
    }
  });

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["glowGroup", groupId],
    queryFn: async () => {
      const results = await base44.entities.GlowGroup.filter({ id: groupId });
      return results[0] || null;
    },
    enabled: !!groupId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["groupMessages", groupId],
    queryFn: () => base44.entities.GlowGroupMessage.filter({ group_id: groupId }, "created_date"),
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => base44.entities.GlowGroupMember.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["groupEvents", groupId],
    queryFn: () => base44.entities.GlowGroupEvent.filter({ group_id: groupId }, "-date"),
    enabled: !!groupId,
  });

  // Real-time
  useEffect(() => {
    if (!groupId) return;
    const unsub = base44.entities.GlowGroupMessage.subscribe((event) => {
      if (event.data?.group_id === groupId) {
        queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] });
      }
    });
    return unsub;
  }, [groupId, queryClient]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  useEffect(() => { inputRef.current?.focus(); }, [groupId]);

  useEffect(() => {
    const close = () => { setMenuOpenId(null); setShowEmoji(false); };
    if (menuOpenId || showEmoji) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [menuOpenId, showEmoji]);

  const sendMutation = useMutation({
    mutationFn: async ({ content, file_url }) => {
      await base44.entities.GlowGroupMessage.create({
        group_id: groupId, user_email: currentUser.email, content, file_url: file_url || undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] }),
    onError: () => toast.error("Failed to send message"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { await base44.entities.GlowGroupMessage.delete(id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["groupMessages", groupId] }); toast.success("Message deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const myMembership = members.find(m => m.user_email === currentUser.email);
      if (myMembership) await base44.entities.GlowGroupMember.delete(myMembership.id);
    },
    onSuccess: () => { toast.success("Left the group"); navigate(createPageUrl("GlowGroups")); },
    onError: () => toast.error("Could not leave group"),
  });

  const getUser = (email) => email === currentUser?.email ? currentUser : allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Member", email };

  const isMember = useMemo(() => members.some(m => m.user_email === currentUser?.email), [members, currentUser]);
  const isLeader = group?.leader_email === currentUser?.email;

  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const q = searchTerm.toLowerCase();
    return messages.filter(m => m.content?.toLowerCase().includes(q));
  }, [messages, searchTerm]);

  const memberDetails = useMemo(() => {
    const seen = new Set();
    const list = [];
    // Leader first
    if (group?.leader_email) { list.push({ ...getUser(group.leader_email), isLeader: true }); seen.add(group.leader_email); }
    members.forEach(m => { if (!seen.has(m.user_email)) { list.push({ ...getUser(m.user_email), isLeader: false }); seen.add(m.user_email); } });
    return list;
  }, [members, group, allUsers, currentUser]);

  if (!groupId || userLoading || groupLoading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F6F8FC" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-bold mb-2" style={{ color: "#0B1B3D" }}>Group not found</p>
          <Link to={createPageUrl("GlowGroups")} className="font-bold text-sm" style={{ color: "#0B3FD9" }}>← Back to GlowGroups</Link>
        </div>
      </div>
    );
  }

  let lastDay = null;
  const sendContent = (content, file_url) => sendMutation.mutate({ content, file_url: file_url || null });

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <div className="max-w-7xl mx-auto flex h-screen">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 border-b flex items-center gap-3 shrink-0" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
            <Link to={createPageUrl("GlowGroups")} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button onClick={() => setShowInfoPanel(v => !v)} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
              <Users className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setShowInfoPanel(v => !v)} className="flex-1 min-w-0 text-left">
              <div className="font-bold truncate" style={{ color: "#0B1B3D" }}>{group.name}</div>
              <div className="text-xs flex items-center gap-1 truncate" style={{ color: "#6B7FA0" }}>
                <Users className="w-3 h-3 shrink-0" /> <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                {group.country && <><span className="mx-1">·</span><span className="truncate">{group.country}</span></>}
              </div>
            </button>
            <button onClick={() => setShowSearch(v => !v)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}>
              <Search className="w-4 h-4" />
            </button>
            <button onClick={() => setShowInfoPanel(v => !v)} className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center shrink-0 transition lg:hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}>
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="px-4 py-2 border-b shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A97B5" }} />
                <input autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search messages..." className="w-full rounded-full py-2 pl-9 pr-9 text-sm focus:outline-none" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
                {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8A97B5" }}><X className="w-4 h-4" /></button>}
              </div>
            </div>
          )}

          {/* Events banner (if upcoming) */}
          {events.length > 0 && (
            <div className="px-4 py-2 border-b shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar" style={{ borderColor: "#E6ECF5", background: "linear-gradient(90deg, rgba(255,208,0,0.06), rgba(31,184,255,0.04))" }}>
              <Calendar className="w-4 h-4 shrink-0" style={{ color: "#CC7A00" }} />
              {events.slice(0, 3).map(ev => (
                <div key={ev.id} className="text-xs px-3 py-1 rounded-full whitespace-nowrap shrink-0" style={{ background: "#FFFFFF", border: "1px solid #FFE4A0", color: "#0B1B3D" }}>
                  <span className="font-bold">{ev.title}</span> · <span style={{ color: "#6B7FA0" }}>{ev.date ? format(parseDate(ev.date), "MMM d, HH:mm") : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1" style={{ background: "#F6F8FC" }}>
            {filteredMessages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                  <MessageCircle className="w-5 h-5" style={{ color: "#0B3FD9" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#0B1B3D" }}>{searchTerm ? "No matching messages" : "No messages yet"}</p>
                <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>{searchTerm ? "Try a different search term." : "Be the first to greet the group!"}</p>
              </div>
            )}
            {filteredMessages.map((msg) => {
              const isMine = msg.user_email === currentUser?.email;
              const sender = getUser(msg.user_email);
              const senderIsLeader = msg.user_email === group.leader_email;
              const msgDay = msg.created_date ? formatDayDivider(msg.created_date) : "";
              const showDayDivider = msgDay && msgDay !== lastDay;
              lastDay = msgDay;
              const canDelete = isMine || isLeader;

              return (
                <React.Fragment key={msg.id}>
                  {showDayDivider && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: "#FFFFFF", color: "#6B7FA0", border: "1px solid #E6ECF5" }}>{msgDay}</span>
                    </div>
                  )}
                  <div className={`flex gap-2 group ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(msg.user_email)}`} className="shrink-0 mt-1">
                        <img src={sender.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} alt={sender.full_name} />
                      </Link>
                    )}
                    <div className={`max-w-[80%] sm:max-w-[65%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && (
                        <div className="flex items-center gap-1 mb-0.5 px-1">
                          <span className="text-xs font-bold" style={{ color: "#4A5878" }}>{sender.full_name}</span>
                          {senderIsLeader && <Crown className="w-3 h-3" style={{ color: "#CC7A00" }} />}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {isMine && canDelete && (
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === msg.id ? null : msg.id); }} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {menuOpenId === msg.id && (
                              <div className="absolute right-0 mt-1 rounded-lg z-50 overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}>
                                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); deleteMutation.mutate(msg.id); }} className="flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap transition" style={{ color: "#DC2626" }}>
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="px-4 py-2.5 rounded-2xl text-sm break-words" style={isMine ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", borderTopRightRadius: "0.375rem", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.2)" } : { background: "#FFFFFF", color: "#0B1B3D", border: "1px solid #E6ECF5", borderTopLeftRadius: "0.375rem" }}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          {msg.file_url && (
                            <div className="mt-2">
                              {/\.(png|jpe?g|gif|webp)$/i.test(msg.file_url) ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer"><img src={msg.file_url} alt="Shared" className="max-w-[240px] rounded-lg" style={{ border: isMine ? "1px solid rgba(255,255,255,0.2)" : "1px solid #E6ECF5" }} /></a>
                              ) : (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold" style={isMine ? { background: "rgba(255,255,255,0.25)", color: "#FFFFFF" } : { background: "#F6F8FC", color: "#0B3FD9" }}>
                                  <Paperclip className="w-3 h-3" /> View file
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] mt-0.5 px-1" style={{ color: "#8A97B5" }}>{formatMessageTime(msg.created_date)}</div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          {isMember ? (
            <form onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; sendContent(draft); setDraft(""); }} className="px-3 sm:px-4 py-3 border-t flex items-center gap-2 shrink-0 relative" style={{ borderColor: "#E6ECF5", background: "#FFFFFF" }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || sendMutation.isPending} className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition shrink-0" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setUploadingFile(true);
                try {
                  const res = await base44.integrations.Core.UploadFile({ file });
                  sendContent(draft || `Shared a file`, res.file_url);
                  setDraft(""); e.target.value = "";
                } catch { toast.error("Failed to upload"); } finally { setUploadingFile(false); }
              }} />

              {/* Emoji */}
              <div className="relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); setShowEmoji(v => !v); }} className="w-11 h-11 rounded-2xl flex items-center justify-center transition shrink-0" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>
                  <Smile className="w-4 h-4" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-full mb-2 left-0 rounded-2xl p-2 grid grid-cols-6 gap-1 z-50" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.15)" }}>
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={(ev) => { ev.stopPropagation(); setDraft(d => d + e); setShowEmoji(false); inputRef.current?.focus(); }} className="w-9 h-9 rounded-lg text-lg hover:bg-[#F6F8FC] transition">{e}</button>
                    ))}
                  </div>
                )}
              </div>

              <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${group.name}...`} className="flex-1 h-11 rounded-2xl px-4 focus:outline-none min-w-0" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }} />
              <button type="submit" disabled={!draft.trim() || sendMutation.isPending || uploadingFile} className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-50 transition shrink-0" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
                {sendMutation.isPending || uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <div className="px-4 py-4 border-t flex items-center justify-between gap-3 shrink-0" style={{ borderColor: "#E6ECF5", background: "#FFFBEB" }}>
              <div className="text-sm" style={{ color: "#854D0E" }}>Join this group to send messages.</div>
              <button onClick={async () => { await base44.entities.GlowGroupMember.create({ user_email: currentUser.email, group_id: groupId }); queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] }); toast.success("Joined group! +20 XP ⚡"); }} className="px-4 py-2 rounded-full text-xs font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Join Group</button>
            </div>
          )}
        </div>

        {/* Info / Members Sidebar (desktop + toggleable mobile) */}
        <div className={`${showInfoPanel ? "fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto" : "hidden lg:flex"} flex-col w-full lg:w-80 xl:w-96 shrink-0 bg-white`}>
          {showInfoPanel && <div className="absolute inset-0 bg-black/30 lg:hidden" onClick={() => setShowInfoPanel(false)} />}
          <div className="relative flex flex-col h-full w-[90%] max-w-sm lg:w-full lg:max-w-none ml-auto bg-white border-l" style={{ borderColor: "#E6ECF5" }}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center gap-2 shrink-0" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
              <button onClick={() => setShowInfoPanel(false)} className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}><X className="w-4 h-4" /></button>
              <h3 className="font-bold text-base" style={{ color: "#0B1B3D" }}>Group Info</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Group Header */}
              <div className="px-5 py-6 text-center border-b" style={{ borderColor: "#E6ECF5" }}>
                <div className="w-20 h-20 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF" }}>✨</div>
                <div className="font-bold text-lg" style={{ color: "#0B1B3D" }}>{group.name}</div>
                {group.country && <div className="text-xs mt-1" style={{ color: "#6B7FA0" }}>📍 {group.country}</div>}
                {group.description && <div className="text-sm mt-3 leading-relaxed" style={{ color: "#4A5878" }}>{group.description}</div>}
                <div className="flex justify-center gap-4 mt-4 text-center">
                  <div><div className="font-bold text-lg" style={{ color: "#0B3FD9" }}>{members.length}</div><div className="text-[10px] uppercase font-bold" style={{ color: "#8A97B5" }}>Members</div></div>
                  <div><div className="font-bold text-lg" style={{ color: "#0B3FD9" }}>{messages.length}</div><div className="text-[10px] uppercase font-bold" style={{ color: "#8A97B5" }}>Messages</div></div>
                  <div><div className="font-bold text-lg" style={{ color: "#0B3FD9" }}>{events.length}</div><div className="text-[10px] uppercase font-bold" style={{ color: "#8A97B5" }}>Events</div></div>
                </div>
              </div>

              {/* Upcoming Events */}
              {events.length > 0 && (
                <div className="px-5 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#6B7FA0" }}><Calendar className="w-3.5 h-3.5" /> Upcoming Events</div>
                  <div className="space-y-2">
                    {events.slice(0, 3).map(ev => (
                      <div key={ev.id} className="rounded-xl p-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                        <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{ev.title}</div>
                        {ev.date && <div className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{format(parseDate(ev.date), "EEE, MMM d · HH:mm")}</div>}
                        {ev.location && <div className="text-xs mt-0.5 truncate" style={{ color: "#6B7FA0" }}>📍 {ev.location}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              <div className="px-5 py-4">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#6B7FA0" }}><Users className="w-3.5 h-3.5" /> Members ({memberDetails.length})</div>
                <div className="space-y-1">
                  {memberDetails.map(m => (
                    <Link key={m.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(m.email)}`} className="flex items-center gap-3 px-2 py-2 rounded-lg transition hover:bg-[#F6F8FC] no-underline">
                      <img src={m.profile_picture_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover" style={{ border: "1px solid #E6ECF5" }} alt={m.full_name} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate flex items-center gap-1" style={{ color: "#0B1B3D" }}>
                          {m.full_name} {m.email === currentUser?.email && <span className="text-[10px] font-normal" style={{ color: "#8A97B5" }}>(You)</span>}
                        </div>
                        {m.isLeader && <div className="text-[10px] flex items-center gap-1 font-bold" style={{ color: "#CC7A00" }}><Crown className="w-3 h-3" /> Leader</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            {isMember && !isLeader && (
              <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: "#E6ECF5" }}>
                <button onClick={() => { if (confirm("Leave this group?")) leaveMutation.mutate(); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <LogOut className="w-4 h-4" /> Leave Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* Override global cyan/violet scrollbar to match blue palette on this page */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CFD9EA; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #B8C5DC; }
        * { scrollbar-width: thin; scrollbar-color: #CFD9EA transparent; }
      `}</style>
    </div>
  );
}