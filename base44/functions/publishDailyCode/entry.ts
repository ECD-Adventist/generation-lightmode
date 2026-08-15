import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';
import { mirrorToSupabase } from '../../shared/supabase.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        if (!await authorizeSchedulerOrAdmin(base44, req)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // This is a scheduled automation — no authenticated user context exists.
        // All operations use asServiceRole to bypass user-level RLS.

        const allCodes = await base44.asServiceRole.entities.CodeOfTruth.filter({ status: "approved", source_document: "codes_of_truth" });
        if (allCodes.length === 0) {
            return Response.json({ message: "No Codes of Truth available" });
        }

        const usedCodes = await base44.asServiceRole.entities.DailyCode.list('-date_published', 100);
        const usedCodeIds = new Set(usedCodes.map(c => c.code_id));

        const unusedCodes = allCodes.filter(c => !usedCodeIds.has(c.id));
        const candidates = unusedCodes.length > 0 ? unusedCodes : allCodes;
        const selectedCode = candidates[Math.floor(Math.random() * candidates.length)];

        const today = new Date().toISOString().split('T')[0];
        const existingToday = await base44.asServiceRole.entities.DailyCode.filter({ date_published: today });
        if (existingToday.length > 0) {
            return Response.json({ success: true, skipped: true, reason: "Already published today" });
        }

        await base44.asServiceRole.entities.DailyCode.create({
            code_id: selectedCode.id,
            date_published: today
        });

        const drop = await base44.asServiceRole.entities.GlowDrop.create({
            user_email: "system@lightmode.com",
            verse: selectedCode.bible_reference || "🔐 Code of Truth",
            reflection: `📌 Daily Code of Truth\n\n"${selectedCode.slogan_text}"`,
            media_url: selectedCode.poster_image_url || null,
            status: "approved",
            category: "Code of Truth",
            hashtags: "#CodeOfTruth #DailyDrops #GenerationLightMode"
        });
        await mirrorToSupabase('glow_drops', drop);

        return Response.json({ success: true, type: "codes_of_truth", code_id: selectedCode.id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});