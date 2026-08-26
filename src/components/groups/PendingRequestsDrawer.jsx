import { Loader2, UserPlus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PendingRequestsDrawer({ open, onClose, requests, getUser, mutation }) {
  if (!open) return null;
  const decideAll = (action) => {
    const label = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`${label[0].toUpperCase() + label.slice(1)} all ${requests.length} pending requests?`)) return;
    requests.forEach((request) => mutation.mutate({ request_id: request.id, action }));
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}>
      <section className="absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl bg-white shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[420px] md:max-h-none md:rounded-none" onClick={(event) => event.stopPropagation()} aria-label="Pending group requests">
        <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
          <UserPlus className="h-5 w-5 text-blue-700" />
          <div className="min-w-0 flex-1"><h2 className="font-bold text-slate-900">Pending Requests</h2><p className="text-xs text-slate-600">{requests.length} awaiting a decision</p></div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-label="Close pending requests"><X className="h-5 w-5" /></button>
        </header>
        {requests.length > 1 && <div className="flex gap-2 border-b border-gray-200 p-3"><button type="button" onClick={() => decideAll("approve")} className="min-h-11 flex-1 rounded-full bg-green-100 px-4 text-sm font-bold text-green-800">Approve All</button><button type="button" onClick={() => decideAll("reject")} className="min-h-11 flex-1 rounded-full bg-red-100 px-4 text-sm font-bold text-red-800">Reject All</button></div>}
        <div className="max-h-[65dvh] space-y-2 overflow-y-auto p-3 md:max-h-[calc(100dvh-140px)]">
          {requests.length === 0 ? <div className="py-16 text-center text-sm text-slate-600">No pending requests.</div> : requests.map((request) => {
            const requester = getUser(request.user_email);
            const busy = mutation.isPending && mutation.variables?.request_id === request.id;
            return <article key={request.id} className="rounded-2xl border border-gray-200 p-3"><div className="flex items-center gap-3"><img src={requester.profile_picture_url} alt="" width="44" height="44" loading="lazy" decoding="async" className="h-11 w-11 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{requester.full_name}</p><p className="text-xs text-slate-600">{request.created_date ? formatDistanceToNow(new Date(request.created_date), { addSuffix: true }) : "Recently"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={() => mutation.mutate({ request_id: request.id, action: "approve" })} className="min-h-11 rounded-full bg-green-100 text-sm font-bold text-green-800 disabled:opacity-50">{busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Approve"}</button><button type="button" disabled={busy} onClick={() => mutation.mutate({ request_id: request.id, action: "reject" })} className="min-h-11 rounded-full bg-red-100 text-sm font-bold text-red-800 disabled:opacity-50">Reject</button></div></article>;
          })}
        </div>
      </section>
    </div>
  );
}