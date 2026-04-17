import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Search, X, ShieldCheck, Send, Image as ImageIcon, CheckCircle2, Clock } from "lucide-react";

const CATEGORIES = ["Devotional", "Testimony", "Scripture", "Prayer", "Encouragement", "Teaching", "Announcement"];
const STATUS_OPTIONS = ["approved", "pending", "rejected"];
const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function AdminCustomPostTab({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    verse: "",
    reflection: "",
    hashtags: "",
    category: "Devotional",
    status: "approved",
    likes_count: 0,
    post_as_email: user?.email || "",
    post_as_name: user?.full_name || "",
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showUserPicker, setShowUserPicker] = useState(false);

  // Load all public users for attribution picker
  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
  });

  // Recent custom posts (for visibility/feedback)
  const { data: recentPosts = [] } = useQuery({
    queryKey: ["adminRecentPosts"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 10),
  });

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers.slice(0, 20);
    return allUsers
      .filter(
        (u) =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allUsers, userSearch]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setUploadedUrl(null);
  };

  const clearImage = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!form.verse.trim() && !form.reflection.trim() && !file) {
        throw new Error("Add a verse, reflection, or image before posting.");
      }
      if (!form.post_as_email) {
        throw new Error("Select which user to post as.");
      }

      let mediaUrl = uploadedUrl;
      if (file && !uploadedUrl) {
        setUploading(true);
        const res = await base44.integrations.Core.UploadFile({ file });
        mediaUrl = res.file_url;
        setUploadedUrl(mediaUrl);
        setUploading(false);
      }

      const payload = {
        user_email: form.post_as_email,
        verse: form.verse || undefined,
        reflection: form.reflection || undefined,
        hashtags: form.hashtags || undefined,
        category: form.category || undefined,
        status: form.status,
        likes_count: Number(form.likes_count) || 0,
        media_url: mediaUrl || undefined,
      };

      return await base44.entities.GlowDrop.create(payload);
    },
    onSuccess: (drop) => {
      toast.success(`Custom post published as ${form.post_as_name || form.post_as_email}`);
      // Reset content fields but keep attribution for convenience
      setForm((prev) => ({
        ...prev,
        verse: "",
        reflection: "",
        hashtags: "",
        likes_count: 0,
      }));
      clearImage();
      queryClient.invalidateQueries({ queryKey: ["adminRecentPosts"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["glowDropsFeed"] });
    },
    onError: (err) => {
      setUploading(false);
      toast.error(err.message || "Failed to publish post");
    },
  });

  const pickUser = (u) => {
    setForm((prev) => ({ ...prev, post_as_email: u.email, post_as_name: u.full_name || u.email }));
    setShowUserPicker(false);
    setUserSearch("");
  };

  return (
    <div className="max-w-5xl space-y-6 font-['Inter']">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FFD000] to-[#FF9F1A]">
          <ShieldCheck className="w-6 h-6 text-black" />
        </div>
        <div>
          <p className="text-xs text-[#FFD000] font-bold uppercase tracking-widest">Super Admin</p>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Custom Posts</h1>
          <p className="text-sm text-gray-400 mt-1">Publish Glow Drops on behalf of any user with full control.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* Composer */}
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Post as */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Post As</Label>
            <button
              type="button"
              onClick={() => setShowUserPicker(!showUserPicker)}
              className="w-full flex items-center gap-3 bg-[#0B0F1A] border border-white/10 hover:border-[#00CFFF]/40 rounded-xl p-3 transition text-left"
            >
              <img
                src={allUsers.find((u) => u.email === form.post_as_email)?.profile_picture_url || defaultAvatar}
                className="w-10 h-10 rounded-full object-cover"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{form.post_as_name || "Select user"}</div>
                <div className="text-xs text-gray-500 truncate">{form.post_as_email || "No user selected"}</div>
              </div>
              <Search className="w-4 h-4 text-gray-400" />
            </button>

            {showUserPicker && (
              <div className="mt-2 bg-[#0B0F1A] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-[#121826] border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-6 text-sm text-gray-500">No users found</div>
                  )}
                  {filteredUsers.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => pickUser(u)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition text-left border-b border-white/5 last:border-b-0"
                    >
                      <img src={u.profile_picture_url || defaultAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">{u.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      </div>
                      {u.email === form.post_as_email && <CheckCircle2 className="w-4 h-4 text-[#00CFFF]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Verse */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Bible Verse (Optional)</Label>
            <Input
              placeholder="e.g. Matthew 5:14"
              value={form.verse}
              onChange={(e) => setForm({ ...form, verse: e.target.value })}
              className="bg-[#0B0F1A] border-white/10 text-white placeholder-gray-600"
            />
          </div>

          {/* Reflection */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Reflection / Content</Label>
            <Textarea
              placeholder="Write the post content..."
              value={form.reflection}
              onChange={(e) => setForm({ ...form, reflection: e.target.value })}
              className="bg-[#0B0F1A] border-white/10 text-white placeholder-gray-600 min-h-[160px]"
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Hashtags</Label>
            <Input
              placeholder="#FaithAlwaysOn #GlowDrop"
              value={form.hashtags}
              onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
              className="bg-[#0B0F1A] border-white/10 text-[#FFD000] placeholder-gray-600"
            />
          </div>

          {/* Image */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Image (Optional)</Label>
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} className="max-h-64 rounded-xl border border-white/10 object-cover" alt="preview" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition"
                  type="button"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 bg-[#0B0F1A] border-2 border-dashed border-white/10 hover:border-[#00CFFF]/40 rounded-xl p-4 cursor-pointer transition">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">Click to upload an image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Category + Status + Likes row */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#0B0F1A] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00CFFF]/40"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#0B0F1A] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00CFFF]/40"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Initial Likes</Label>
              <Input
                type="number"
                min="0"
                value={form.likes_count}
                onChange={(e) => setForm({ ...form, likes_count: e.target.value })}
                className="bg-[#0B0F1A] border-white/10 text-white"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              <ShieldCheck className="w-3 h-3 inline mr-1 text-[#FFD000]" />
              This post will appear on the feed immediately if status is <b className="text-white">approved</b>.
            </p>
            <Button
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending || uploading}
              className="h-11 px-6 bg-gradient-to-r from-[#FFD000] to-[#FF9F1A] hover:from-[#FFD000] hover:to-[#FF8F00] text-black font-bold shadow-lg shadow-yellow-500/20"
            >
              {postMutation.isPending || uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Publishing...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Publish Post</>
              )}
            </Button>
          </div>
        </div>

        {/* Recent posts sidebar */}
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#00CFFF]" />
            <h3 className="text-sm font-bold text-white">Recent Posts</h3>
          </div>
          <div className="space-y-3">
            {recentPosts.length === 0 && (
              <p className="text-xs text-gray-500">No posts yet.</p>
            )}
            {recentPosts.map((post) => {
              const author = allUsers.find((u) => u.email === post.user_email);
              const statusColor =
                post.status === "approved" ? "#10B981" :
                post.status === "pending" ? "#FFD000" : "#EF4444";
              return (
                <div key={post.id} className="bg-[#0B0F1A] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={author?.profile_picture_url || defaultAvatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                    <div className="text-xs text-white truncate flex-1">{author?.full_name || post.user_email}</div>
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{ background: `${statusColor}20`, color: statusColor }}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.verse && <div className="text-xs text-[#00CFFF] font-semibold truncate">{post.verse}</div>}
                  {post.reflection && <div className="text-xs text-gray-400 line-clamp-2 mt-1">{post.reflection}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}