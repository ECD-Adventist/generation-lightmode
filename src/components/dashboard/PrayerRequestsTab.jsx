import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, CheckCircle2, UserCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PrayerMatcher from "@/components/prayer/PrayerMatcher";

export default function PrayerRequestsTab({ user }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Other");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["prayerWallDashboard"],
    queryFn: async () => (await base44.functions.invoke("listPrayerRequests", { limit: 100, include_comments: false }))?.data?.requests || [],
  });
  const { data: supports = [] } = useQuery({ queryKey: ["prayerSupports"], queryFn: () => base44.entities.PrayerSupport.list() });
  const { data: users = [] } = useQuery({ queryKey: ["allUsers"], queryFn: () => base44.entities.User.list() });

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      // Server-side create: anonymous prayers are stored without the author's email.
      await base44.functions.invoke("submitPrayerRequest", { content, category, is_anonymous: isAnonymous });
      setContent(""); setCategory("Other"); setIsAnonymous(false);
      toast.success("Prayer request posted!");
      queryClient.invalidateQueries({ queryKey: ["prayerWallDashboard"] });
    } catch (err) { toast.error("Failed to post"); }
  };

  const handleSupport = async (request) => {
    try {
      const existing = supports.find(s => s.request_id === request.id && s.user_email === user.email);
      if (existing) {
        await base44.entities.PrayerSupport.delete(existing.id);
      } else {
        await base44.entities.PrayerSupport.create({ request_id: request.id, user_email: user.email });
        if (request.user_email !== user.email && !request.is_anonymous) {
          await base44.entities.Notification.create({ user_email: request.user_email, type: "system", message: `${user.full_name} is praying for your request!`, link: "/Dashboard" });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["prayerSupports"] });
    } catch (err) { toast.error("Error updating support"); }
  };

  const handleAnswered = async (id) => {
    try {
      await base44.entities.PrayerRequest.update(id, { answered: true });
      toast.success("Marked as answered!");
      queryClient.invalidateQueries({ queryKey: ["prayerWallDashboard"] });
    } catch (err) { toast.error("Failed to update"); }
  };

  const getUserInfo = (email) => users.find(u => u.email === email);
  const inputStyle = { background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl font-['Inter']">
      {/* Prayer Matcher */}
      <div className="p-6 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-4" style={{ color: "#0B3FD9" }}>Find Prayer Matches 🙏</h3>
        <p className="text-sm mb-4" style={{ color: "#6B7FA0" }}>Get matched with prayer requests that align with your interests and territory.</p>
        <PrayerMatcher currentUser={user} />
      </div>

      <div className="p-6 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <h3 className="text-xl font-bold font-['Space_Grotesk'] mb-4" style={{ color: "#0B3FD9" }}>Share a Prayer Request</h3>
        <form onSubmit={handlePost} className="space-y-4">
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What can the community pray for?" className="min-h-[100px] text-lg rounded-xl p-4" style={inputStyle} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl px-4 py-2 text-sm outline-none" style={inputStyle}>
                <option value="Health">Health</option>
                <option value="Family">Family</option>
                <option value="Finance">Finance</option>
                <option value="Guidance">Guidance</option>
                <option value="Other">Other</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer transition" style={{ color: "#6B7FA0" }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded w-4 h-4 accent-[#0B3FD9]" />
                Post Anonymously
              </label>
            </div>
            <Button type="submit" disabled={!content.trim()} className="font-bold rounded-xl px-6" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>Post Request</Button>
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {requests.map(req => {
          const reqUser = getUserInfo(req.user_email);
          const reqSupports = supports.filter(s => s.request_id === req.id);
          const isSupporting = reqSupports.some(s => s.user_email === user.email);
          const isMine = req.user_email === user.email;
          const isLeader = user.role === 'GlowGroup Leader' || user.role === 'Admin' || user.role === 'Super Admin';

          return (
            <div key={req.id} className="p-6 rounded-[1.5rem] transition-all" style={req.answered ? { background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.3)" } : { background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5" }}>
                    {req.is_anonymous ? <UserCircle className="w-8 h-8" style={{ color: "#8A97B5" }} /> : (reqUser?.profile_picture_url ? <img src={reqUser.profile_picture_url} className="w-full h-full object-cover" /> : <span className="font-bold" style={{ color: "#4A5878" }}>{reqUser?.full_name?.charAt(0) || "?"}</span>)}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2 text-lg" style={{ color: "#0B1B3D" }}>
                      {req.is_anonymous ? 'Anonymous Believer' : reqUser?.full_name}
                      {req.answered && <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#16A34A" }}><CheckCircle2 className="w-3 h-3" /> Answered</span>}
                    </div>
                    <div className="text-sm flex items-center gap-2" style={{ color: "#8A97B5" }}>
                      {req.created_date ? formatDistanceToNow(new Date(req.created_date)) + ' ago' : 'Recently'}
                      {req.category && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#F6F8FC", color: "#4A5878" }}>{req.category}</span>}
                    </div>
                  </div>
                </div>
                {(isMine || isLeader) && !req.answered && (
                  <Button variant="outline" size="sm" onClick={() => handleAnswered(req.id)} className="rounded-lg text-xs" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#4A5878" }}>
                    Mark Answered
                  </Button>
                )}
              </div>
              <p className="mb-6 whitespace-pre-wrap leading-relaxed text-lg" style={{ color: "#3A4A6B" }}>{req.content}</p>
              <div className="flex items-center gap-4 border-t pt-4" style={{ borderColor: "#E0EAF5" }}>
                <Button onClick={() => handleSupport(req)} className="gap-2 rounded-xl transition-all" style={isSupporting ? { background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)" } : { background: "#F6F8FC", color: "#0B1B3D", border: "1px solid #E0EAF5" }}>
                  <Heart className="w-5 h-5" style={{ fill: isSupporting ? "#EF4444" : "transparent", color: isSupporting ? "#EF4444" : "#8A97B5" }} />
                  {isSupporting ? 'I am praying for this' : 'Pray for this'}
                  {reqSupports.length > 0 && <span className="ml-1 opacity-70 font-bold">({reqSupports.length})</span>}
                </Button>
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="text-center py-12 rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#8A97B5" }}>
            No prayer requests yet. Be the first to share one.
          </div>
        )}
      </div>
    </div>
  );
}