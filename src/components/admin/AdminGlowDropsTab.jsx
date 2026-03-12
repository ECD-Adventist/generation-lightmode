import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminGlowDropsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["admin_drops_all"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 100)
  });

  const filteredDrops = drops.filter(d => filter === "all" || d.status === filter);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.GlowDrop.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_drops_all"] });
      toast.success("Status updated");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Glow Drops Moderation</h1>
          <p className="text-sm md:text-base text-gray-400 mt-1">Review and approve user-submitted content.</p>
        </div>
        <div className="flex bg-[#121826] p-1 rounded-lg border border-white/5 w-full md:w-auto overflow-x-auto">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium capitalize transition whitespace-nowrap ${filter === f ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDrops.map(drop => (
            <div key={drop.id} className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] flex items-center justify-center font-bold text-sm text-black">
                    {drop.user_email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white truncate max-w-[150px] sm:max-w-[200px]">{drop.user_email}</p>
                    <p className="text-xs text-gray-500">{new Date(drop.created_date).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  drop.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  drop.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {drop.status || 'pending'}
                </span>
              </div>

              <div className="flex-1 bg-[#0B0F1A] rounded-xl p-4 border border-white/5">
                <p className="text-[#00CFFF] font-bold mb-2 text-sm">{drop.verse || "No verse attached"}</p>
                <p className="text-gray-300 text-sm leading-relaxed">{drop.reflection || "No reflection"}</p>
                
                {drop.media_url && (
                  <div className="mt-4 relative rounded-lg overflow-hidden border border-white/10 bg-black h-40 group">
                    <img src={drop.media_url} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Attachment" />
                  </div>
                )}
              </div>

              {filter === 'pending' && (
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => updateStatus.mutate({ id: drop.id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 font-semibold text-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => updateStatus.mutate({ id: drop.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-semibold text-sm flex items-center justify-center gap-2 transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredDrops.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500 bg-[#121826] rounded-2xl border border-dashed border-white/10">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No drops found for '{filter}'.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}