import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LocationCompletionForm({ location, onSaved }) {
  const [country, setCountry] = useState(location.country || "");
  const [city, setCity] = useState(location.city || "");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (saving || !confirmed || !country || !city.trim()) return;
    setSaving(true); setError("");
    try {
      const { data } = await base44.functions.invoke("updateProfile", { country, city: city.trim(), confirm_location: true });
      if (!data?.success) throw new Error(data?.error || "Unable to save your location.");
      await onSaved();
    } catch (err) { setError(err?.response?.data?.error || err.message || "Unable to save. Please try again."); }
    finally { setSaving(false); }
  };
  return <main className="min-h-dvh bg-background text-foreground flex items-center justify-center px-5 py-10 safe-pt safe-pb">
    <section className="w-full max-w-md rounded-2xl border bg-card text-card-foreground p-6 sm:p-8 shadow-lg" aria-labelledby="location-heading">
      <MapPin className="h-8 w-8 mb-4" aria-hidden="true" />
      <h1 id="location-heading" className="text-2xl font-bold mb-2">Complete your location</h1>
      <p className="text-sm text-muted-foreground mb-6">Tell us the country and city or town where you live. We use your answers for community location and territory reporting — we never guess them.</p>
      <form onSubmit={submit} className="space-y-5">
        <div><label htmlFor="location-country" className="block text-sm font-medium mb-2">Country (required)</label>
          <select id="location-country" required value={country} onChange={e => { setCountry(e.target.value); setConfirmed(false); }} disabled={saving} autoComplete="country-name" className="w-full min-h-11 rounded-md border border-input bg-background text-foreground px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="" disabled>Select your country</option>{location.countries.map(name => <option key={name} value={name}>{name}</option>)}
          </select></div>
        <div><label htmlFor="location-city" className="block text-sm font-medium mb-2">City / Town (required)</label><Input id="location-city" required maxLength={120} value={city} disabled={saving} onChange={e => { setCity(e.target.value); setConfirmed(false); }} autoComplete="address-level2" className="min-h-11 text-base" /></div>
        <label className="flex gap-3 items-start text-sm cursor-pointer py-2"><input type="checkbox" required checked={confirmed} disabled={saving} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />I confirm these are my country and city / town.</label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full min-h-11" disabled={saving || !confirmed || !country || !city.trim()}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{saving ? "Saving…" : "Save and continue"}</Button>
      </form>
      <div className="mt-5 flex items-center justify-between gap-4 text-sm"><Link to="/Privacy" className="underline underline-offset-4">Privacy policy</Link><Button variant="ghost" disabled={saving} onClick={() => base44.auth.logout("/Home")}>Sign out</Button></div>
    </section>
  </main>;
}