import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

// Slogans from the "Keeping it 100" document that were missing from the live feed:
// Sexuality & Purity, God's Truth on Sexuality, Modesty & Purity, and Music & Media Choices.
// Format per entry: reflection (slogan + meaning) | verse
const rawRecords = [
  // --- Sexuality & Purity ---
  ['"Purity is Power!"\nHonor God with your body and live set apart for Him.', '1 Corinthians 6:18-20'],
  ['"True Love Waits!"\nGod\u2019s plan for love is worth the wait\u2014don\u2019t settle for less.', '1 Thessalonians 4:3-5'],
  ['"Holiness is Attractive!"\nA heart set on God is more beautiful than any outward appearance.', '1 Peter 1:16'],
  ['"Guard Your Heart!"\nYour purity today shapes your future tomorrow.', 'Proverbs 4:23'],
  ['"Your Body, His Temple!"\nGod dwells in you\u2014honor Him in every way.', '1 Corinthians 3:16'],
  ['"Don\u2019t Trade Purity for Pleasure!"\nShort-term pleasure isn\u2019t worth long-term pain.', 'Hebrews 12:16'],
  ['"Stay Pure, Stay Free!"\nPurity isn\u2019t restriction; it\u2019s real freedom.', 'Galatians 5:1'],
  ['"Love God First!"\nA heart fully in love with God will not compromise.', 'Matthew 22:37'],
  ['"Your Worth is Not in Your Past!"\nGod redeems, restores, and makes all things new.', '2 Corinthians 5:17'],
  ['"Be a Light, Not a Follower!"\nDon\u2019t conform\u2014shine for Christ in all areas of life.', 'Romans 12:2'],

  // --- God's Truth on Sexuality ---
  ['"God\u2019s Design, God\u2019s Rules\u2014One Man, One Woman!"\nHis plan for marriage is good and intentional.', 'Genesis 2:24'],
  ['"Love Speaks Truth\u2014Sin is Still Sin!"\nReal love is honest about God\u2019s standard.', '1 Corinthians 6:9-10'],
  ['"God Made Male & Female\u2014No Edits Needed!"\nFrom the beginning, His design was complete.', 'Mark 10:6'],
  ['"Don\u2019t Follow Feelings, Follow God\u2019s Word!"\nThe heart can deceive\u2014truth never does.', 'Jeremiah 17:9'],
  ['"Real Love Warns\u2014Sin Leads to Death!"\nLove cares enough to tell the truth.', 'Romans 6:23'],
  ['"Jesus Saves, Sin Destroys\u2014Choose Wisely!"\nGo and sin no more\u2014grace empowers change.', 'John 8:11'],
  ['"Truth Over Trends\u2014God\u2019s Word Stands Forever!"\nCulture shifts; Scripture endures.', 'Isaiah 40:8'],
  ['"You\u2019re More Than Your Desires\u2014God Has a Greater Plan!"\nBe transformed by the renewing of your mind.', 'Romans 12:2'],
  ['"God\u2019s Design is Best!"\nHis plan for love and marriage is perfect.', 'Genesis 2:24'],
  ['"Truth Over Trends!"\nFollow God\u2019s Word, not the world\u2019s shifting views.', 'Romans 12:2'],
  ['"God Calls Us to Love, Not Redefine Love!"\nLove must align with His truth.', '1 Corinthians 13:6'],
  ['"Feelings Change, but God\u2019s Word Stands Forever!"\nTrust the unchanging truth of Scripture.', 'Isaiah 40:8'],
  ['"Identity is in Christ, Not Sexuality!"\nWho you are is defined by God, not culture.', 'Galatians 2:20'],
  ['"Freedom is Found in Christ!"\nJesus redeems, heals, and restores.', 'John 8:36'],
  ['"God\u2019s Love is for Everyone\u2014So is His Truth!"\nSpeak truth in love, always.', 'Ephesians 4:15'],
  ['"Desires Don\u2019t Define You!"\nWe are more than our temptations.', 'James 1:14-15'],
  ['"Transformation is Possible!"\nGod\u2019s power can change lives.', '2 Corinthians 5:17'],
  ['"Love the Person, Speak the Truth!"\nJesus calls us to both compassion and conviction.', 'John 8:11'],

  // --- Modesty & Purity ---
  ['"True Beauty Comes from the Heart!"\nModesty reflects inner godliness.', '1 Peter 3:3-4'],
  ['"Dress to Honor, Not to Impress!"\nYour body is God\u2019s temple.', '1 Corinthians 6:19-20'],
  ['"Purity is a Daily Choice!"\nStay committed to holiness.', '1 Thessalonians 4:3-4'],
  ['"Respect Yourself, Reflect Christ!"\nYour dress and actions should glorify Him.', 'Romans 12:1'],
  ['"Cover What is Sacred!"\nModesty is about respect, not rules.', '1 Timothy 2:9'],
  ['"A Pure Heart Leads to a Pure Life!"\nGuard your thoughts first.', 'Matthew 5:8'],
  ['"True Love Waits\u2014Save Intimacy for Marriage!"\nGod honors a love that waits.', 'Hebrews 13:4'],
  ['"Modesty is Confidence, Not Shame!"\nYou are precious in God\u2019s eyes.', 'Proverbs 31:25'],
  ['"Purity is Possible with Christ!"\nGod\u2019s grace can restore and strengthen you.', '2 Corinthians 5:17'],
  ['"Your Worth is in God, Not in Approval!"\nSeek God\u2019s approval over worldly trends.', 'Galatians 1:10'],

  // --- Music & Media Choices ---
  ['"What You Listen to Shapes You!"\nFill your mind with God-honoring content.', 'Philippians 4:8'],
  ['"Music Can Heal or Harm\u2014Choose Wisely!"\nBe mindful of your influences.', 'Colossians 3:16'],
  ['"Lyrics Matter!"\nWords have power over your spirit.', 'Proverbs 4:23'],
  ['"Not Every Beat Glorifies God!"\nMusic should draw you closer to Him.', 'Ephesians 5:19'],
  ['"Jesus Over Junk!"\nChoose songs that feed your faith, not your flesh.', 'Romans 12:2'],
  ['"Entertainment Shouldn\u2019t Compromise Your Faith!"\nWatch and listen with wisdom.', 'Psalm 101:3'],
  ['"The Right Playlist Can Change Your Day!"\nUplifting music transforms your mood.', 'Isaiah 26:3'],
  ['"Music is a Powerful Tool\u2014Use it for Worship!"\nSing and play for the glory of God.', 'Psalm 95:1'],
  ['"What You Watch, You Become!"\nProtect your heart from ungodly content.', 'Luke 6:45'],
  ['"Christian Media = Christian Mindset!"\nFill your spirit with God\u2019s truth.', 'Psalm 19:14'],
];

const common = {
  user_email: 'system@lightmode.com',
  category: 'Keep It 100',
  hashtags: '#KeepIt100 #DailyDrops #GenerationLightMode',
  status: 'approved',
  likes_count: 0,
  bonus_likes_enabled: true,
  pinned: false,
  hidden: false,
  is_flagged: false,
};

const records = rawRecords.map(([reflection, verse]) => ({ reflection, verse }));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const existing = await base44.asServiceRole.entities.GlowDrop.filter({
      category: 'Keep It 100',
      status: 'approved',
    });
    const normalize = (v) => String(v || '').replace(/[\u2018\u2019]/g, "'").trim();
    const existingKeys = new Set(existing.map((drop) => `${normalize(drop.reflection)}|${normalize(drop.verse)}`));

    let created = 0;
    let skipped = 0;
    const createdIds = [];

    for (const r of records) {
      const key = `${normalize(r.reflection)}|${normalize(r.verse)}`;
      if (!body.force && existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      if (body.dry_run) {
        created += 1;
        continue;
      }
      const createdDrop = await base44.asServiceRole.entities.GlowDrop.create({ ...common, ...r });
      created += 1;
      createdIds.push(createdDrop.id);
    }

    return Response.json({
      success: true,
      dry_run: !!body.dry_run,
      total: records.length,
      created,
      skipped_existing: skipped,
      created_ids: createdIds,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});