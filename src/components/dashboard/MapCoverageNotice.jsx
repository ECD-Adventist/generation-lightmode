import React from "react";

export default function MapCoverageNotice({ total, mapped, awaitingCountry, unmapped = 0 }) {
  return <div className="rounded-xl border bg-muted/40 p-3 text-sm text-foreground" role="status">
    <p><strong>{mapped.toLocaleString()}</strong> mapped of {total.toLocaleString()} registered users.</p>
    {awaitingCountry > 0 && <p className="mt-1 text-xs text-muted-foreground">{awaitingCountry.toLocaleString()} still need a valid country. They must select their country and city / town when they next open the app; we never guess their location.</p>}
    {unmapped > 0 && <p className="mt-1 text-xs text-muted-foreground">{unmapped.toLocaleString()} have country data but no map reference point yet.</p>}
    <p className="mt-1 text-xs text-muted-foreground">New confirmations appear after the next community totals refresh.</p>
  </div>;
}