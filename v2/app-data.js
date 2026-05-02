// ── DATA & SHARED COMPONENTS ──
const CHART = {
  name: 'Aleksandar M.', dob: '18 Mar 1985', tob: '16:11 LT',
  pob: 'Zemun Polje, Serbia', lat: "44°51'N", lng: "20°25'E",
  tz: 'UTC+1', ayanamsa: "Lahiri 23°33'14\"",
};
const SIGNS = [
  {id:1,name:'Aries',sa:'Mesha',lord:'Ma',el:'Fire',mod:'Cardinal'},
  {id:2,name:'Taurus',sa:'Vrishabha',lord:'Ve',el:'Earth',mod:'Fixed'},
  {id:3,name:'Gemini',sa:'Mithuna',lord:'Me',el:'Air',mod:'Mutable'},
  {id:4,name:'Cancer',sa:'Karka',lord:'Mo',el:'Water',mod:'Cardinal'},
  {id:5,name:'Leo',sa:'Simha',lord:'Su',el:'Fire',mod:'Fixed'},
  {id:6,name:'Virgo',sa:'Kanya',lord:'Me',el:'Earth',mod:'Mutable'},
  {id:7,name:'Libra',sa:'Tula',lord:'Ve',el:'Air',mod:'Cardinal'},
  {id:8,name:'Scorpio',sa:'Vrischika',lord:'Ma',el:'Water',mod:'Fixed'},
  {id:9,name:'Sagittarius',sa:'Dhanu',lord:'Ju',el:'Fire',mod:'Mutable'},
  {id:10,name:'Capricorn',sa:'Makara',lord:'Sa',el:'Earth',mod:'Cardinal'},
  {id:11,name:'Aquarius',sa:'Kumbha',lord:'Sa',el:'Air',mod:'Fixed'},
  {id:12,name:'Pisces',sa:'Meena',lord:'Ju',el:'Water',mod:'Mutable'},
];
const GRAHAS = [
  {id:'La',name:'Lagna',  sa:'Lagna',  sign:8, deg:"14°20'",nak:'Anuradha',      pada:3,state:'—',            color:'#E8B84B',isLagna:true},
  {id:'Su',name:'Sun',    sa:'Surya',  sign:12,deg:"4°12'", nak:'Uttara Bhadra', pada:1,state:'Friendly',      color:'#F4A924'},
  {id:'Mo',name:'Moon',   sa:'Chandra',sign:5, deg:"21°33'",nak:'Purva Phalguni',pada:4,state:'Friendly',      color:'#C8C0F0'},
  {id:'Ma',name:'Mars',   sa:'Mangala',sign:10,deg:"7°48'", nak:'Uttarashada',   pada:2,state:'Exalted ↑',     color:'#E85050',exalted:true},
  {id:'Me',name:'Mercury',sa:'Budha',  sign:11,deg:"25°14'",nak:'Purva Bhadra',  pada:4,state:'Friendly',      color:'#40C888'},
  {id:'Ju',name:'Jupiter',sa:'Guru',   sign:10,deg:"14°22'",nak:'Shravana',      pada:2,state:'Debilitated ↓', color:'#F0C040',debilitated:true},
  {id:'Ve',name:'Venus',  sa:'Shukra', sign:1, deg:"12°5'", nak:'Ashwini',       pada:3,state:'Neutral',       color:'#F878C0'},
  {id:'Sa',name:'Saturn', sa:'Shani',  sign:8, deg:"24°18'",nak:'Jyeshtha',      pada:2,state:'Friendly',      color:'#7090C8'},
  {id:'Ra',name:'Rahu',   sa:'Rahu',   sign:2, deg:"27°45'",nak:'Mrigashira',    pada:4,state:'Exalted ↑',     color:'#A060E0',exalted:true},
  {id:'Ke',name:'Ketu',   sa:'Ketu',   sign:8, deg:"27°45'",nak:'Jyeshtha',      pada:4,state:'Friendly',      color:'#40C0B0'},
];
const BY_SIGN = {};
GRAHAS.forEach(g => { if(!BY_SIGN[g.sign]) BY_SIGN[g.sign]=[]; BY_SIGN[g.sign].push(g); });

const DASHAS = [
  {graha:'Sa',color:'#7090C8',start:'Oct 1988',end:'Oct 2007',years:19,antars:[
    {g:'Sa',s:'Oct 1988',e:'Jun 1992',pct:20},{g:'Me',s:'Jun 1992',e:'Mar 1995',pct:15},
    {g:'Ke',s:'Mar 1995',e:'Apr 1996',pct:6},{g:'Ve',s:'Apr 1996',e:'Apr 1999',pct:17},
    {g:'Su',s:'Apr 1999',e:'Mar 2000',pct:5},{g:'Mo',s:'Mar 2000',e:'Oct 2001',pct:9},
    {g:'Ma',s:'Oct 2001',e:'Nov 2002',pct:6},{g:'Ra',s:'Nov 2002',e:'Sep 2005',pct:15},
    {g:'Ju',s:'Sep 2005',e:'Oct 2007',pct:11},
  ]},
  {graha:'Me',color:'#40C888',start:'Oct 2007',end:'Oct 2024',years:17,antars:[
    {g:'Me',s:'Oct 2007',e:'Feb 2010',pct:15},{g:'Ke',s:'Feb 2010',e:'Jan 2011',pct:6},
    {g:'Ve',s:'Jan 2011',e:'Nov 2013',pct:17},{g:'Su',s:'Nov 2013',e:'Sep 2014',pct:5},
    {g:'Mo',s:'Sep 2014',e:'Feb 2016',pct:9},{g:'Ma',s:'Feb 2016',e:'Jan 2017',pct:6},
    {g:'Ra',s:'Jan 2017',e:'Jul 2019',pct:15},{g:'Ju',s:'Jul 2019',e:'Jun 2021',pct:11},
    {g:'Sa',s:'Jun 2021',e:'Oct 2024',pct:17},
  ]},
  {graha:'Ke',color:'#40C0B0',start:'Oct 2024',end:'Oct 2031',years:7,current:true,antars:[
    {g:'Ke',s:'Oct 2024',e:'Mar 2025',pct:7,done:true},
    {g:'Ve',s:'Mar 2025',e:'May 2026',pct:14,current:true},
    {g:'Su',s:'May 2026',e:'Oct 2026',pct:7},{g:'Mo',s:'Oct 2026',e:'May 2027',pct:10},
    {g:'Ma',s:'May 2027',e:'Oct 2027',pct:7},{g:'Ra',s:'Oct 2027',e:'Oct 2028',pct:14},
    {g:'Ju',s:'Oct 2028',e:'Jul 2029',pct:12},{g:'Sa',s:'Jul 2029',e:'Aug 2030',pct:14},
    {g:'Me',s:'Aug 2030',e:'Oct 2031',pct:14},
  ]},
  {graha:'Ve',color:'#F878C0',start:'Oct 2031',end:'Oct 2051',years:20},
  {graha:'Su',color:'#F4A924',start:'Oct 2051',end:'Oct 2057',years:6},
];

const YOGAS = [
  {name:'Neecha Bhanga Raja Yoga',quality:'positive',desc:'Jupiter debilitated in Capricorn but Mars (lord of exaltation sign) is itself exalted, cancelling debility and creating powerful Raja Yoga.'},
  {name:'Graha Yuddha (Planetary War)',quality:'attention',desc:'Mars conjunct Jupiter in Capricorn — Mars wins due to lower degree, amplifying material ambition at the cost of wisdom.'},
  {name:'Ketu–Saturn Conjunction',quality:'karmic',desc:'Saturn and Ketu in Scorpio (Lagna) indicates a life of deep transformation, renunciation, and karmic resolution with ancestral patterns.'},
  {name:'Rahu in 7th House (Taurus)',quality:'attention',desc:'Strong desire for partnership with foreign or unconventional relationships. Bhoga (sensory pleasure) intensified by Taurus.'},
];

const CHART_CTX = `JYOTISH BIRTH CHART:
Name: Aleksandar M. | DOB: 18 Mar 1985, 16:11 LT | Zemun Polje, Serbia | Lahiri Ayanamsa
LAGNA: Scorpio (Vrischika) 14°20' — Anuradha Nakshatra Pada 3
Surya: Pisces 4°12' — Uttara Bhadra Pada 1 — Friendly
Chandra: Leo 21°33' — Purva Phalguni Pada 4 — Friendly
Mangala: Capricorn 7°48' — Uttarashada Pada 2 — EXALTED (Atmakaraka)
Budha: Aquarius 25°14' — Purva Bhadra Pada 4 — Friendly
Guru: Capricorn 14°22' — Shravana Pada 2 — DEBILITATED (Neecha Bhanga via exalted Mars)
Shukra: Aries 12°5' — Ashwini Pada 3 — Neutral
Shani: Scorpio 24°18' — Jyeshtha Pada 2 — Friendly (in Lagna)
Rahu: Taurus 27°45' — Mrigashira Pada 4 — Exalted (7th house)
Ketu: Scorpio 27°45' — Jyeshtha Pada 4 — Friendly (in Lagna)
Bhrigu Bindu: Virgo 14°34'
ACTIVE DASHA: Ketu Mahadasha (Oct 2024–Oct 2031) | Antardasha: Venus (Mar 2025–May 2026)
KEY YOGAS: Neecha Bhanga Raja Yoga, Graha Yuddha (Mars-Jupiter), Ketu-Saturn in Lagna`;

const PROMPT_PRESETS = [
  {icon:'♃',label:'Career & Purpose',  q:'Analyze the 10th house, Karma karaka, and current dasha for career and life purpose insights.'},
  {icon:'♀',label:'Relationships',     q:"Examine the 7th house, Venus, and relationship karma. Is marriage indicated soon?"},
  {icon:'☽',label:'Current Period',    q:'Interpret the Ketu–Venus antardasha in detail. What themes will dominate through May 2026?'},
  {icon:'◉',label:'Spiritual Path',    q:"Analyze spiritual indicators: 12th house, Ketu, moksha karaka, and Atmakaraka for this soul's path."},
  {icon:'♄',label:'Saturn–Ketu Lagna', q:'Give a deep reading of the Saturn–Ketu conjunction in Scorpio Lagna. Karmic implications and life themes.'},
  {icon:'✦',label:'Bhrigu Bindu',      q:"Interpret the Bhrigu Bindu at 14°34' Virgo. Destiny themes and upcoming planetary triggers."},
];

// South Indian grid
const SI_GRID = [
  [12,1,2,3],
  [11,null,null,4],
  [10,null,null,5],
  [9,8,7,6],
];

Object.assign(window, { CHART, SIGNS, GRAHAS, BY_SIGN, DASHAS, YOGAS, CHART_CTX, PROMPT_PRESETS, SI_GRID });
