import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const allCodes = await base44.asServiceRole.entities.CodeOfTruth.list();
        if (allCodes.length === 0) {
            return Response.json({ message: "No codes available" });
        }
        
        const usedCodes = await base44.asServiceRole.entities.DailyCode.list();
        const usedCodeIds = new Set(usedCodes.map(c => c.code_id));
        
        const unusedCodes = allCodes.filter(c => !usedCodeIds.has(c.id));
        const candidates = unusedCodes.length > 0 ? unusedCodes : allCodes;
        const selectedCode = candidates[Math.floor(Math.random() * candidates.length)];
        
        const today = new Date().toISOString().split('T')[0];
        
        await base44.asServiceRole.entities.DailyCode.create({
            code_id: selectedCode.id,
            date_published: today
        });
        
        await base44.asServiceRole.entities.GlowDrop.create({
            user_email: "system@lightmode.com",
            verse: selectedCode.bible_reference || "Code of Truth",
            reflection: selectedCode.slogan_text,
            media_url: selectedCode.poster_image_url || null,
            status: "approved",
            category: "Code of Truth"
        });
        
        return Response.json({ success: true, code_id: selectedCode.id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});