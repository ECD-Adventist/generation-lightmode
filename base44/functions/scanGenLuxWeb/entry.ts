import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { mirrorToSupabase } from '../../shared/supabase.ts';

const defaults = [
  ['Generation LightMode', 'campaign'], ['Gen-Lux', 'campaign'], ['Faith Always On', 'phrase'],
  ['Switch It On', 'phrase'], ['#GenerationLightMode', 'hashtag'], ['#FaithAlwaysOn', 'hashtag']
];

const resultSchema = { type: 'object', properties: {
  summary: { type: 'string' }, estimated_total_results: { type: 'number' }, trend_percent: { type: 'number' },
  visibility: { type: 'string', enum: ['Low', 'Medium', 'High', 'Very High'] },
  countries: { type: 'array', items: { type: 'string' } }, related_terms: { type: 'array', items: { type: 'string' } },
  results: { type: 'array', items: { type: 'object', properties: {
    title: { type: 'string' }, url: { type: 'string' }, source_type: { type: 'string' },
    published_at: { type: 'string' }, country: { type: 'string' }, sentiment: { type: 'string' },
    topic: { type: 'string' }, potential_reach: { type: 'string' }, excerpt: { type: 'string' }
  }, required: ['title', 'url'] } }
}, required: ['summary', 'estimated_total_results', 'trend_percent', 'visibility', 'countries', 'related_terms', 'results'] };

function cleanEnum(value, allowed, fallback) { return allowed.includes(value) ? value : fallback; }
function domainOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!await authorizeSchedulerOrAdmin(base44, req)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const validated = await readValidatedJson(req, {
      keyword_id: { type: 'string', maxLength: 64 }, scheduler_token: { type: 'string', maxLength: 500 },
      dry_run: { type: 'boolean' }, keyword_limit: { type: 'integer', minimum: 1, maximum: 3 }
    });
    if (validated.response) return validated.response;

    let keywords = await base44.asServiceRole.entities.GenLuxKeyword.filter({ active: true }, '-created_date', 25);
    if (!keywords.length) {
      keywords = [];
      for (const [term, kind] of defaults) {
        const record = await base44.asServiceRole.entities.GenLuxKeyword.create({ term, kind, active: true });
        keywords.push(record);
        await mirrorToSupabase('genlux_keywords', record);
      }
    }
    if (validated.data.keyword_id) keywords = keywords.filter((item) => item.id === validated.data.keyword_id);
    if (!validated.data.keyword_id && validated.data.keyword_limit && keywords.length > validated.data.keyword_limit) {
      const slot = Math.floor(Date.now() / 900000) % keywords.length;
      keywords = [...keywords.slice(slot), ...keywords.slice(0, slot)].slice(0, validated.data.keyword_limit);
    }
    if (validated.data.dry_run) return Response.json({ success: true, dry_run: true, keywords: keywords.length });

    const now = new Date().toISOString();
    let discovered = 0;
    let alertsCreated = 0;
    const scanErrors = [];
    for (const keyword of keywords) {
      let intelligence;
      try {
        intelligence = await base44.asServiceRole.integrations.Core.InvokeLLM({
          model: 'gemini_3_flash', add_context_from_internet: true, response_json_schema: resultSchema,
          prompt: `Search the current public web for verifiable exact, partial, translated, abbreviated, hashtag, and contextually related mentions of "${keyword.term}" connected to Generation LightMode, Gen-Lux, Christian youth, faith, digital evangelism, hope, Bible, or prayer. Check news, blogs, church and ministry websites, publications, event pages, public social pages, video platforms, podcasts, and indexed PDFs. Search globally, prioritizing the 12 East-Central Africa Division nations and English, Swahili, and French results since ${keyword.last_scanned_at || 'the last 30 days'}. Return up to 12 distinct results with real canonical HTTPS URLs only; never invent a source or URL. Conservatively estimate visibility and trend, identify countries and related terms, and summarize key opportunities or reputational risks.`
        });
      } catch (error) {
        console.warn('[genlux-scan:keyword-skipped]', keyword.id, error?.message);
        scanErrors.push({ keyword_id: keyword.id, keyword: keyword.term, reason: 'Public-web search timed out; it will be retried on a later run.' });
        continue;
      }
      const existing = await base44.asServiceRole.entities.GenLuxMention.filter({ keyword_id: keyword.id }, '-discovered_at', 500);
      const known = new Set(existing.map((item) => item.fingerprint));
      const freshPayloads = (intelligence.results || []).filter((item) => item.url?.startsWith('https://')).map((item) => ({
        keyword_id: keyword.id, keyword: keyword.term, title: item.title.slice(0, 500), url: item.url.slice(0, 2048),
        domain: domainOf(item.url), source_type: cleanEnum(item.source_type, ['news','blog','church','publication','video','web'], 'web'),
        published_at: /^\d{4}-\d{2}-\d{2}/.test(item.published_at || '') ? new Date(item.published_at).toISOString() : now,
        discovered_at: now, country: (item.country || 'Unknown').slice(0, 100),
        sentiment: cleanEnum(item.sentiment, ['Positive','Neutral','Negative'], 'Neutral'), topic: (item.topic || 'Digital evangelism').slice(0, 200),
        potential_reach: cleanEnum(item.potential_reach, ['Low','Medium','High','Very High'], 'Medium'), excerpt: (item.excerpt || '').slice(0, 1000),
        fingerprint: `${keyword.id}:${item.url.toLowerCase()}`.slice(0, 500)
      })).filter((item) => !known.has(item.fingerprint));

      const createdMentions = freshPayloads.length ? await base44.asServiceRole.entities.GenLuxMention.bulkCreate(freshPayloads) : [];
      for (const mention of createdMentions) await mirrorToSupabase('genlux_mentions', mention);
      discovered += createdMentions.length;
      const updated = await base44.asServiceRole.entities.GenLuxKeyword.update(keyword.id, {
        total_results: Math.max(Number(keyword.total_results || 0), Number(intelligence.estimated_total_results || 0)),
        new_results: createdMentions.length, country_count: (intelligence.countries || []).length,
        visibility: cleanEnum(intelligence.visibility, ['Low','Medium','High','Very High'], 'Low'),
        trend_percent: Number(intelligence.trend_percent || 0), related_terms: (intelligence.related_terms || []).slice(0, 12),
        last_summary: intelligence.summary.slice(0, 2000), last_scanned_at: now
      });
      await mirrorToSupabase('genlux_keywords', updated);

      if (createdMentions.length) {
        const top = createdMentions.find((item) => ['High','Very High'].includes(item.potential_reach)) || createdMentions[0];
        const alert = await base44.asServiceRole.entities.GenLuxAlert.create({
          keyword_id: keyword.id, mention_id: top.id, alert_type: ['High','Very High'].includes(top.potential_reach) ? 'high_reach' : 'new_mention',
          title: `New ${keyword.term} web mention`, message: `${top.title} — ${top.domain || 'public web'}`,
          recommendation: top.sentiment === 'Positive' ? 'Review and consider sharing this mention through official Gen-Lux channels.' : 'Review the source and assess whether a response is needed.',
          severity: ['High','Very High'].includes(top.potential_reach) ? 'opportunity' : 'info', read: false, in_app_sent: true, email_sent: false
        });
        await mirrorToSupabase('genlux_alerts', alert);
        alertsCreated += 1;
        const recipients = [
          ...(await base44.asServiceRole.entities.User.filter({ role: 'super_admin' }, '-created_date', 50)),
          ...(await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 50)),
          ...(await base44.asServiceRole.entities.User.filter({ role: 'ecd_admin' }, '-created_date', 50))
        ];
        for (const recipient of recipients) {
          const notification = await base44.asServiceRole.entities.Notification.create({
            user_id: recipient.id, type: 'system', reference_id: `genlux:${alert.id}`, message: alert.title,
            description: alert.message, link: '/AdminCenter?tab=genlux-intelligence', read: false
          });
          await mirrorToSupabase('notifications', notification);
        }
      }
    }
    return Response.json({
      success: scanErrors.length === 0,
      partial: scanErrors.length > 0,
      keywordsScanned: keywords.length - scanErrors.length,
      keywordsAttempted: keywords.length,
      discovered,
      alertsCreated,
      scanErrors
    });
  } catch (error) {
    console.error('[genlux-scan:error]', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}