import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin access
        const caller = await base44.auth.me();
        if (!caller || (caller.role !== 'admin' && caller.role !== 'super_admin')) {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
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
        
        await base44.asServiceRole.entities.DailyCode.create({
            code_id: selectedCode.id,
            date_published: today
        });
        
        await base44.asServiceRole.entities.GlowDrop.create({
            user_email: "system@lightmode.com",
            verse: selectedCode.bible_reference || "🔐 Code of Truth",
            reflection: `📌 Daily Code of Truth\n\n"${selectedCode.slogan_text}"`,
            media_url: selectedCode.poster_image_url || null,
            status: "approved",
            category: "Code of Truth",
            hashtags: "#CodeOfTruth #DailyTruth #GenerationLightMode"
        });
        
        return Response.json({ success: true, type: "codes_of_truth", code_id: selectedCode.id });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});