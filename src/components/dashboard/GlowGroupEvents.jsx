import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, MapPin, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

export default function GlowGroupEvents({ group, user }) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", date: "", location: "" });
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({ queryKey: ["groupEvents", group.id], queryFn: () => base44.entities.GlowGroupEvent.filter({ group_id: group.id }) });
  const { data: rsvps = [] } = useQuery({
    queryKey: ["groupRSVPs", group.id],
    queryFn: async () => { const allRsvps = await base44.entities.GlowGroupEventRSVP.list(); const eventIds = events.map(e => e.id); return allRsvps.filter(r => eventIds.includes(r.event_id)); },
    enabled: events.length > 0
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    await base44.entities.GlowGroupEvent.create({ group_id: group.id, ...formData, date: new Date(formData.date).toISOString() });
    toast.success("Event created!");
    setFormData({ title: "", description: "", date: "", location: "" });
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["groupEvents", group.id] });
  };

  const handleRSVP = async (eventId, status) => {
    const existing = rsvps.find(r => r.event_id === eventId && r.user_email === user.email);
    if (existing) await base44.entities.GlowGroupEventRSVP.update(existing.id, { status });
    else await base44.entities.GlowGroupEventRSVP.create({ event_id: eventId, user_email: user.email, status });
    toast.success("RSVP updated");
    queryClient.invalidateQueries({ queryKey: ["groupRSVPs", group.id] });
  };

  const inputStyle = { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" };

  return (
    <div className="space-y-6 font-['Inter']">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Group Events</h3>
        {group.leader_email === user.email && (
          <Button onClick={() => setCreating(!creating)} className="rounded-xl" style={{ background: creating ? "#F6F8FC" : "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: creating ? "#4A5878" : "#FFFFFF", border: creating ? "1px solid #E6ECF5" : "none" }}>
            {creating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Event</>}
          </Button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="p-6 rounded-2xl space-y-4" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF" }}>
          <div className="space-y-2">
            <Label className="text-xs uppercase" style={{ color: "#6B7FA0" }}>Event Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase" style={{ color: "#6B7FA0" }}>Date & Time</Label>
              <Input type="datetime-local" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={inputStyle} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase" style={{ color: "#6B7FA0" }}>Location / Link</Label>
              <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={inputStyle} />
            </div>
          </div>
          <Button type="submit" className="w-full font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", border: "none" }}>Create Event</Button>
        </form>
      )}

      <div className="grid gap-4">
        {events.length === 0 && !creating && <div className="text-center p-8" style={{ color: "#8A97B5" }}>No upcoming events.</div>}
        {events.map(event => {
          const eventRsvps = rsvps.filter(r => r.event_id === event.id);
          const goingCount = eventRsvps.filter(r => r.status === 'going').length;
          const myRsvp = eventRsvps.find(r => r.user_email === user.email)?.status;
          return (
            <div key={event.id} className="p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
              <div>
                <h4 className="text-lg font-bold mb-2" style={{ color: "#0B1B3D" }}>{event.title}</h4>
                <div className="flex flex-col gap-1 text-sm" style={{ color: "#6B7FA0" }}>
                  <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" style={{ color: "#0B3FD9" }} /> {event.date ? format(new Date(event.date), 'PPp') : ''}</div>
                  {event.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: "#CC7A00" }} /> {event.location}</div>}
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" style={{ color: "#1FB8FF" }} /> {goingCount} going</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-[120px]">
                {[
                  { status: "going", label: "Going", activeStyle: { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" } },
                  { status: "maybe", label: "Maybe", activeStyle: { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D" } },
                  { status: "cant_go", label: "Can't Go", activeStyle: { background: "#EF4444", color: "#FFFFFF" } },
                ].map(btn => (
                  <Button key={btn.status} size="sm" onClick={() => handleRSVP(event.id, btn.status)}
                    style={myRsvp === btn.status ? btn.activeStyle : { background: "#F6F8FC", color: "#4A5878", border: "1px solid #E6ECF5" }}>
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}