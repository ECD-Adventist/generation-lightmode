import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, Trash2, CheckCircle2, XCircle, Calendar as CalendarIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameMonth, isSameDay, parseISO } from "date-fns";

const STATUS_STYLES = {
  scheduled: { bg: "#FFD00020", color: "#FFD000", icon: Clock, label: "Scheduled" },
  published: { bg: "#10B98120", color: "#10B981", icon: CheckCircle2, label: "Published" },
  cancelled: { bg: "#6B728020", color: "#9CA3AF", icon: XCircle, label: "Cancelled" },
  failed: { bg: "#EF444420", color: "#EF4444", icon: XCircle, label: "Failed" },
};

export default function ScheduledPostsCalendar() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["scheduledPosts"],
    queryFn: () => base44.entities.ScheduledPost.list("-scheduled_for", 200),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.update(id, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledPosts"] });
      toast.success("Scheduled post cancelled");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledPosts"] });
      toast.success("Removed from calendar");
    },
  });

  // Build calendar grid for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      if (!p.scheduled_for) return;
      const key = format(parseISO(p.scheduled_for), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const postsOnSelectedDay = postsByDay[selectedKey] || [];

  const upcomingCount = posts.filter((p) => p.status === "scheduled").length;

  return (
    <div className="bg-[#121826] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD000]/10 border border-[#FFD000]/30 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-[#FFD000]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Content Calendar</h3>
            <p className="text-xs text-gray-500">{upcomingCount} upcoming · {posts.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="w-8 h-8 rounded-lg bg-[#0B0F1A] hover:bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-bold text-white min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg bg-[#0B0F1A] hover:bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayPosts = postsByDay[key] || [];
              const hasScheduled = dayPosts.some((p) => p.status === "scheduled");
              const hasPublished = dayPosts.some((p) => p.status === "published");
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square rounded-lg p-1.5 text-left transition border ${
                    isSelected
                      ? "bg-[#00CFFF]/10 border-[#00CFFF]/50"
                      : inMonth
                      ? "bg-[#0B0F1A] border-white/5 hover:border-white/20"
                      : "bg-transparent border-transparent opacity-40"
                  }`}
                >
                  <div className={`text-xs font-bold ${isToday ? "text-[#FFD000]" : inMonth ? "text-white" : "text-gray-600"}`}>
                    {format(day, "d")}
                  </div>
                  {dayPosts.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex items-center gap-0.5">
                      {hasScheduled && <div className="flex-1 h-1 rounded-full bg-[#FFD000]" />}
                      {hasPublished && <div className="flex-1 h-1 rounded-full bg-[#10B981]" />}
                    </div>
                  )}
                  {dayPosts.length > 0 && (
                    <div className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#00CFFF] text-black text-[9px] font-bold flex items-center justify-center">
                      {dayPosts.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500 flex-wrap">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-[#FFD000]" /> Scheduled</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-[#10B981]" /> Published</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FFD000]" /> Today</div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="p-5 max-h-[600px] overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-widest text-[#00CFFF] mb-1">
            {format(selectedDate, "EEEE")}
          </div>
          <h4 className="text-lg font-bold text-white mb-4">
            {format(selectedDate, "MMMM d, yyyy")}
          </h4>

          {isLoading && <p className="text-xs text-gray-500">Loading...</p>}
          {!isLoading && postsOnSelectedDay.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No posts scheduled
            </div>
          )}

          <div className="space-y-3">
            {postsOnSelectedDay
              .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))
              .map((post) => {
                const style = STATUS_STYLES[post.status] || STATUS_STYLES.scheduled;
                const Icon = style.icon;
                return (
                  <div key={post.id} className="bg-[#0B0F1A] border border-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: style.bg, color: style.color }}
                      >
                        <Icon className="w-3 h-3" />
                        {style.label}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {format(parseISO(post.scheduled_for), "HH:mm")}
                      </span>
                    </div>

                    {post.verse && (
                      <div className="text-xs text-[#00CFFF] font-semibold truncate mb-1">{post.verse}</div>
                    )}
                    {post.reflection && (
                      <div className="text-xs text-gray-400 line-clamp-2">
                        {post.reflection.replace(/<[^>]*>/g, " ").slice(0, 150)}...
                      </div>
                    )}
                    {post.media_url && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                        <ImageIcon className="w-3 h-3" /> Has image
                      </div>
                    )}

                    {post.status === "scheduled" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                        <button
                          onClick={() => cancelMutation.mutate(post.id)}
                          className="flex-1 text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-white/5 py-1.5 rounded transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(post.id)}
                          className="flex-1 text-[11px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded transition inline-flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                    {post.status === "failed" && post.error_message && (
                      <div className="mt-2 text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 rounded p-2">
                        {post.error_message}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}