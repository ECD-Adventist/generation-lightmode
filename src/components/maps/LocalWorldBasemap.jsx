import React, { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import { feature } from "topojson-client";
import worldTopology from "@/data/countries-110m.json";

// Bundled world-atlas 2.0.2 geometry (ISC); source data is Natural Earth.
// Keeping the geometry local avoids third-party tile keys, quotas, and outages.
export default function LocalWorldBasemap({ variant = "dark" }) {
  const countries = useMemo(
    () => feature(worldTopology, worldTopology.objects.countries),
    []
  );
  const dark = variant === "dark";

  return (
    <GeoJSON
      data={countries}
      interactive={false}
      smoothFactor={1.5}
      style={{
        fillColor: dark ? "#202326" : "#D9E2E8",
        fillOpacity: 1,
        color: dark ? "#343A40" : "#A8B7C4",
        opacity: 1,
        weight: 0.55,
      }}
    />
  );
}
