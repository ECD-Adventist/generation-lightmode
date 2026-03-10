import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, CheckCircle2, UserCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PrayerRequestsTab({ user }) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["prayerRequests"],
    queryFn: () => base44.entities.PrayerRequest.list('-created_date')
  });

  const { data: supports = [] } = useQuery({
    queryKey: ["prayerSupports"],
    queryFn: () => base44.entities.PrayerSupport.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list()
  });

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await base44.entities.PrayerRequest.create({
        user_email: user.email,
        content,
        is_anonymous: isAnonymous,
        answered: false
      });
      setContent("");
      setIsAnonymous(false);
      toast.success("Prayer request posted!");
      queryClient.invalidateQueries({ queryKey: ["prayerRequests"] });
    } catch (err) {
      toast.error("Failed to post");
    }
  };

  const handleSupport = async (request) => {
    try {
      const existing = supports.find(s => s.request_id === request.id && s.user_email === user.email);
      if (existing) {
        await base44.entities.PrayerSupport.delete(existing.id);
      } else {
        await base44.entities.PrayerSupport.create({
          request_id: request.id,
          user_email: user.email
        });
        if (request.user_email !== user.email && !request.is_anonymous) {
          await base44.entities.Notification.create({
            user_email: request.user_email,
            type: "system",
            message: `${user.full_name} is praying for your request!`,
            link: "/Dashboard"
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["prayerSupports"] });
    } catch (err) {
      toast.error("Error updating support");
    }
  };

  const handleAnswered = async (id) => {
    try {
      await base44.entities.PrayerRequest.update(id, { answered: true });
      toast.success("Marked as answered!");
      queryClient.invalidateQueries({ queryKey: ["prayerRequests"] });
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const getUserInfo = (email) => users.find(u => u.email === email);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="bg-[#121826]/80 p-6 rounded-2xl border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-4">Share a Prayer Request</h3>
        <form onSubmit={handlePost} className="space-y-4">
          <Textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="What can the community pray for?" 
            className="bg-[#0B0F1A] border-white/10 text-white min-h-[100px] text-lg rounded-xl p-4"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white transition">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded bg-[#0B0F1A] border-white/10 w-4 h-4" />
              Post Anonymously
            </label>
            <Button type="submit" disabled={!content.trim()} className="bg-[#00CFFF] text-black hover:bg-white font-bold rounded-xl px-6">Post Request</Button>
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
            <div key={req.id} className={`bg-[#121826]/50 p-6 rounded-2xl border transition-all ${req.answered ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-white/20'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                    {req.is_anonymous ? <UserCircle className="w-8 h-8 text-gray-500" /> : (reqUser?.profile_picture_url ? <img src={reqUser.profile_picture_url} className="w-full h-full object-cover" /> : <span className="font-bold">{reqUser?.full_name?.charAt(0) || "?"}</span>)}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2 text-lg">
                      {req.is_anonymous ? 'Anonymous Believer' : reqUser?.full_name}
                      {req.answered && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Answered</span>}
                    </div>
                    <div className="text-sm text-gray-500">{req.created_date ? formatDistanceToNow(new Date(req.created_date)) + ' ago' : 'Recently'}</div>
                  </div>
                </div>
                {(isMine || isLeader) && !req.answered && (
                  <Button variant="outline" size="sm" onClick={() => handleAnswered(req.id)} className="border-white/10 hover:bg-white/5 text-gray-300 rounded-lg text-xs">
                    Mark Answered
                  </Button>
                )}
              </div>
              <p className="text-gray-200 mb-6 whitespace-pre-wrap leading-relaxed text-lg">{req.content}</p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                <Button 
                  variant={isSupporting ? "default" : "secondary"}
                  onClick={() => handleSupport(req)}
                  className={`gap-2 rounded-xl transition-all ${isSupporting ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  <Heart className={`w-5 h-5 ${isSupporting ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  {isSupporting ? 'I am praying for this' : 'Pray for this'}
                  {reqSupports.length > 0 && <span className="ml-1 opacity-70 font-bold">({reqSupports.length})</span>}
                </Button>
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-[#121826]/30 rounded-2xl border border-white/5">
            No prayer requests yet. Be the first to share one.
          </div>
        )}
      </div>
    </div>
  );
}