// Seeds the CodeOfTruth store (source_document="keeping_it_100") with the full
// "Keep It 100" slogan library from the official document. This store powers the
// public /KeepIt100 page AND the Admin "Keep It 100" tab. New slogans are created
// as status="approved" so they appear live immediately. Existing slogans (matched
// by slogan_text) are skipped, so this is safe to re-run.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const SLOGANS = [
  { title: "Purity is Power! ⚡️💎", slogan: "Honor God with your body and live set apart for Him.", verse: "1 Corinthians 6:18-20", category: "Sexuality & Purity" },
  { title: "True Love Waits! ⏳❤️", slogan: "God's plan for love is worth the wait—don't settle for less.", verse: "1 Thessalonians 4:3-5", category: "Sexuality & Purity" },
  { title: "Holiness is Attractive! ✨👑", slogan: "A heart set on God is more beautiful than any outward appearance.", verse: "1 Peter 1:16", category: "Sexuality & Purity" },
  { title: "Guard Your Heart! 🛡️💖", slogan: "Your purity today shapes your future tomorrow.", verse: "Proverbs 4:23", category: "Sexuality & Purity" },
  { title: "Your Body, His Temple! 🏛️🔥", slogan: "God dwells in you—honor Him in every way.", verse: "1 Corinthians 3:16", category: "Sexuality & Purity" },
  { title: "Don't Trade Purity for Pleasure! ❌🍎", slogan: "Short-term pleasure isn't worth long-term pain.", verse: "Hebrews 12:16", category: "Sexuality & Purity" },
  { title: "Stay Pure, Stay Free! 🕊️🔗", slogan: "Purity isn't restriction; it's real freedom.", verse: "Galatians 5:1", category: "Sexuality & Purity" },
  { title: "Love God First! 🙌💞", slogan: "A heart fully in love with God will not compromise.", verse: "Matthew 22:37", category: "Sexuality & Purity" },
  { title: "Your Worth is Not in Your Past! 🚫🔙", slogan: "God redeems, restores, and makes all things new.", verse: "2 Corinthians 5:17", category: "Sexuality & Purity" },
  { title: "Be a Light, Not a Follower! 💡🚶", slogan: "Don't conform—shine for Christ in all areas of life.", verse: "Romans 12:2", category: "Sexuality & Purity" },

  { title: "Master Your Desires! 🏆💪", slogan: "Self-control leads to victory—don't be enslaved.", verse: "1 Corinthians 9:27", category: "Self-Control" },
  { title: "You Are Stronger Than Lust! ✊🔥", slogan: "In Christ, you have the power to overcome.", verse: "Galatians 5:16", category: "Self-Control" },
  { title: "Don't Feed the Flesh! 🚫🍖", slogan: "Starve temptation and feed your spirit.", verse: "Romans 8:13", category: "Self-Control" },
  { title: "Victory Begins in the Mind! 🧠⚔️", slogan: "Guard your thoughts, and you will guard your actions.", verse: "Philippians 4:8", category: "Self-Control" },
  { title: "Your Body, God's Dwelling! 🏛️🔥", slogan: "Keep your temple holy and pleasing to Him.", verse: "1 Thessalonians 4:4-5", category: "Self-Control" },
  { title: "Self-Control is Strength! 🛡️💥", slogan: "Weakness gives in—strength stands firm.", verse: "2 Timothy 1:7", category: "Self-Control" },
  { title: "God's Approval Over Instant Gratification! ⏳🙏", slogan: "What pleases God is better than a moment of pleasure.", verse: "1 Peter 2:11", category: "Self-Control" },
  { title: "What You Watch, You Become! 👀📺", slogan: "Fill your mind with purity, not impurity.", verse: "Matthew 6:22-23", category: "Self-Control" },
  { title: "Break the Chains of Addiction! 🔗🚪", slogan: "In Christ, you can be free.", verse: "John 8:36", category: "Self-Control" },
  { title: "Honor God in Private & Public! 🤍🔒", slogan: "What you do in secret matters to God.", verse: "Luke 8:17", category: "Self-Control" },

  { title: "Life is a Gift! 🎁👶", slogan: "Every heartbeat matters—choose life.", verse: "Psalm 139:13-16", category: "Sanctity of Life" },
  { title: "Protect the Unborn! 🛡️❤️", slogan: "Every child is created in God's image.", verse: "Genesis 1:27", category: "Sanctity of Life" },
  { title: "Speak for the Voiceless! 📢👂", slogan: "Stand up for those who can't speak for themselves.", verse: "Proverbs 31:8", category: "Sanctity of Life" },
  { title: "A Life is Not a Choice! ❌⚖️", slogan: "God has a plan for every child.", verse: "Jeremiah 1:5", category: "Sanctity of Life" },
  { title: "Love Them Both! 🤰👩‍👧", slogan: "Support both mother and child with love.", verse: "Isaiah 66:13", category: "Sanctity of Life" },
  { title: "Life Begins at Conception! 🌱💖", slogan: "Science confirms it, but God knew it first.", verse: "Luke 1:41", category: "Sanctity of Life" },
  { title: "Abortion Doesn't Heal Pain! 💔❌", slogan: "Let God heal, restore, and bring hope.", verse: "Psalm 147:3", category: "Sanctity of Life" },
  { title: "Every Life is Precious! 🌍🎈", slogan: "No child is an accident in God's eyes.", verse: "Job 33:4", category: "Sanctity of Life" },
  { title: "Choose Hope, Not Despair! 🌟🙏", slogan: "There are better options than abortion—seek help.", verse: "Romans 8:28", category: "Sanctity of Life" },
  { title: "Trust God with Every Life! ⛪🤱", slogan: "He knows every child's destiny.", verse: "Isaiah 46:4", category: "Sanctity of Life" },

  { title: "God is Your Provider! 💰🙌", slogan: "You don't need luck when you have faith.", verse: "Philippians 4:19", category: "Gambling & Stewardship" },
  { title: "Steward Wisely, Live Freely! 🎯💵", slogan: "God blesses faithful stewardship.", verse: "Matthew 25:21", category: "Gambling & Stewardship" },
  { title: "Easy Money, Costly Consequences! 🚨💸", slogan: "Gambling promises riches but delivers regret.", verse: "Proverbs 13:11", category: "Gambling & Stewardship" },
  { title: "Trust in God, Not in Luck! 🎲✝️", slogan: "God's provision is better than chance.", verse: "Proverbs 3:5-6", category: "Gambling & Stewardship" },
  { title: "Gambling Steals, Generosity Multiplies! 🤲💖", slogan: "Invest in God's kingdom, not quick schemes.", verse: "Luke 6:38", category: "Gambling & Stewardship" },
  { title: "Wealth Built on Wisdom Lasts! 🏗️💎", slogan: "Hard work and faith bring true success.", verse: "Proverbs 10:22", category: "Gambling & Stewardship" },
  { title: "Money is a Tool—Use It for Good! 🔧💲", slogan: "Don't let money control you; control it.", verse: "1 Timothy 6:10", category: "Gambling & Stewardship" },
  { title: "Greed Destroys, Contentment Satisfies! ☠️😌", slogan: "Be thankful for what God provides.", verse: "Hebrews 13:5", category: "Gambling & Stewardship" },
  { title: "Faithfulness Over Fortune! 📖👆", slogan: "Serve God, not money.", verse: "Matthew 6:24", category: "Gambling & Stewardship" },
  { title: "Gambling Promises Much, Delivers Little! 🎭💔", slogan: "Seek treasure in heaven, not the casino.", verse: "Matthew 6:20", category: "Gambling & Stewardship" },

  { title: "Study Hard, Shine Bright! 📚✨", slogan: "Excellence glorifies God—do your best in all things.", verse: "Colossians 3:23", category: "Education & Career" },
  { title: "God First, Success Follows! 🙏🏆", slogan: "Put God at the center of your education and career.", verse: "Proverbs 16:3", category: "Education & Career" },
  { title: "Your Gifts Have a Purpose! 🎨🔬", slogan: "God created you with talents—use them for His glory.", verse: "1 Peter 4:10", category: "Education & Career" },
  { title: "Learning is a Lifelong Journey! 🚀🧠", slogan: "Wisdom is better than gold—seek knowledge with humility.", verse: "Proverbs 4:7", category: "Education & Career" },
  { title: "Work Hard, Stay Honest! 💼💯", slogan: "Integrity is worth more than shortcuts.", verse: "Proverbs 10:9", category: "Education & Career" },
  { title: "God Opens the Right Doors! 🚪🔑", slogan: "Trust His timing in your career and studies.", verse: "Revelation 3:8", category: "Education & Career" },
  { title: "Your Career is Your Calling! 📢💼", slogan: "Let your job be a testimony of God's grace.", verse: "Ephesians 2:10", category: "Education & Career" },
  { title: "Excellence is Worship! 🎶📖", slogan: "Working with excellence honors God.", verse: "Daniel 6:3", category: "Education & Career" },
  { title: "God's Plans Are Greater Than Yours! 🔄🙏", slogan: "Seek His will, and your future will be secure.", verse: "Jeremiah 29:11", category: "Education & Career" },
  { title: "Never Stop Growing! 🌱📚", slogan: "Keep learning, keep improving, keep trusting God.", verse: "Proverbs 1:5", category: "Education & Career" },

  { title: "Work Smart, Trust God! 🏢🙏", slogan: "Wisdom and faith lead to true success.", verse: "James 1:5", category: "Entrepreneurship" },
  { title: "Kingdom Builders, Not Just Career Builders! 👑💼", slogan: "Your job is your ministry—let your work reflect Christ.", verse: "Matthew 5:16", category: "Entrepreneurship" },
  { title: "Honesty is the Best Business Strategy! ✅💡", slogan: "A good name is better than riches.", verse: "Proverbs 22:1", category: "Entrepreneurship" },
  { title: "Be a Leader, Not Just a Worker! 🚀👔", slogan: "Stand out with integrity and diligence.", verse: "Colossians 3:23", category: "Entrepreneurship" },
  { title: "God Blesses Diligence! 📈🔥", slogan: "Hard work leads to great rewards.", verse: "Proverbs 12:24", category: "Entrepreneurship" },
  { title: "Serve Others, Succeed More! 🤝💎", slogan: "The greatest leaders serve with love.", verse: "Mark 10:45", category: "Entrepreneurship" },
  { title: "God is Your CEO! 🏢👆", slogan: "Let Him direct your business and career.", verse: "Proverbs 16:9", category: "Entrepreneurship" },
  { title: "Don't Chase Money, Chase Purpose! 🏃💰", slogan: "A life of purpose is richer than a life of wealth.", verse: "Ecclesiastes 5:10", category: "Entrepreneurship" },
  { title: "Your Job is Your Mission Field! 🌍💼", slogan: "Let your workplace be a place of impact.", verse: "2 Corinthians 5:20", category: "Entrepreneurship" },
  { title: "Success is More Than Money! 💰💖", slogan: "True success is found in fulfilling God's purpose.", verse: "Luke 12:15", category: "Entrepreneurship" },

  { title: "God Writes the Best Love Stories! 📖❤️", slogan: "Wait on Him for the right partner.", verse: "Proverbs 3:5-6", category: "Marriage & Courtship" },
  { title: "A Godly Marriage Begins with a Godly Courtship! ⛪💍", slogan: "Build on faith, not just feelings.", verse: "2 Corinthians 6:14", category: "Marriage & Courtship" },
  { title: "Love is More Than a Feeling! 💖🧠", slogan: "Choose commitment, not just emotions.", verse: "1 Corinthians 13:4-7", category: "Marriage & Courtship" },
  { title: "Your Partner Should Push You Closer to God! 👩‍❤️‍👨🙏", slogan: "A strong relationship is built on faith.", verse: "Amos 3:3", category: "Marriage & Courtship" },
  { title: "Don't Settle—Wait for God's Best! ⏳🌟", slogan: "Patience leads to a love that lasts.", verse: "Psalm 37:4", category: "Marriage & Courtship" },
  { title: "Pray Before You Date! 🙏💕", slogan: "Let God be involved in your relationships.", verse: "Philippians 4:6-7", category: "Marriage & Courtship" },
  { title: "Marry Purpose, Not Just Passion! 💍🎯", slogan: "Choose a partner who aligns with your calling.", verse: "Genesis 2:18", category: "Marriage & Courtship" },
  { title: "God's Timing, Not Yours! ⏰✝️", slogan: "Trust Him to bring the right person at the right time.", verse: "Ecclesiastes 3:1", category: "Marriage & Courtship" },
  { title: "Faithfulness Starts Before Marriage! 🤍⛪", slogan: "Be the right person before finding the right person.", verse: "Luke 16:10", category: "Marriage & Courtship" },
  { title: "Marriage is a Covenant, Not a Contract! 📜💖", slogan: "Love is for life—commit with Christ at the center.", verse: "Mark 10:9", category: "Marriage & Courtship" },

  { title: "You Are Who God Says You Are! 👑💪", slogan: "Don't let the world define you.", verse: "2 Corinthians 5:17", category: "Peer Pressure" },
  { title: "Stand Out, Don't Blend In! 🌟🚀", slogan: "Be different for God's glory.", verse: "Romans 12:2", category: "Peer Pressure" },
  { title: "Christ is Your Identity! ✝️🔥", slogan: "Don't trade your faith for approval.", verse: "Galatians 2:20", category: "Peer Pressure" },
  { title: "Don't Let Pressure Change Your Purpose! 💪🎯", slogan: "Follow Christ, not the crowd.", verse: "Matthew 7:13-14", category: "Peer Pressure" },
  { title: "You're Set Apart for a Reason! 🛡️✨", slogan: "Holiness is not outdated—it's powerful.", verse: "1 Peter 2:9", category: "Peer Pressure" },
  { title: "Approval from God Over Likes from People! 👍🚫", slogan: "Seek His validation above all else.", verse: "John 12:43", category: "Peer Pressure" },
  { title: "Your True Friends Lead You Closer to God! 👫🙏", slogan: "Choose friendships wisely.", verse: "Proverbs 27:17", category: "Peer Pressure" },
  { title: "Fitting in Isn't Worth Losing Your Faith! 🚀🔥", slogan: "Choose Christ over culture.", verse: "James 4:4", category: "Peer Pressure" },
  { title: "You Are Loved Just as You Are! 💙✝️", slogan: "You don't need to change for acceptance.", verse: "Romans 8:38-39", category: "Peer Pressure" },
  { title: "Live for God, Not for Approval! 🎯📢", slogan: "His opinion is the only one that truly matters.", verse: "Colossians 3:23", category: "Peer Pressure" },

  { title: "Victory Starts in the Mind! 🏆🧠", slogan: "Guard your thoughts—temptation begins there.", verse: "2 Corinthians 10:5", category: "Spiritual Warfare" },
  { title: "The Devil is a Liar! 🚫🐍", slogan: "Don't believe his tricks—God's truth sets you free.", verse: "John 8:44", category: "Spiritual Warfare" },
  { title: "Temptation is Temporary, but Consequences Last! ⏳⚠️", slogan: "Choose righteousness over regret.", verse: "James 1:15", category: "Spiritual Warfare" },
  { title: "Jesus Fought Temptation—So Can You! 🛡️✝️", slogan: "Use God's Word as your weapon.", verse: "Matthew 4:4", category: "Spiritual Warfare" },
  { title: "Pray Before You Stray! 🙏🚦", slogan: "Prayer strengthens you against sin.", verse: "Matthew 26:41", category: "Spiritual Warfare" },
  { title: "The Armor of God Never Fails! ⚔️🛡️", slogan: "Equip yourself daily for spiritual battles.", verse: "Ephesians 6:11", category: "Spiritual Warfare" },
  { title: "Satan Can't Win When You Stay in Christ! 🔥👑", slogan: "Stay connected to God, and you'll overcome.", verse: "Romans 8:37", category: "Spiritual Warfare" },
  { title: "Flee, Don't Flirt with Sin! 🚀🏃", slogan: "Running from temptation is not weakness—it's wisdom.", verse: "1 Corinthians 6:18", category: "Spiritual Warfare" },
  { title: "Resist the Devil, and He Will Flee! 🚫👿", slogan: "You have the power to say NO.", verse: "James 4:7", category: "Spiritual Warfare" },
  { title: "Spiritual Warfare is Real—Stay Ready! 💪⛪", slogan: "Be alert, be strong, and stay in prayer.", verse: "1 Peter 5:8", category: "Spiritual Warfare" },

  { title: "Show Me Your Friends, and I'll Show You Your Future! 🔄🤝", slogan: "The people you surround yourself with shape your life.", verse: "Proverbs 13:20", category: "Friendship" },
  { title: "Good Friends Bring You Closer to God! ✝️❤️", slogan: "Choose friendships that strengthen your faith.", verse: "1 Corinthians 15:33", category: "Friendship" },
  { title: "Iron Sharpens Iron! 🔥🗡️", slogan: "Real friends help you grow spiritually.", verse: "Proverbs 27:17", category: "Friendship" },
  { title: "Your Circle Should Strengthen, Not Strain You! ⭕💡", slogan: "Surround yourself with people who uplift, not drain, you.", verse: "Hebrews 10:24", category: "Friendship" },
  { title: "A True Friend Speaks the Truth! 🗣️💬", slogan: "Love corrects with kindness, not just agreement.", verse: "Proverbs 27:6", category: "Friendship" },
  { title: "Your Influence Matters! 🌍💖", slogan: "Shine your light in every friendship.", verse: "Matthew 5:16", category: "Friendship" },
  { title: "Friends Should Point You to Christ! ➡️✝️", slogan: "If they're leading you away, reconsider the friendship.", verse: "Amos 3:3", category: "Friendship" },
  { title: "Better to Be Alone Than in Bad Company! 🚫🤷", slogan: "Don't keep toxic friendships just to fit in.", verse: "Psalm 1:1", category: "Friendship" },
  { title: "Be a Friend Who Loves at All Times! 🤗🛡️", slogan: "Loyalty and kindness make lasting friendships.", verse: "Proverbs 17:17", category: "Friendship" },
  { title: "Your Friends Reflect Your Values! 👀📖", slogan: "Choose relationships that reflect your commitment to God.", verse: "Proverbs 22:24-25", category: "Friendship" },

  { title: "God's Design, God's Rules—One Man, One Woman! ✝️💍", slogan: "God's design for marriage is one man and one woman.", verse: "Genesis 2:24", category: "God's Truth on Sexuality" },
  { title: "Love Speaks Truth—Sin is Still Sin! 💯📖", slogan: "Real love tells the truth about sin.", verse: "1 Corinthians 6:9-10", category: "God's Truth on Sexuality" },
  { title: "God Made Male & Female—No Edits Needed! 🚹🚺", slogan: "From the beginning God made them male and female.", verse: "Mark 10:6", category: "God's Truth on Sexuality" },
  { title: "The Rainbow Belongs to God, Not the World! 🌈✝️", slogan: "The rainbow is God's covenant sign.", verse: "Genesis 9:13", category: "God's Truth on Sexuality" },
  { title: "Don't Follow Feelings, Follow God's Word! 📖🔥", slogan: "The heart is deceitful—trust God's Word.", verse: "Jeremiah 17:9", category: "God's Truth on Sexuality" },
  { title: "Real Love Warns—Sin Leads to Death! ⛔⚠️", slogan: "The wages of sin is death, but God's gift is life.", verse: "Romans 6:23", category: "God's Truth on Sexuality" },
  { title: "Jesus Saves, Sin Destroys—Choose Wisely! ✝️💡", slogan: "Go and sin no more—Jesus restores.", verse: "John 8:11", category: "God's Truth on Sexuality" },
  { title: "Truth Over Trends—God's Word Stands Forever! 📖🚀", slogan: "The Word of God stands forever.", verse: "Isaiah 40:8", category: "God's Truth on Sexuality" },
  { title: "You're More Than Your Desires—God Has a Greater Plan! 🔥🙌", slogan: "Be transformed by the renewing of your mind.", verse: "Romans 12:2", category: "God's Truth on Sexuality" },
  { title: "Come As You Are, But Don't Stay As You Are—Jesus Transforms! 🛑✝️", slogan: "In Christ you are a new creation.", verse: "2 Corinthians 5:17", category: "God's Truth on Sexuality" },

  { title: "Sobriety is Strength! 💪🚫🍷", slogan: "Self-control is a fruit of the Spirit.", verse: "Galatians 5:22-23", category: "Alcohol" },
  { title: "Alcohol Destroys, but God Restores! 🍺✝️", slogan: "Only Jesus can truly satisfy.", verse: "Ephesians 5:18", category: "Alcohol" },
  { title: "You Don't Need a Drink to Feel Free! 🚫🥂", slogan: "Real freedom is in Christ.", verse: "John 8:36", category: "Alcohol" },
  { title: "Drunkenness Leads to Destruction! 🚨⚠️", slogan: "Be wise, stay sober.", verse: "Proverbs 20:1", category: "Alcohol" },
  { title: "Escape to God, Not the Bottle! 🏃✝️", slogan: "He is your refuge.", verse: "Psalm 46:1", category: "Alcohol" },
  { title: "Drinking Won't Fill the Void! 🚫🥃", slogan: "Only Jesus satisfies.", verse: "Isaiah 55:1", category: "Alcohol" },
  { title: "Stay Sober, Stay Sharp! 🧠💡", slogan: "A clear mind honors God.", verse: "1 Peter 5:8", category: "Alcohol" },
  { title: "Don't Let Alcohol Control You! ⛓️🥃", slogan: "Self-control is power.", verse: "Proverbs 23:29-35", category: "Alcohol" },
  { title: "Be a Light, Not a Stumbling Block! 💡🚫", slogan: "Lead others toward righteousness.", verse: "Romans 14:21", category: "Alcohol" },
  { title: "Joy Comes from Jesus, Not a Bottle! 😊✝️", slogan: "True happiness is found in Christ.", verse: "John 15:11", category: "Alcohol" },

  { title: "What You Watch Shapes You! 👀📺", slogan: "Be mindful of your influences.", verse: "Psalm 101:3", category: "Entertainment" },
  { title: "Choose Godly Entertainment! 📖🎬", slogan: "Let your choices honor Him.", verse: "Philippians 4:8", category: "Entertainment" },
  { title: "Don't Let Media Corrupt Your Mind! 🚫📱", slogan: "Guard your heart against harmful content.", verse: "Proverbs 4:23", category: "Entertainment" },
  { title: "Jesus Wouldn't Watch That—Would You? 👀✝️", slogan: "Honor God with what you consume.", verse: "Romans 12:2", category: "Entertainment" },
  { title: "Glorify God in Your Free Time! 🕒🙏", slogan: "Entertainment should not pull you away from Christ.", verse: "Colossians 3:17", category: "Entertainment" },
  { title: "Not All Fun is Good Fun! 🚫😂", slogan: "Be wise in your choices.", verse: "Ephesians 5:11", category: "Entertainment" },
  { title: "The World Entertains, God Transforms! 🔥🌍", slogan: "Seek spiritual growth over worldly pleasure.", verse: "2 Timothy 2:22", category: "Entertainment" },
  { title: "Music & Movies Influence the Heart! 🎵🎬", slogan: "Be careful what you let in.", verse: "Luke 6:45", category: "Entertainment" },
  { title: "Your Eyes Are the Gateway to Your Soul! 👁️⚠️", slogan: "Watch wisely.", verse: "Matthew 6:22", category: "Entertainment" },
  { title: "Not Everything Trending is Worth Watching! 📉🚫", slogan: "Choose eternal values over temporary thrills.", verse: "1 John 2:15-17", category: "Entertainment" },

  { title: "Think Before You Click! 🤔💻", slogan: "Words have power—use them wisely.", verse: "Proverbs 18:21", category: "Social Media" },
  { title: "More Bible, Less Screen Time! 📖📱", slogan: "Prioritize God over distractions.", verse: "Matthew 6:33", category: "Social Media" },
  { title: "Don't Let Social Media Define You! 🚫📲", slogan: "Your worth is in Christ, not likes.", verse: "Psalm 139:14", category: "Social Media" },
  { title: "Post to Inspire, Not to Impress! 🎯💬", slogan: "Let your content glorify God.", verse: "Colossians 3:17", category: "Social Media" },
  { title: "Filters Don't Change Reality! 😶📸", slogan: "Be real—God loves the unfiltered you.", verse: "1 Samuel 16:7", category: "Social Media" },
  { title: "Not Everything Online is True! 🚦🌍", slogan: "Test all things against God's Word.", verse: "1 Thessalonians 5:21", category: "Social Media" },
  { title: "Guard Your Eyes, Guard Your Heart! 👀❤️", slogan: "Be careful what you consume.", verse: "Matthew 6:22", category: "Social Media" },
  { title: "Don't Trade Presence for Pixels! 🚀👥", slogan: "Be fully present in real life.", verse: "Ecclesiastes 3:1", category: "Social Media" },
  { title: "If It Doesn't Honor God, Don't Post It! ✝️📢", slogan: "Use your platform for good.", verse: "Ephesians 4:29", category: "Social Media" },
  { title: "Technology Should Serve You, Not Enslave You! ⛓️📶", slogan: "Stay in control of your screen time.", verse: "1 Corinthians 6:12", category: "Social Media" },

  { title: "True Beauty Comes from the Heart! ❤️✨", slogan: "Modesty reflects inner godliness.", verse: "1 Peter 3:3-4", category: "Modesty" },
  { title: "Dress to Honor, Not to Impress! 👗🎭", slogan: "Your body is God's temple.", verse: "1 Corinthians 6:19-20", category: "Modesty" },
  { title: "Purity is a Daily Choice! 💎📖", slogan: "Stay committed to holiness.", verse: "1 Thessalonians 4:3-4", category: "Modesty" },
  { title: "Respect Yourself, Reflect Christ! 🪞✝️", slogan: "Your dress and actions should glorify Him.", verse: "Romans 12:1", category: "Modesty" },
  { title: "Cover What is Sacred! 👚👖", slogan: "Modesty is about respect, not rules.", verse: "1 Timothy 2:9", category: "Modesty" },
  { title: "A Pure Heart Leads to a Pure Life! ❤️🚪", slogan: "Guard your thoughts first.", verse: "Matthew 5:8", category: "Modesty" },
  { title: "True Love Waits! ⏳💖", slogan: "Save intimacy for marriage.", verse: "Hebrews 13:4", category: "Modesty" },
  { title: "Modesty is Confidence, Not Shame! 😊✨", slogan: "You are precious in God's eyes.", verse: "Proverbs 31:25", category: "Modesty" },
  { title: "Purity is Possible with Christ! ✝️💎", slogan: "God's grace can restore and strengthen you.", verse: "2 Corinthians 5:17", category: "Modesty" },
  { title: "Your Worth is in God, Not in Approval! 🏆🙌", slogan: "Seek God's approval over worldly trends.", verse: "Galatians 1:10", category: "Modesty" },

  { title: "What You Listen to Shapes You! 🎵💭", slogan: "Fill your mind with God-honoring content.", verse: "Philippians 4:8", category: "Music & Media" },
  { title: "Music Can Heal or Harm—Choose Wisely! 🎼🚦", slogan: "Be mindful of your influences.", verse: "Colossians 3:16", category: "Music & Media" },
  { title: "Lyrics Matter! 📝👂", slogan: "Words have power over your spirit.", verse: "Proverbs 4:23", category: "Music & Media" },
  { title: "Not Every Beat Glorifies God! 🎶⚠️", slogan: "Music should draw you closer to Him.", verse: "Ephesians 5:19", category: "Music & Media" },
  { title: "Jesus Over Junk! 🚫🎧", slogan: "Choose songs that feed your faith, not your flesh.", verse: "Romans 12:2", category: "Music & Media" },
  { title: "Entertainment Shouldn't Compromise Your Faith! 🎬✝️", slogan: "Watch and listen with wisdom.", verse: "Psalm 101:3", category: "Music & Media" },
  { title: "The Right Playlist Can Change Your Day! 💿😃", slogan: "Uplifting music transforms your mood.", verse: "Isaiah 26:3", category: "Music & Media" },
  { title: "Music is a Powerful Tool—Use it for Worship! 🎤🙏", slogan: "Sing and play for the glory of God.", verse: "Psalm 95:1", category: "Music & Media" },
  { title: "What You Watch, You Become! 📺👀", slogan: "Protect your heart from ungodly content.", verse: "Luke 6:45", category: "Music & Media" },
  { title: "Christian Media = Christian Mindset! 🏆📖", slogan: "Fill your spirit with God's truth.", verse: "Psalm 19:14", category: "Music & Media" },

  { title: "Integrity is Who You Are When No One is Watching! 🔍🛡️", slogan: "Be honest in all areas of life.", verse: "Proverbs 10:9", category: "Integrity" },
  { title: "A Lie Can Ruin a Lifetime of Trust! 🚫🤥", slogan: "Speak truth at all times.", verse: "Ephesians 4:25", category: "Integrity" },
  { title: "Honesty Always Wins! 🏆🎯", slogan: "The truth sets you free.", verse: "John 8:32", category: "Integrity" },
  { title: "God Sees Everything! 👀🔦", slogan: "Live transparently before Him.", verse: "Hebrews 4:13", category: "Integrity" },
  { title: "Your Character Speaks Louder Than Words! 📢💎", slogan: "Live with integrity daily.", verse: "1 Samuel 16:7", category: "Integrity" },
  { title: "Cheating Isn't Winning! 🚫🎮", slogan: "Stay true in all areas of life.", verse: "Colossians 3:23", category: "Integrity" },
  { title: "Honesty Builds, Lies Destroy! 🏗️⚡", slogan: "Relationships thrive on trust.", verse: "Proverbs 12:22", category: "Integrity" },
  { title: "Let Your Yes Be Yes! ✅🙌", slogan: "Keep your word.", verse: "Matthew 5:37", category: "Integrity" },
  { title: "Integrity Brings Promotion! ⬆️✨", slogan: "God honors those who walk in truth.", verse: "Psalm 75:6-7", category: "Integrity" },
  { title: "Do Right, Even When It's Hard! ⚖️🔥", slogan: "Honesty is always worth it.", verse: "Galatians 6:9", category: "Integrity" },

  { title: "Words Can Heal or Harm—Choose Wisely! 🗣️💔", slogan: "Speak life, not destruction.", verse: "Proverbs 18:21", category: "Speech & Gossip" },
  { title: "Silence is Better Than Gossip! 🤫🚫", slogan: "Avoid idle talk.", verse: "Proverbs 11:13", category: "Speech & Gossip" },
  { title: "Your Words Represent Christ! ✝️🗣️", slogan: "Speak with grace.", verse: "Colossians 4:6", category: "Speech & Gossip" },
  { title: "Spread Love, Not Rumors! ❤️📢", slogan: "Speak only what builds up.", verse: "Ephesians 4:29", category: "Speech & Gossip" },
  { title: "Truth is Kind, Gossip is Poison! ☠️💬", slogan: "Protect others with your words.", verse: "James 3:6", category: "Speech & Gossip" },
  { title: "Before You Speak, Think! 🧐💭", slogan: "Is it true? Is it necessary? Is it kind?", verse: "Proverbs 15:28", category: "Speech & Gossip" },
  { title: "Talk Less, Pray More! 🙏🔇", slogan: "Let God guide your words.", verse: "Matthew 12:36", category: "Speech & Gossip" },
  { title: "Your Tongue is a Fire—Use it Wisely! 🔥🗣️", slogan: "Don't let your words burn others.", verse: "James 3:5", category: "Speech & Gossip" },
  { title: "Be Known for Encouragement, Not Drama! 💬✨", slogan: "Build up, don't tear down.", verse: "1 Thessalonians 5:11", category: "Speech & Gossip" },
  { title: "Words Are Seeds—Plant Good Ones! 🌱🎤", slogan: "Speak words that bear good fruit.", verse: "Matthew 12:37", category: "Speech & Gossip" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const existing = await base44.asServiceRole.entities.CodeOfTruth.filter({ source_document: 'keeping_it_100' });
    const existingKeys = new Set(existing.map((c) => (c.slogan_text || '').trim().toLowerCase()));

    const missing = SLOGANS.filter((s) => body.force || !existingKeys.has(s.slogan.trim().toLowerCase()));

    if (body.dry_run) {
      return Response.json({
        success: true, dry_run: true,
        total_in_document: SLOGANS.length,
        already_in_app: existing.length,
        will_create: missing.length,
      });
    }

    // Create in a bounded batch with small pauses to respect rate limits.
    // Re-run until "remaining" is 0.
    const batchLimit = Math.max(1, Math.min(Number(body.limit || 40), 60));
    const batch = missing.slice(0, batchLimit);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    let created = 0;
    for (const s of batch) {
      await base44.asServiceRole.entities.CodeOfTruth.create({
        title: s.title,
        slogan_text: s.slogan,
        bible_reference: s.verse,
        category: s.category,
        source_document: 'keeping_it_100',
        status: 'approved',
      });
      created += 1;
      await sleep(120);
    }

    return Response.json({
      success: true,
      total_in_document: SLOGANS.length,
      already_in_app: existing.length,
      created,
      remaining: Math.max(0, missing.length - created),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});