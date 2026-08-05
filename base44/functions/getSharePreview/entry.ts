import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { extractDriveFileId } from '../../shared/driveLinks.ts';

const APP_ORIGIN = 'https://lightmode.ecd.adventist.org';
const FALLBACK_IMAGE = 'https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png';
const CRAWLER_PATTERN = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|facebookcatalog|Pinterest/i;

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function plainText(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function renderHtml(preview) {
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const image = escapeHtml(preview.image);
  const canonical = escapeHtml(preview.canonical);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="${image}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"></head><body><p><a href="${canonical}">Open in Generation LightMode</a></p></body></html>`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    let type = url.searchParams.get('type') || '';
    let id = url.searchParams.get('id') || '';
    let imageMode = url.searchParams.get('image') === '1';
    let testAgent = '';
    if (req.method !== 'GET') {
      const body = await req.json();
      type = body.type || type;
      id = body.id || id;
      imageMode = body.image === true || imageMode;
      testAgent = body.user_agent || '';
    }
    if (!id || !['glowdrop', 'content', 'prayer'].includes(type)) return Response.json({ error: 'Invalid preview request' }, { status: 400 });

    let preview;
    if (type === 'glowdrop') {
      const item = await base44.asServiceRole.entities.GlowDrop.get(id);
      if (!item || item.hidden || item.status === 'rejected') return Response.json({ error: 'Content not found' }, { status: 404 });
      const author = item.author_name || item.author_username || 'Generation LightMode';
      preview = { title: item.verse || `Post by ${author}`, description: plainText(item.reflection || `A GlowDrop from ${author}`), image: item.media_url || FALLBACK_IMAGE, canonical: `${APP_ORIGIN}/Post?id=${encodeURIComponent(id)}&user=${encodeURIComponent(item.user_email || '')}` };
    } else if (type === 'content') {
      const item = await base44.asServiceRole.entities.DigitalContent.get(id);
      if (!item || new Date(item.scheduled_at).getTime() > Date.now()) return Response.json({ error: 'Content not found' }, { status: 404 });
      if (imageMode && item.content_type === 'poster') {
        const fileId = extractDriveFileId(item.drive_link);
        if (!fileId) return Response.json({ error: 'Image not found' }, { status: 404 });
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
        const imageResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!imageResponse.ok) return Response.json({ error: 'Image not found' }, { status: imageResponse.status });
        return new Response(imageResponse.body, { status: 200, headers: { 'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
      }
      const image = item.content_type === 'poster'
        ? `${APP_ORIGIN}/functions/getSharePreview?type=content&id=${encodeURIComponent(id)}&image=1`
        : item.thumbnail_url || FALLBACK_IMAGE;
      preview = { title: item.title, description: plainText(item.description || `${item.content_type || 'Resource'} from Generation LightMode`), image, canonical: `${APP_ORIGIN}/ContentHub?item=${encodeURIComponent(id)}` };
    } else {
      const item = await base44.asServiceRole.entities.PrayerRequest.get(id);
      if (!item) return Response.json({ error: 'Content not found' }, { status: 404 });
      preview = { title: item.is_anonymous ? 'Anonymous prayer request' : 'Prayer request', description: plainText(item.content), image: FALLBACK_IMAGE, canonical: `${APP_ORIGIN}/PrayerWall?request=${encodeURIComponent(id)}` };
    }

    const userAgent = testAgent || req.headers.get('user-agent') || '';
    if (!CRAWLER_PATTERN.test(userAgent)) return Response.redirect(preview.canonical, 302);
    return new Response(renderHtml(preview), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}