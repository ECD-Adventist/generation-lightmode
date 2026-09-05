import React from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { countryCoordinates } from "@/lib/countryCoordinates";
export default function RecentReachMarkers({ drops, onSelect }) {
  return drops.filter(drop => drop.country !== "Global" && countryCoordinates[drop.country]).map(drop => (
    <CircleMarker key={drop.id} center={countryCoordinates[drop.country]} radius={6} pathOptions={{ color: "hsl(var(--primary))", fillColor: "hsl(var(--chart-4))", fillOpacity: 0.9, weight: 2 }}>
      <Popup>
        <div className="max-w-xs">
          <p className="font-bold">Latest story · {drop.country}</p>
          <p className="mt-1 text-xs">Country reference point, not the author's precise location.</p>
          <button onClick={() => onSelect({ ...drop, owner: { country: drop.country } })} className="mt-3 font-semibold underline">Read story</button>
        </div>
      </Popup>
    </CircleMarker>
  ));
}