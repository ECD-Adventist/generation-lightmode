// Faith Quiz level ladder — each level gets harder and pays more XP per correct answer.
// Levels unlock only when the player reaches the level's passScore.

export const QUIZ_LEVELS = [
  {
    level: 1,
    title: "Foundations",
    subtitle: "Keep It 100 basics",
    icon: "📖",
    xpPerQuestion: 5,
    passScore: 6,
    questions: [
      { id: "l1q1", question: "What does 'Keeping It 100' mean in the context of faith?", options: ["Being 100% perfect", "Being completely honest, real and authentic with God", "Scoring 100% on Bible tests", "Attending church 100 times"], correct: 1, slogan: "Keeping it 100 means being real, honest, and true—no pretending, no fakeness.", reference: "John 8:32" },
      { id: "l1q2", question: "Which Bible verse says 'Do not conform to the pattern of this world'?", options: ["John 3:16", "Philippians 4:13", "Romans 12:2", "Proverbs 4:23"], correct: 2, slogan: "Stand Out, Don't Blend In!", reference: "Romans 12:2" },
      { id: "l1q3", question: "\"Purity is Power\" is about...", options: ["Physical strength", "Honoring God with your body and living set apart", "Being better than others", "Following strict rules"], correct: 1, slogan: "Honor God with your body and live set apart for Him.", reference: "1 Corinthians 6:18-20" },
      { id: "l1q4", question: "According to Proverbs 4:23, what should you guard above all else?", options: ["Your money", "Your reputation", "Your heart", "Your words"], correct: 2, slogan: "Your purity today shapes your future tomorrow.", reference: "Proverbs 4:23" },
      { id: "l1q5", question: "What is your body described as in 1 Corinthians 3:16?", options: ["A house of sin", "God's Temple", "A borrowed vessel", "A temporary shell"], correct: 1, slogan: "God dwells in you—honor Him in every way.", reference: "1 Corinthians 3:16" },
      { id: "l1q6", question: "\"True Love Waits\" encourages youth to...", options: ["Wait for the perfect person", "Wait on God's plan for love and not settle for less", "Take time before dating", "Find love in church only"], correct: 1, slogan: "God's plan for love is worth the wait—don't settle for less.", reference: "1 Thessalonians 4:3-5" },
      { id: "l1q7", question: "What does 'Iron Sharpens Iron' (Proverbs 27:17) mean?", options: ["You need to be tough like iron", "Real friends help you grow spiritually", "Competition makes you better", "Hard work pays off"], correct: 1, slogan: "Real friends help you grow spiritually.", reference: "Proverbs 27:17" },
      { id: "l1q8", question: "\"Victory Begins in the Mind\" — what should you guard according to Philippians 4:8?", options: ["Your schedule", "Your finances", "Your thoughts", "Your friendships"], correct: 2, slogan: "Guard your thoughts, and you will guard your actions.", reference: "Philippians 4:8" },
      { id: "l1q9", question: "In 2 Corinthians 5:17, what happens to anyone who is in Christ?", options: ["They become perfect", "They become a new creation", "They get all blessings", "They never face trouble"], correct: 1, slogan: "God redeems, restores, and makes all things new.", reference: "2 Corinthians 5:17" },
      { id: "l1q10", question: "What does 'Think Before You Click' remind us about social media?", options: ["Protect your privacy", "Words have power—use them wisely", "Avoid all social media", "Post more inspirational content"], correct: 1, slogan: "Words have power—use them wisely.", reference: "Proverbs 18:21" },
    ],
  },
  {
    level: 2,
    title: "Identity & Purity",
    subtitle: "Know who you are",
    icon: "✝️",
    xpPerQuestion: 8,
    passScore: 6,
    questions: [
      { id: "l2q1", question: "In 1 Peter 2:9, believers are called a chosen people and a...", options: ["Royal priesthood", "Mighty army", "Faithful remnant", "Holy assembly"], correct: 0, slogan: "You were chosen to declare His praises.", reference: "1 Peter 2:9" },
      { id: "l2q2", question: "Paul tells Timothy not to let anyone look down on him because of his...", options: ["Poverty", "Youth", "Illness", "Background"], correct: 1, slogan: "Set an example in speech, conduct, love, faith and purity.", reference: "1 Timothy 4:12" },
      { id: "l2q3", question: "According to Psalm 119:9, how does a young person keep their way pure?", options: ["By fasting often", "By living according to God's word", "By avoiding people", "By praying at night"], correct: 1, slogan: "God's word is the filter for a pure life.", reference: "Psalm 119:9" },
      { id: "l2q4", question: "Galatians 2:20 says 'I no longer live, but...'", options: ["Christ lives in me", "The Spirit guides me", "I walk by faith", "God works through me"], correct: 0, slogan: "Your identity is hidden in Christ, not in the crowd.", reference: "Galatians 2:20" },
      { id: "l2q5", question: "What does Matthew 5:8 promise the pure in heart?", options: ["They will inherit the earth", "They will see God", "They will be comforted", "They will be called children of God"], correct: 1, slogan: "Purity of heart brings clear vision of God.", reference: "Matthew 5:8" },
      { id: "l2q6", question: "In Daniel 1, how did Daniel keep himself from being defiled?", options: ["He refused the king's food and wine", "He fled the palace", "He fasted for 40 days", "He hid his Bible"], correct: 0, slogan: "Convictions decided in advance protect you in pressure.", reference: "Daniel 1:8" },
      { id: "l2q7", question: "Joseph's response to temptation in Potiphar's house was to...", options: ["Argue his case", "Flee the situation", "Report her to Potiphar", "Pray and stay"], correct: 1, slogan: "Sometimes the holiest move is to run.", reference: "Genesis 39:12" },
      { id: "l2q8", question: "1 Corinthians 10:13 says God always provides...", options: ["A way out so you can endure it", "Instant deliverance", "A replacement blessing", "Angels to fight for you"], correct: 0, slogan: "No temptation is beyond God's escape route.", reference: "1 Corinthians 10:13" },
      { id: "l2q9", question: "According to Romans 8:1, those in Christ Jesus face no...", options: ["Condemnation", "Temptation", "Persecution", "Correction"], correct: 0, slogan: "Grace deals with your shame, not just your sin.", reference: "Romans 8:1" },
      { id: "l2q10", question: "Ephesians 4:29 tells us our talk should be...", options: ["Rare and quiet", "Only what builds others up", "Always serious", "Full of Scripture quotes"], correct: 1, slogan: "Let your words build, never break.", reference: "Ephesians 4:29" },
    ],
  },
  {
    level: 3,
    title: "Word Power",
    subtitle: "Scripture sharpshooter",
    icon: "⚔️",
    xpPerQuestion: 10,
    passScore: 7,
    questions: [
      { id: "l3q1", question: "Which book records the phrase 'The fear of the LORD is the beginning of wisdom'?", options: ["Psalms", "Proverbs", "Ecclesiastes", "Job"], correct: 1, slogan: "Wisdom starts with reverence.", reference: "Proverbs 9:10" },
      { id: "l3q2", question: "Hebrews 4:12 describes the word of God as sharper than any...", options: ["Arrow", "Double-edged sword", "Spear", "Sickle"], correct: 1, slogan: "Scripture cuts deeper than argument.", reference: "Hebrews 4:12" },
      { id: "l3q3", question: "In Ephesians 6, which piece of armour is the word of God?", options: ["Shield of faith", "Breastplate of righteousness", "Sword of the Spirit", "Helmet of salvation"], correct: 2, slogan: "The only offensive weapon in the armour is the Word.", reference: "Ephesians 6:17" },
      { id: "l3q4", question: "How did Jesus answer every temptation in the wilderness?", options: ["With silence", "With 'It is written'", "By calling angels", "By quoting a parable"], correct: 1, slogan: "Memorised Scripture becomes your defence.", reference: "Matthew 4:4" },
      { id: "l3q5", question: "2 Timothy 3:16 says all Scripture is God-breathed and useful for teaching, rebuking, correcting and...", options: ["Prophesying", "Training in righteousness", "Debating", "Healing"], correct: 1, slogan: "The Word trains you, not just informs you.", reference: "2 Timothy 3:16" },
      { id: "l3q6", question: "Psalm 119:105 calls God's word a lamp to my feet and a...", options: ["Light for my path", "Shield for my heart", "Song in the night", "Fire in my bones"], correct: 0, slogan: "The Word lights the next step, not the whole road.", reference: "Psalm 119:105" },
      { id: "l3q7", question: "James 1:22-25 compares hearing the Word without doing it to...", options: ["A man looking in a mirror and forgetting his face", "A farmer without seed", "A soldier without armour", "A lamp under a bowl"], correct: 0, slogan: "Be a doer of the Word, not just a hearer.", reference: "James 1:23-24" },
      { id: "l3q8", question: "Which group 'examined the Scriptures every day' to verify Paul's message?", options: ["The Corinthians", "The Bereans", "The Ephesians", "The Galatians"], correct: 1, slogan: "Noble faith checks everything against Scripture.", reference: "Acts 17:11" },
      { id: "l3q9", question: "Isaiah 55:11 says God's word will not return empty but will...", options: ["Comfort the weary", "Accomplish what He desires", "Silence His enemies", "Endure forever"], correct: 1, slogan: "God's word always finishes its assignment.", reference: "Isaiah 55:11" },
      { id: "l3q10", question: "Colossians 3:16 tells us to let the message of Christ...", options: ["Dwell among you richly", "Be preached loudly", "Be written on stone", "Guard your gates"], correct: 0, slogan: "Let the Word live in your everyday conversation.", reference: "Colossians 3:16" },
    ],
  },
  {
    level: 4,
    title: "Deep Waters",
    subtitle: "Doctrine & discipleship",
    icon: "🌊",
    xpPerQuestion: 13,
    passScore: 7,
    questions: [
      { id: "l4q1", question: "According to Ephesians 2:8-9, salvation comes by grace through faith and not by...", options: ["Works, so no one can boast", "Baptism alone", "Church membership", "Obedience to the law"], correct: 0, slogan: "Grace leaves no room for pride.", reference: "Ephesians 2:8-9" },
      { id: "l4q2", question: "Which fruit of the Spirit is listed FIRST in Galatians 5:22?", options: ["Joy", "Love", "Peace", "Patience"], correct: 1, slogan: "Love is the root; the rest is the fruit.", reference: "Galatians 5:22" },
      { id: "l4q3", question: "In John 14:16-17, what name does Jesus give the Holy Spirit?", options: ["The Advocate / Helper", "The Judge", "The Messenger", "The Witness"], correct: 0, slogan: "You are never left to fight alone.", reference: "John 14:16-17" },
      { id: "l4q4", question: "Romans 6:23 says the wages of sin is death, but the gift of God is...", options: ["Forgiveness", "Eternal life in Christ Jesus", "Peace with God", "A new heart"], correct: 1, slogan: "Sin pays wages; God gives gifts.", reference: "Romans 6:23" },
      { id: "l4q5", question: "The Great Commission in Matthew 28:19-20 commands believers to...", options: ["Build temples", "Make disciples of all nations", "Defend the faith", "Wait for the Spirit"], correct: 1, slogan: "Discipleship, not just decisions.", reference: "Matthew 28:19-20" },
      { id: "l4q6", question: "In 1 John 1:9, what happens when we confess our sins?", options: ["He is faithful and just to forgive and cleanse us", "We earn back our salvation", "We must do penance", "Our memory is erased"], correct: 0, slogan: "Confession opens the door grace already unlocked.", reference: "1 John 1:9" },
      { id: "l4q7", question: "Philippians 2:5-8 says Christ humbled Himself and became obedient to...", options: ["The Father's will only", "Death on a cross", "The law of Moses", "The temple priests"], correct: 1, slogan: "Humility took Jesus all the way down so we could rise.", reference: "Philippians 2:8" },
      { id: "l4q8", question: "Hebrews 11:1 defines faith as confidence in what we hope for and assurance about...", options: ["What we do not see", "What God promised the fathers", "Our future reward", "The coming kingdom"], correct: 0, slogan: "Faith sees before sight.", reference: "Hebrews 11:1" },
      { id: "l4q9", question: "In Revelation 14:12, the saints are described as those who keep God's commandments and...", options: ["The faith of Jesus", "The traditions of the elders", "The feasts of Israel", "The oath of the temple"], correct: 0, slogan: "Endurance plus faithfulness marks the last generation.", reference: "Revelation 14:12" },
      { id: "l4q10", question: "According to 2 Corinthians 5:20, believers are Christ's...", options: ["Ambassadors", "Servants", "Soldiers", "Heirs"], correct: 0, slogan: "You represent a kingdom everywhere you go.", reference: "2 Corinthians 5:20" },
    ],
  },
  {
    level: 5,
    title: "Fire Trials",
    subtitle: "For the seasoned",
    icon: "🔥",
    xpPerQuestion: 15,
    passScore: 8,
    questions: [
      { id: "l5q1", question: "Which prophet was told 'Before I formed you in the womb I knew you'?", options: ["Isaiah", "Jeremiah", "Ezekiel", "Hosea"], correct: 1, slogan: "God's call on your life predates your birth.", reference: "Jeremiah 1:5" },
      { id: "l5q2", question: "Who said 'Though he slay me, yet will I hope in him'?", options: ["David", "Job", "Habakkuk", "Jonah"], correct: 1, slogan: "Faith that survives loss is real faith.", reference: "Job 13:15" },
      { id: "l5q3", question: "In Daniel 3, what did the three Hebrews say before entering the furnace?", options: ["'Our God is able to deliver us, but even if He does not...'", "'Let the king see our God'", "'We will not die today'", "'God will strike you down'"], correct: 0, slogan: "Obedience is not conditional on rescue.", reference: "Daniel 3:17-18" },
      { id: "l5q4", question: "Which New Testament book says 'Consider it pure joy whenever you face trials'?", options: ["1 Peter", "James", "Hebrews", "Romans"], correct: 1, slogan: "Trials mature what comfort never could.", reference: "James 1:2-4" },
      { id: "l5q5", question: "Paul described a 'thorn in the flesh' and God's answer was...", options: ["'My grace is sufficient for you'", "'Be still and know'", "'I will remove it in time'", "'Pray without ceasing'"], correct: 0, slogan: "Grace is strongest where you are weakest.", reference: "2 Corinthians 12:9" },
      { id: "l5q6", question: "Habakkuk 3:17-18 declares rejoicing in the LORD even when...", options: ["The fig tree does not bud and there are no crops", "Enemies surround the city", "The temple is destroyed", "The rains do not come"], correct: 0, slogan: "Worship is a choice, not a mood.", reference: "Habakkuk 3:17-18" },
      { id: "l5q7", question: "In Acts 16, what did Paul and Silas do at midnight in prison?", options: ["Prayed and sang hymns to God", "Slept peacefully", "Preached to the guards", "Fasted in silence"], correct: 0, slogan: "Praise in chains shakes foundations.", reference: "Acts 16:25" },
      { id: "l5q8", question: "1 Peter 4:12-13 says not to be surprised at fiery trials but to...", options: ["Rejoice in sharing Christ's sufferings", "Rebuke the enemy", "Withdraw and rest", "Seek an explanation"], correct: 0, slogan: "Shared suffering means shared glory.", reference: "1 Peter 4:13" },
      { id: "l5q9", question: "Who prayed 'Not my will, but yours be done' in Gethsemane?", options: ["Peter", "Jesus", "Stephen", "Paul"], correct: 1, slogan: "Surrender is the highest form of strength.", reference: "Luke 22:42" },
      { id: "l5q10", question: "Romans 5:3-4 traces the chain: suffering produces perseverance, perseverance produces character, and character produces...", options: ["Hope", "Peace", "Wisdom", "Joy"], correct: 0, slogan: "Nothing you endure with God is wasted.", reference: "Romans 5:3-4" },
    ],
  },
  {
    level: 6,
    title: "Champion Round",
    subtitle: "Only the sharpest pass",
    icon: "👑",
    xpPerQuestion: 20,
    passScore: 9,
    questions: [
      { id: "l6q1", question: "How many books are in the Protestant Old Testament?", options: ["27", "36", "39", "46"], correct: 2, slogan: "Know the shape of the Book you carry.", reference: "Luke 24:44" },
      { id: "l6q2", question: "Which is the shortest chapter in the Bible?", options: ["Psalm 117", "Psalm 119", "Psalm 23", "Obadiah 1"], correct: 0, slogan: "Small text, big praise.", reference: "Psalm 117" },
      { id: "l6q3", question: "Who is the only Gentile physician traditionally credited with writing two New Testament books?", options: ["Titus", "Luke", "Silas", "Apollos"], correct: 1, slogan: "God writes His story through unexpected people.", reference: "Colossians 4:14" },
      { id: "l6q4", question: "In Revelation 3, which church was rebuked for being 'lukewarm'?", options: ["Sardis", "Philadelphia", "Laodicea", "Pergamum"], correct: 2, slogan: "Lukewarm faith is more dangerous than cold.", reference: "Revelation 3:15-16" },
      { id: "l6q5", question: "Which prophet's book closes the Old Testament?", options: ["Zechariah", "Haggai", "Malachi", "Joel"], correct: 2, slogan: "The Old ends pointing to the coming Messenger.", reference: "Malachi 4:5-6" },
      { id: "l6q6", question: "Who wrote 'For to me, to live is Christ and to die is gain'?", options: ["Peter", "Paul", "John", "James"], correct: 1, slogan: "When Christ is life, death loses leverage.", reference: "Philippians 1:21" },
      { id: "l6q7", question: "In Genesis, who is described as walking with God and was taken so he did not see death?", options: ["Noah", "Enoch", "Methuselah", "Abel"], correct: 1, slogan: "A walk with God outlasts a lifetime.", reference: "Genesis 5:24" },
      { id: "l6q8", question: "Which commandment does Paul call 'the first commandment with a promise'?", options: ["Honour your father and mother", "You shall not covet", "Remember the Sabbath", "You shall not steal"], correct: 0, slogan: "Honour at home carries a promise.", reference: "Ephesians 6:2-3" },
      { id: "l6q9", question: "What did Jesus name as the greatest commandment?", options: ["Love your neighbour as yourself", "Love the Lord your God with all your heart, soul and mind", "Go and make disciples", "Do to others as you would have them do to you"], correct: 1, slogan: "Everything else hangs on love for God.", reference: "Matthew 22:37-38" },
      { id: "l6q10", question: "In 1 Corinthians 13:13, which of faith, hope and love is called the greatest?", options: ["Faith", "Hope", "Love", "They are equal"], correct: 2, slogan: "Love is the mark of a true LightMode champion.", reference: "1 Corinthians 13:13" },
    ],
  },
];

export const TOTAL_LEVELS = QUIZ_LEVELS.length;

export const getLevel = (levelNumber) =>
  QUIZ_LEVELS.find(l => l.level === levelNumber) || QUIZ_LEVELS[0];

export const starsForScore = (score, level) => {
  if (score === level.questions.length) return 3;
  if (score >= level.passScore + 1) return 2;
  if (score >= level.passScore) return 1;
  return 0;
};

export const parseStars = (raw) => {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};