import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate caller
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      drop_id: { type: 'string', required: true, format: 'uuid' },
    });
    if (validated.response) return validated.response;
    const { drop_id } = validated.data;

    const drops = await base44.entities.GlowDrop.filter({ id: drop_id }, '-created_date', 1);
    const drop = drops?.[0];

    if (!drop) {
      return Response.json({ error: 'Drop not found' }, { status: 404 });
    }

    const previewUrl = `https://placehold.co/1200x630/0B0F1A/FFFFFF/png?text=${encodeURIComponent('Generation LightMode\n\n' + (drop.verse || 'Glow Drop') + '\n\n' + ((drop.reflection || '').slice(0, 120) || 'Faith. Always On.'))}`;

    return Response.json({
      title: drop.verse || 'Glow Drop',
      description: drop.reflection || 'Faith. Always On.',
      image_url: previewUrl,
      share_url: `${new URL(req.url).origin.replace('/functions/generateSharePreview', '')}/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});