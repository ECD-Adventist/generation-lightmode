import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const { data: events = [] } = useQuery({
    queryKey: ["groupEvents", group.id],
    queryFn: () => base44.entities.GlowGroupEvent.filter({ group_id: group.id })
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ["groupRSVPs", group.id],
    queryFn: async () => {
      const allRsvps = await base44.entities.GlowGroupEventRSVP.list();
      const eventIds = events.map(e => e.id);
      return allRsvps.filter(r => eventIds.includes(r.event_id));
    },
    enabled: events.length > 0
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.GlowGroupEvent.create({
        group_id: group.id,
        ...formData,
        date: new Date(formData.date).toISOString()
      });
      toast.success("Event created!");
      setFormData({ title: "", description: "", date: "", location: "" });
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["groupEvents", group.id] });
    } catch (err) {
      toast.error("Failed to create event");
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const existing = rsvps.find(r => r.event_id === eventId && r.user_email === user.email);
      if (existing) {
        await base44.entities.GlowGroupEventRSVP.update(existing.id, { status });
      } else {
        await base44.entities.GlowGroupEventRSVP.create({ event_id: eventId, user_email: user.email, status });
      }
      toast.success("RSVP updated");
      queryClient.invalidateQueries({ queryKey: ["groupRSVPs", group.id] });
    } catch (err) {
      toast.error("Failed to RSVP");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white">Group Events</h3>
        {group.leader_email === user.email && (
          <Button onClick={() => setCreating(!creating)} variant="outline" className="border-white/10 hover:bg-white/5 text-white">
            {creating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Event</>}
          </Button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="bg-[#121826]/80 p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase">Event Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-black/20 border-white/10 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-400 uppercase">Date & Time</Label>
              <Input type="datetime-local" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-black/20 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-gray-400 uppercase">Location / Link</Label>
              <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-black/20 border-white/10 text-white" />
            </div>
          </div>
          <Button type="submit" className="bg-[#00CFFF] text-black w-full hover:bg-white">Create Event</Button>
        </form>
      )}

      <div className="grid gap-4">
        {events.length === 0 && !creating && (
          <div className="text-center p-8 text-gray-500">No upcoming events.</div>
        )}
        {events.map(event => {
          const eventRsvps = rsvps.filter(r => r.event_id === event.id);
          const goingCount = eventRsvps.filter(r => r.status === 'going').length;
          const myRsvp = eventRsvps.find(r => r.user_email === user.email)?.status;

          return (
            <div key={event.id} className="bg-[#121826]/50 p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-2">{event.title}</h4>
                <div className="flex flex-col gap-1 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-[#00CFFF]" /> {event.date ? format(new Date(event.date), 'PPp') : ''}</div>
                  {event.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FFD000]" /> {event.location}</div>}
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#8A5CFF]" /> {goingCount} going</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-[120px]">
                <Button 
                  size="sm" 
                  onClick={() => handleRSVP(event.id, 'going')}
                  className={myRsvp === 'going' ? "bg-[#00CFFF] text-black hover:bg-[#00CFFF]/90" : "bg-white/5 text-white hover:bg-white/10"}
                >Going</Button>
                <Button 
                  size="sm" 
                  onClick={() => handleRSVP(event.id, 'maybe')}
                  className={myRsvp === 'maybe' ? "bg-[#FFD000] text-black hover:bg-[#FFD000]/90" : "bg-white/5 text-white hover:bg-white/10"}
                >Maybe</Button>
                <Button 
                  size="sm" 
                  onClick={() => handleRSVP(event.id, 'cant_go')}
                  className={myRsvp === 'cant_go' ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/5 text-white hover:bg-white/10"}
                >Can't Go</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}