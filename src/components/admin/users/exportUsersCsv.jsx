// Client-side CSV export for filtered admin users list.
function csvCell(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export function exportUsersToCsv(users, filename = "users-export.csv") {
  const headers = [
    "Full Name", "Email", "Role", "Status", "Country", "City", "Gender",
    "Date of Birth", "Bio", "Glow Score", "Faith Streak", "Pledge Signed",
    "Territory", "Territory Status", "Joined", "Last Updated"
  ];

  const rows = users.map(u => [
    u.full_name,
    u.email,
    u.role || "user",
    u.status || "active",
    u.country,
    u.city,
    u.gender,
    u.date_of_birth,
    u.bio,
    u.glow_score,
    u.faith_streak_count,
    u.pledge_signed ? "Yes" : "No",
    u.territory_name,
    u.territory_status,
    u.created_date ? new Date(u.created_date).toISOString() : "",
    u.updated_date ? new Date(u.updated_date).toISOString() : "",
  ].map(csvCell).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = filename.replace(".csv", `-${stamp}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}