import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Pin, ArrowUpDown, ExternalLink } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

/**
 * Sortable per-post performance table for the Leader Analytics dashboard.
 * Columns: published date, content preview, likes, comments, total engagement, pinned status.
 */
export default function LeaderPostPerformanceTable({ posts = [], comments = [] }) {
  const [sortBy, setSortBy] = useState("engagement");
  const [sortDir, setSortDir] = useState("desc");

  const rows = useMemo(() => {
    return posts.map(p => {
      const c = comments.filter(x => x.drop_id === p.id).length;
      const likes = p.likes_count || 0;
      return {
        id: p.id,
        user_email: p.user_email,
        verse: p.verse || "",
        reflection: p.reflection || "",
        media_url: p.media_url,
        created_date: p.created_date,
        likes,
        comments: c,
        engagement: likes + c,
        pinned: !!p.pinned,
      };
    });
  }, [posts, comments]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let av = a[sortBy];
      let bv = b[sortBy];
      if (sortBy === "created_date") { av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime(); }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const HeadBtn = ({ col, label, align = "left" }) => (
    <button
      onClick={() => toggleSort(col)}
      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition hover:opacity-70 ${align === "right" ? "ml-auto" : ""}`}
      style={{ color: sortBy === col ? "#0B3FD9" : "#6B7FA0" }}
    >
      {label} <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl py-12 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
        No posts yet for this leader.
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Per-Post Performance</h3>
        <p className="text-xs mt-0.5" style={{ color: "#8A97B5" }}>{rows.length} posts · click any column to sort.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F6F8FC" }}>
              <th className="text-left px-4 py-3"><HeadBtn col="created_date" label="Published" /></th>
              <th className="text-left px-4 py-3 min-w-[280px]"><span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#6B7FA0" }}>Content</span></th>
              <th className="text-right px-3 py-3"><HeadBtn col="likes" label="Likes" align="right" /></th>
              <th className="text-right px-3 py-3"><HeadBtn col="comments" label="Comments" align="right" /></th>
              <th className="text-right px-3 py-3"><HeadBtn col="engagement" label="Engagement" align="right" /></th>
              <th className="text-center px-3 py-3"><span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#6B7FA0" }}>Pinned</span></th>
              <th className="text-center px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className="border-t" style={{ borderColor: "#F0F4FA" }}>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#6B7FA0" }}>
                  {row.created_date ? format(new Date(row.created_date), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 max-w-[420px]">
                    {row.media_url && (
                      <img src={row.media_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      {row.verse && <p className="font-bold text-xs truncate" style={{ color: "#0B3FD9" }}>{row.verse}</p>}
                      <p className="text-xs truncate" style={{ color: "#3A4A6B" }}>
                        {row.reflection?.replace(/<[^>]*>/g, "") || (row.media_url ? "(image post)" : "(no text)")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-bold" style={{ color: "#EF4444" }}>
                  <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {row.likes}</span>
                </td>
                <td className="px-3 py-3 text-right font-bold" style={{ color: "#8B5CF6" }}>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {row.comments}</span>
                </td>
                <td className="px-3 py-3 text-right font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>
                  {row.engagement}
                </td>
                <td className="px-3 py-3 text-center">
                  {row.pinned ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style={{ background: "rgba(255, 208, 0, 0.18)", color: "#CC7A00" }}>
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "#D6E4FF" }}>—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <Link
                    to={`${createPageUrl("Post")}?id=${encodeURIComponent(row.id)}&user=${encodeURIComponent(row.user_email)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition hover:opacity-80"
                    style={{ background: "#EEF3FF", color: "#0B3FD9" }}
                  >
                    Open <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}