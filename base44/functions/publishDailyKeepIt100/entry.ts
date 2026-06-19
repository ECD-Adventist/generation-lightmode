import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const RAW_SLOGANS = `
Master Your Desires!|Self-control leads to victory—don't be enslaved.|1 Corinthians 9:27
You Are Stronger Than Lust!|In Christ, you have the power to overcome.|Galatians 5:16
Don't Feed the Flesh!|Starve temptation and feed your spirit.|Romans 8:13
Victory Begins in the Mind!|Guard your thoughts, and you will guard your actions.|Philippians 4:8
Your Body, God's Dwelling!|Keep your temple holy and pleasing to Him.|1 Thessalonians 4:4-5
Self-Control is Strength!|Weakness gives in—strength stands firm.|2 Timothy 1:7
God's Approval Over Instant Gratification!|What pleases God is better than a moment of pleasure.|1 Peter 2:11
What You Watch, You Become!|Fill your mind with purity, not impurity.|Matthew 6:22-23
Break the Chains of Addiction!|In Christ, you can be free.|John 8:36
Honor God in Private & Public!|What you do in secret matters to God.|Luke 8:17
Life is a Gift!|Every heartbeat matters—choose life.|Psalm 139:13-16
Protect the Unborn!|Every child is created in God's image.|Genesis 1:27
Speak for the Voiceless!|Stand up for those who can't speak for themselves.|Proverbs 31:8
A Life is Not a Choice!|God has a plan for every child.|Jeremiah 1:5
Love Them Both!|Support both mother and child with love.|Isaiah 66:13
Life Begins at Conception!|Science confirms it, but God knew it first.|Luke 1:41
Abortion Doesn't Heal Pain!|Let God heal, restore, and bring hope.|Psalm 147:3
Every Life is Precious!|No child is an accident in God's eyes.|Job 33:4
Choose Hope, Not Despair!|There are better options—seek help and trust God.|Romans 8:28
Trust God with Every Life!|He knows every child's destiny.|Isaiah 46:4
God is Your Provider!|You don't need luck when you have faith.|Philippians 4:19
Steward Wisely, Live Freely!|God blesses faithful stewardship.|Matthew 25:21
Easy Money, Costly Consequences!|Gambling promises riches but delivers regret.|Proverbs 13:11
Trust in God, Not in Luck!|God's provision is better than chance.|Proverbs 3:5-6
Gambling Steals, Generosity Multiplies!|Invest in God's kingdom, not quick schemes.|Luke 6:38
Wealth Built on Wisdom Lasts!|Hard work and faith bring true success.|Proverbs 10:22
Money is a Tool—Use It for Good!|Don't let money control you; control it.|1 Timothy 6:10
Greed Destroys, Contentment Satisfies!|Be thankful for what God provides.|Hebrews 13:5
Faithfulness Over Fortune!|Serve God, not money.|Matthew 6:24
Gambling Promises Much, Delivers Little!|Seek treasure in heaven, not the casino.|Matthew 6:20
Study Hard, Shine Bright!|Excellence glorifies God—do your best in all things.|Colossians 3:23
God First, Success Follows!|Put God at the center of your education and career.|Proverbs 16:3
Your Gifts Have a Purpose!|God created you with talents—use them for His glory.|1 Peter 4:10
Learning is a Lifelong Journey!|Wisdom is better than gold—seek knowledge with humility.|Proverbs 4:7
Work Hard, Stay Honest!|Integrity is worth more than shortcuts.|Proverbs 10:9
God Opens the Right Doors!|Trust His timing in your career and studies.|Revelation 3:8
Your Career is Your Calling!|Let your job be a testimony of God's grace.|Ephesians 2:10
Excellence is Worship!|Working with excellence honors God.|Daniel 6:3
God's Plans Are Greater Than Yours!|Seek His will, and your future will be secure.|Jeremiah 29:11
Never Stop Growing!|Keep learning, keep improving, keep trusting God.|Proverbs 1:5
Work Smart, Trust God!|Wisdom and faith lead to true success.|James 1:5
Kingdom Builders, Not Just Career Builders!|Your job is your ministry—let your work reflect Christ.|Matthew 5:16
Honesty is the Best Business Strategy!|A good name is better than riches.|Proverbs 22:1
Be a Leader, Not Just a Worker!|Stand out with integrity and diligence.|Colossians 3:23
God Blesses Diligence!|Hard work leads to great rewards.|Proverbs 12:24
Serve Others, Succeed More!|The greatest leaders serve with love.|Mark 10:45
God is Your CEO!|Let Him direct your business and career.|Proverbs 16:9
Don't Chase Money, Chase Purpose!|A life of purpose is richer than a life of wealth.|Ecclesiastes 5:10
Your Job is Your Mission Field!|Let your workplace be a place of impact.|2 Corinthians 5:20
Success is More Than Money!|True success is found in fulfilling God's purpose.|Luke 12:15
God Writes the Best Love Stories!|Wait on Him for the right partner.|Proverbs 3:5-6
A Godly Marriage Begins with a Godly Courtship!|Build on faith, not just feelings.|2 Corinthians 6:14
Love is More Than a Feeling!|Choose commitment, not just emotions.|1 Corinthians 13:4-7
Your Partner Should Push You Closer to God!|A strong relationship is built on faith.|Amos 3:3
Don't Settle—Wait for God's Best!|Patience leads to a love that lasts.|Psalm 37:4
Pray Before You Date!|Let God be involved in your relationships.|Philippians 4:6-7
Marry Purpose, Not Just Passion!|Choose a partner who aligns with your calling.|Genesis 2:18
God's Timing, Not Yours!|Trust Him to bring the right person at the right time.|Ecclesiastes 3:1
Faithfulness Starts Before Marriage!|Be the right person before finding the right person.|Luke 16:10
Marriage is a Covenant, Not a Contract!|Love is for life—commit with Christ at the center.|Mark 10:9
You Are Who God Says You Are!|Don't let the world define you.|2 Corinthians 5:17
Stand Out, Don't Blend In!|Be different for God's glory.|Romans 12:2
Christ is Your Identity!|Don't trade your faith for approval.|Galatians 2:20
Don't Let Pressure Change Your Purpose!|Follow Christ, not the crowd.|Matthew 7:13-14
You're Set Apart for a Reason!|Holiness is not outdated—it's powerful.|1 Peter 2:9
Approval from God Over Likes from People!|Seek His validation above all else.|John 12:43
Your True Friends Lead You Closer to God!|Choose friendships wisely.|Proverbs 27:17
Fitting in Isn't Worth Losing Your Faith!|Choose Christ over culture.|James 4:4
You Are Loved Just as You Are!|You don't need to change for acceptance.|Romans 8:38-39
Live for God, Not for Approval!|His opinion is the only one that truly matters.|Colossians 3:23
Victory Starts in the Mind!|Guard your thoughts—temptation begins there.|2 Corinthians 10:5
The Devil is a Liar!|Don't believe his tricks—God's truth sets you free.|John 8:44
Temptation is Temporary, Consequences Last!|Choose righteousness over regret.|James 1:15
Jesus Fought Temptation—So Can You!|Use God's Word as your weapon.|Matthew 4:4
Pray Before You Stray!|Prayer strengthens you against sin.|Matthew 26:41
The Armor of God Never Fails!|Equip yourself daily for spiritual battles.|Ephesians 6:11
Satan Can't Win When You Stay in Christ!|Stay connected to God, and you'll overcome.|Romans 8:37
Flee, Don't Flirt with Sin!|Running from temptation is wisdom, not weakness.|1 Corinthians 6:18
Resist the Devil, and He Will Flee!|You have the power to say NO.|James 4:7
Spiritual Warfare is Real—Stay Ready!|Be alert, be strong, and stay in prayer.|1 Peter 5:8
Show Me Your Friends, I'll Show You Your Future!|The people around you shape your life.|Proverbs 13:20
Good Friends Bring You Closer to God!|Choose friendships that strengthen your faith.|1 Corinthians 15:33
Iron Sharpens Iron!|Real friends help you grow spiritually.|Proverbs 27:17
Your Circle Should Strengthen, Not Strain You!|Surround yourself with people who uplift you.|Hebrews 10:24
A True Friend Speaks the Truth!|Love corrects with kindness, not just agreement.|Proverbs 27:6
Your Influence Matters!|Shine your light in every friendship.|Matthew 5:16
Friends Should Point You to Christ!|If they're leading you away, reconsider.|Amos 3:3
Better to Be Alone Than in Bad Company!|Don't keep toxic friendships just to fit in.|Psalm 1:1
Be a Friend Who Loves at All Times!|Loyalty and kindness make lasting friendships.|Proverbs 17:17
Your Friends Reflect Your Values!|Choose relationships that reflect your commitment to God.|Proverbs 22:24-25
Sobriety is Strength!|Self-control is a fruit of the Spirit.|Galatians 5:22-23
Alcohol Destroys, but God Restores!|Only Jesus can truly satisfy.|Ephesians 5:18
You Don't Need a Drink to Feel Free!|Real freedom is in Christ.|John 8:36
Drunkenness Leads to Destruction!|Be wise, stay sober.|Proverbs 20:1
Escape to God, Not the Bottle!|He is your refuge.|Psalm 46:1
Drinking Won't Fill the Void!|Only Jesus satisfies.|Isaiah 55:1
Stay Sober, Stay Sharp!|A clear mind honors God.|1 Peter 5:8
Don't Let Alcohol Control You!|Self-control is power.|Proverbs 23:29-35
Be a Light, Not a Stumbling Block!|Lead others toward righteousness.|Romans 14:21
Joy Comes from Jesus, Not a Bottle!|True happiness is found in Christ.|John 15:11
What You Watch Shapes You!|Be mindful of your influences.|Psalm 101:3
Choose Godly Entertainment!|Let your choices honor Him.|Philippians 4:8
Don't Let Media Corrupt Your Mind!|Guard your heart against harmful content.|Proverbs 4:23
Jesus Wouldn't Watch That—Would You?|Honor God with what you consume.|Romans 12:2
Glorify God in Your Free Time!|Entertainment should not pull you away from Christ.|Colossians 3:17
Not All Fun is Good Fun!|Be wise in your choices.|Ephesians 5:11
The World Entertains, God Transforms!|Seek spiritual growth over worldly pleasure.|2 Timothy 2:22
Music & Movies Influence the Heart!|Be careful what you let in.|Luke 6:45
Your Eyes Are the Gateway to Your Soul!|Watch wisely.|Matthew 6:22
Not Everything Trending is Worth Watching!|Choose eternal values over temporary thrills.|1 John 2:15-17
Think Before You Click!|Words have power—use them wisely.|Proverbs 18:21
More Bible, Less Screen Time!|Prioritize God over distractions.|Matthew 6:33
Don't Let Social Media Define You!|Your worth is in Christ, not likes.|Psalm 139:14
Post to Inspire, Not to Impress!|Let your content glorify God.|Colossians 3:17
Filters Don't Change Reality!|Be real—God loves the unfiltered you.|1 Samuel 16:7
Not Everything Online is True!|Test all things against God's Word.|1 Thessalonians 5:21
Guard Your Eyes, Guard Your Heart!|Be careful what you consume online.|Matthew 6:22
Don't Trade Presence for Pixels!|Be fully present in real life.|Ecclesiastes 3:1
If It Doesn't Honor God, Don't Post It!|Use your platform for good.|Ephesians 4:29
Technology Should Serve You, Not Enslave You!|Stay in control of your screen time.|1 Corinthians 6:12
Integrity is Who You Are When No One is Watching!|Be honest in all areas of life.|Proverbs 10:9
A Lie Can Ruin a Lifetime of Trust!|Speak truth at all times.|Ephesians 4:25
Honesty Always Wins!|The truth sets you free.|John 8:32
God Sees Everything!|Live transparently before Him.|Hebrews 4:13
Your Character Speaks Louder Than Words!|Live with integrity daily.|1 Samuel 16:7
Cheating Isn't Winning!|Stay true in all areas of life.|Colossians 3:23
Honesty Builds, Lies Destroy!|Relationships thrive on trust.|Proverbs 12:22
Let Your Yes Be Yes!|Keep your word.|Matthew 5:37
Integrity Brings Promotion!|God honors those who walk in truth.|Psalm 75:6-7
Do Right, Even When It's Hard!|Honesty is always worth it.|Galatians 6:9
Words Can Heal or Harm—Choose Wisely!|Speak life, not destruction.|Proverbs 18:21
Silence is Better Than Gossip!|Avoid idle talk.|Proverbs 11:13
Your Words Represent Christ!|Speak with grace.|Colossians 4:6
Spread Love, Not Rumors!|Speak only what builds up.|Ephesians 4:29
Truth is Kind, Gossip is Poison!|Protect others with your words.|James 3:6
Before You Speak, Think!|Is it true? Is it necessary? Is it kind?|Proverbs 15:28
Talk Less, Pray More!|Let God guide your words.|Matthew 12:36
Your Tongue is a Fire—Use it Wisely!|Don't let your words burn others.|James 3:5
Be Known for Encouragement, Not Drama!|Build up, don't tear down.|1 Thessalonians 5:11
Words Are Seeds—Plant Good Ones!|Speak words that bear good fruit.|Matthew 12:37
`;

function slogans() {
    return RAW_SLOGANS.trim().split('\n').map((line, index) => {
        const [title, description, verse] = line.split('|');
        return { index, title, description, verse };
    });
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        let body = {};
        try { body = await req.json(); } catch { body = {}; }

        const list = slogans();
        const dailyPosts = await base44.asServiceRole.entities.GlowDrop.filter({
            user_email: "system@lightmode.com",
            category: "Keep It 100",
            description: "daily_keep_it_100"
        });

        const today = new Date().toISOString().split('T')[0];
        const alreadyPublishedToday = dailyPosts.some((drop) => drop.created_date?.startsWith(today));
        if (alreadyPublishedToday) {
            return Response.json({ success: true, skipped: true, reason: "Already published today" });
        }

        const selected = list[dailyPosts.length % list.length];
        const payload = {
            user_email: "system@lightmode.com",
            verse: selected.verse,
            reflection: `📌 Keep It 100\n\n"${selected.title}"\n${selected.description}`,
            description: "daily_keep_it_100",
            status: "approved",
            category: "Keep It 100",
            hashtags: "#KeepIt100 #DailyDrops #GenerationLightMode",
            likes_count: 0,
            bonus_likes_enabled: true,
            pinned: false,
            hidden: false,
            is_flagged: false
        };

        if (body.dry_run) {
            return Response.json({ success: true, dry_run: true, next_index: selected.index + 1, next_title: selected.title, total_slogans: list.length });
        }

        const drop = await base44.asServiceRole.entities.GlowDrop.create(payload);
        return Response.json({ success: true, type: "keeping_it_100", drop_id: drop.id, index: selected.index + 1, title: selected.title });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});