import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';
import { mirrorToSupabase } from '../../shared/supabase.ts';

/**
 * Publishes ONE new "Keep It 100" post per day as the official system account,
 * mirroring publishDailyCode. (publishDailyKeepIt100 only boosts existing posts.)
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        if (!await authorizeSchedulerOrAdmin(base44, req)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const SYSTEM_EMAIL = "system@lightmode.com";

        // Skip if today's Keep It 100 was already published.
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const recent = await base44.asServiceRole.entities.GlowDrop.filter(
            { user_email: SYSTEM_EMAIL, category: "Keep It 100" }, '-created_date', 40
        );
        const publishedToday = recent.some(d => d.created_date && new Date(d.created_date + (d.created_date.endsWith('Z') ? '' : 'Z')) >= startOfDay);
        if (publishedToday) {
            return Response.json({ success: true, skipped: true, reason: "Already published today" });
        }

        const codes = await base44.asServiceRole.entities.CodeOfTruth.filter({ status: "approved", source_document: "keeping_it_100" });
        if (codes.length === 0) {
            return Response.json({ message: "No Keep It 100 codes available" });
        }

        // Avoid repeating anything used in the last 40 system posts, when possible.
        const usedSlogans = new Set(recent.map(d => (d.reflection || "").trim()));
        const fresh = codes.filter(c => !usedSlogans.has((c.slogan_text || "").trim()));
        const pool = fresh.length > 0 ? fresh : codes;
        const selected = pool[Math.floor(Math.random() * pool.length)];

        const drop = await base44.asServiceRole.entities.GlowDrop.create({
            user_email: SYSTEM_EMAIL,
            verse: selected.bible_reference || "💯 Keep It 100",
            reflection: selected.slogan_text || selected.title || "",
            media_url: selected.poster_image_url || null,
            status: "approved",
            category: "Keep It 100",
            hashtags: "#KeepIt100 #DailyDrops #GenerationLightMode"
        });

        // Dual-write: mirror into Supabase (awaited — a fire-and-forget fetch is cancelled on return).
        await mirrorToSupabase('glow_drops', drop);

        return Response.json({ success: true, type: "keeping_it_100", drop_id: drop.id, code_id: selected.id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});