import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const SUPABASE_URL = "https://asnsthgubpeptoiexajf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnN0aGd1YnBlcHRvaWV4YWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzM5NDgsImV4cCI6MjA2MzQwOTk0OH0.r3WDFbJQgPuVnakMUJQa_cEWBUBbnT3hbDbT5GiZoNA";
function mirrorGlowDropToSupabase(newDrop, createdBy) {
    if (!newDrop?.id) return;
    fetch(`${SUPABASE_URL}/rest/v1/glow_drops`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify([{ id: newDrop.id, reflection: newDrop.reflection || "", verse: newDrop.verse || "", category: newDrop.category || "", description: newDrop.description || null, media_url: newDrop.media_url || null, hashtags: newDrop.hashtags || "", status: newDrop.status || "approved", likes_count: newDrop.likes_count || 0, bonus_likes_count: newDrop.bonus_likes_count || 0, pinned: newDrop.pinned || false, hidden: newDrop.hidden || false, hidden_reason: newDrop.hidden_reason || null, is_flagged: newDrop.is_flagged || false, moderation_note: newDrop.moderation_note || null, created_by: createdBy || "", created_date: newDrop.created_date || new Date().toISOString(), updated_date: newDrop.updated_date || newDrop.created_date || new Date().toISOString() }])
    }).catch(err => console.warn("Supabase dual-write failed silently:", err));
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const today = new Date().toISOString().split('T')[0];
        
        // Check if already published today
        const recentDrops = await base44.asServiceRole.entities.GlowDrop.filter(
            { user_email: "system@lightmode.com", category: "Daily Verse" }, '-created_date', 5
        );
        const alreadyPublishedToday = recentDrops.some((drop) => drop.created_date?.startsWith(today));
        if (alreadyPublishedToday) {
            return Response.json({ success: true, skipped: true, reason: "Already published today" });
        }

        const verses = [
            { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
            { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
            { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
            { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight." },
            { ref: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
            { ref: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
            { ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
            { ref: "2 Timothy 1:7", text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind." },
            { ref: "Psalm 46:1", text: "God is our refuge and strength, a very present help in trouble." },
            { ref: "Matthew 5:14-16", text: "You are the light of the world. A city set on a hill cannot be hidden. Let your light shine before others, that they may see your good deeds and glorify your Father in heaven." },
            { ref: "Galatians 5:22-23", text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control." },
            { ref: "Psalm 119:105", text: "Your word is a lamp to my feet and a light to my path." },
            { ref: "Romans 12:2", text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind." },
            { ref: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
            { ref: "1 John 4:4", text: "You, dear children, are from God and have overcome them, because the one who is in you is greater than the one who is in the world." },
        ];

        // Pick a verse not recently used
        const recentTexts = new Set(recentDrops.map(d => d.verse));
        const unused = verses.filter(v => !recentTexts.has(`${v.ref} — "${v.text}"`));
        const candidates = unused.length > 0 ? unused : verses;
        const selected = candidates[Math.floor(Math.random() * candidates.length)];

        const drop = await base44.asServiceRole.entities.GlowDrop.create({
            user_email: "system@lightmode.com",
            verse: `${selected.ref} — "${selected.text}"`,
            reflection: `📖 Daily Verse\n\n"${selected.text}"\n\n— ${selected.ref}`,
            status: "approved",
            category: "Daily Verse",
            hashtags: "#DailyVerse #DailyDrops #GenerationLightMode"
        });
        mirrorGlowDropToSupabase(drop, "system@lightmode.com");

        return Response.json({ success: true, type: "daily_verse", verse: selected.ref });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});