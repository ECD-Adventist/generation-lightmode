import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const allCodes = await base44.asServiceRole.entities.CodeOfTruth.filter({ status: "approved", source_document: "keeping_it_100" });
        if (allCodes.length === 0) {
            return Response.json({ message: "No Keep It 100 codes available" });
        }

        // Get recently used codes to avoid repeats
        const recentDrops = await base44.asServiceRole.entities.GlowDrop.filter({ category: "Keep It 100" }, '-created_date', 50);
        const recentReflections = new Set(recentDrops.map(d => d.reflection));

        const unusedCodes = allCodes.filter(c => !recentReflections.has(`📌 Keep It 100\n\n"${c.slogan_text}"`));
        const candidates = unusedCodes.length > 0 ? unusedCodes : allCodes;
        const selectedCode = candidates[Math.floor(Math.random() * candidates.length)];

        await base44.asServiceRole.entities.GlowDrop.create({
            user_email: "system@lightmode.com",
            verse: selectedCode.bible_reference || "💯 Keep It 100",
            reflection: `📌 Keep It 100\n\n"${selectedCode.slogan_text}"`,
            media_url: selectedCode.poster_image_url || null,
            status: "approved",
            category: "Keep It 100",
            hashtags: "#KeepIt100 #DailyTruth #GenerationLightMode"
        });

        return Response.json({ success: true, type: "keeping_it_100", code_id: selectedCode.id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});