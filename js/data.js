/* ARKAN: game data: party, items, enemies, dungeons, npcs, maps */
// ══════════════════════════════════
// GAME STATE
// ══════════════════════════════════
const G = {
  gold: 200,
  party: [],
  inventory: [
    {id:'potion',qty:3},
    {id:'ether',qty:2},
  ],
  quests: [],
  activeQuests: [],
  dungeon: { floor:1, encounter:0, totalEnc:5, enemies:[] },
  battle: { turn:0, order:[], idx:0, phase:'player', selectedAction:null, targetMode:false },
  unlockedChars: ['ch1','ch2','ch3'],
  world: { unlockedNodes: ['town1','dungeon1'] },
  flags: {},
  materials: {},
  upgradeLevels: {},
};

// ══════════════════════════════════
// ITEMS DB
// ══════════════════════════════════
const ITEMS = {
  potion:   {id:'potion',  name:'HP 포션',   icon:`<img src="assets/sprites/potion.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, type:'potion',    desc:'HP 80 회복', price:50,  effect:{hp:80}},
  ether:    {id:'ether',   name:'MP 에테르',  icon:`<img src="assets/sprites/ether.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, type:'potion',    desc:'MP 40 회복', price:60,  effect:{mp:40}},
  hipotion: {id:'hipotion',name:'하이 포션',  icon:`<img src="assets/sprites/hipotion.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, type:'potion',    desc:'HP 200 회복',price:150, effect:{hp:200}},
  antidote: {id:'antidote',name:'해독제',     icon:`<img src="assets/sprites/antidote.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, type:'potion',    desc:'독·출혈 제거',price:40, effect:{status:'cleanse'}},
  iron_sword:{id:'iron_sword',name:'철제 검', icon:`<img src="assets/sprites/iron_sword.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, type:'weapon',   desc:'ATK +8',     price:200, stat:{atk:8},  slot:'weapon', jobs:['warrior','knight']},
  mage_staff:{id:'mage_staff',name:'마법 지팡이',icon:`<img src="assets/sprites/mage_staff.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`,type:'weapon', desc:'ATK +5, MP +20',price:220,stat:{atk:5,maxMp:20},slot:'weapon',jobs:['mage']},
  leather_armor:{id:'leather_armor',name:'가죽 갑옷',icon:`<img src="assets/sprites/leather_armor.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`,type:'armor',desc:'DEF +6',price:180,stat:{def:6},slot:'armor'},
  iron_shield:{id:'iron_shield',name:'철제 방패',icon:`<img src="assets/sprites/iron_shield.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`,type:'armor',  desc:'DEF +8',     price:250, stat:{def:8},  slot:'shield', jobs:['warrior','knight']},
  silver_ring:{id:'silver_ring',name:'은 반지',icon:`<img src="assets/sprites/silver_ring.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`,type:'accessory',desc:'SPD +3',     price:160, stat:{spd:3},  slot:'accessory'},
  fire_gem:  {id:'fire_gem',name:'화염 보석',  icon:`<img src="assets/sprites/fire_gem.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, type:'accessory',desc:'ATK +5, 화염 속성',price:300,stat:{atk:5},slot:'accessory'},
};

// ══════════════════════════════════
// CHARACTERS DB
// ══════════════════════════════════
const CHARS = {
  ch1:{
    id:'ch1', name:'고른', npc:'고른 (Gorn), 48세', artKey:'gorn',
    role:'대장장이', job:'warrior', icon:'⚒',
    color:'#e08030',
    element:{name:'화염',icon:'🔥',color:'#e09020'},
    keywords:'도전·집념·장인 정신',
    story:'20년 경력의 대장장이. 왕국 최고의 검을 만들겠다는 꿈을 품고 있다.',
    recruit:{cost:0, condition:'처음부터 가능'},
    base:{hp:120,maxHp:120,mp:60,maxMp:60,atk:20,def:12,spd:7,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'강타',    icon:'⚒', type:'물리',desc:'ATK 100%',        mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'방어',    icon:'🛡', type:'방어',desc:'피해 50%↓',       mpCost:0, cd:0,maxCd:0, fn:'defend'},
      {id:'sk1',  name:'분노의 일격',icon:'💥',type:'물리',desc:'ATK 220%, 쿨3',mpCost:20,cd:0,maxCd:3, fn:'powerStrike', special:true},
      {id:'sk2',  name:'철벽',    icon:'🪨', type:'방어',desc:'다음 피해 무효, 쿨4',mpCost:15,cd:0,maxCd:4,fn:'ironwall',special:true},
    ],
    grow:{hp:18,atk:3,def:2,spd:0.5},
  },
  ch2:{
    id:'ch2', name:'엘라', npc:'엘라 (Ella), 23세', artKey:'ella',
    role:'왕궁 시녀', job:'rogue', icon:'🌸',
    color:'#a060e0',
    element:{name:'번개',icon:'⚡',color:'#9040e0'},
    keywords:'음모·충성 vs 양심·궁중 생존',
    story:'왕궁 안팎의 비밀을 누구보다 많이 아는 시녀. 빠른 손과 침착한 판단이 특기.',
    recruit:{cost:0, condition:'처음부터 가능'},
    base:{hp:80,maxHp:80,mp:100,maxMp:100,atk:14,def:7,spd:15,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'급습',    icon:'🗡', type:'물리',desc:'ATK 100%',       mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'회피',    icon:'💨', type:'방어',desc:'다음 공격 무효', mpCost:10,cd:0,maxCd:0, fn:'evasion'},
      {id:'sk1',  name:'독 바늘', icon:'🩸', type:'마법',desc:'3턴 독, 쿨4',   mpCost:25,cd:0,maxCd:4, fn:'poison',special:true},
      {id:'sk2',  name:'현혹',    icon:'✨', type:'보조',desc:'적ATK -50% 2턴, 쿨3',mpCost:20,cd:0,maxCd:3,fn:'weaken',special:true},
    ],
    grow:{hp:10,atk:2,def:1,spd:1},
  },
  ch3:{
    id:'ch3', name:'머독', npc:'머독 (Merdoc), 55세', artKey:'merdoc',
    role:'비밀 장부', job:'rogue', icon:'🍺',
    color:'#c08030',
    element:{name:'대지',icon:'🌿',color:'#6b4a10'},
    keywords:'정보 브로커·30년 중립·비밀 장부',
    story:'왕국 최고의 정보상. 어떤 비밀도 값이 있다고 믿는 노회한 인물.',
    recruit:{cost:300, condition:'골드 300 필요'},
    base:{hp:90,maxHp:90,mp:80,maxMp:80,atk:12,def:8,spd:10,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'병 공격', icon:'🍾', type:'물리',desc:'ATK 100%',       mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'술기운',  icon:'🫗', type:'방어',desc:'피해 40%↓',      mpCost:8, cd:0,maxCd:0, fn:'drunkDefend'},
      {id:'sk1',  name:'정보 거래',icon:'📜',type:'보조',desc:'다음 공격 1.5배, 쿨3',mpCost:18,cd:0,maxCd:3,fn:'analyze',special:true},
      {id:'sk2',  name:'뒤통수',  icon:'🎯', type:'물리',desc:'ATK 180%+기절, 쿨4',mpCost:22,cd:0,maxCd:4,fn:'backstab',special:true},
    ],
    grow:{hp:12,atk:2,def:1,spd:0.8},
  },
  ch4:{
    id:'ch4', name:'세라', npc:'세라 (Sera), 31세', artKey:'sera',
    role:'전직 기사·용병', job:'knight', icon:'⚔',
    color:'#a0b0c0',
    element:{name:'강철',icon:'🗡',color:'#8b2222'},
    keywords:'정체성 위기·배신과 용서·전투 중심',
    story:'왕국 기사단에서 추방된 전직 기사. 명예를 되찾기 위해 싸운다.',
    recruit:{cost:500, condition:'던전 2층 클리어'},
    base:{hp:140,maxHp:140,mp:60,maxMp:60,atk:24,def:16,spd:10,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'검격',     icon:'⚔', type:'물리',desc:'ATK 100%',       mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'기사 방패',icon:'🛡', type:'방어',desc:'피해 60%↓',      mpCost:0, cd:0,maxCd:0, fn:'knightDef'},
      {id:'sk1',  name:'회전 베기',icon:'🌀', type:'물리',desc:'전체 ATK 180%+출혈, 쿨3',mpCost:18,cd:0,maxCd:3,fn:'spinSlash',special:true},
      {id:'sk2',  name:'돌격',     icon:'💨', type:'물리',desc:'2연속 ATK 120%, 쿨4',mpCost:22,cd:0,maxCd:4,fn:'charge',special:true},
    ],
    grow:{hp:22,atk:4,def:3,spd:0.5},
  },
  ch5:{
    id:'ch5', name:'피우', npc:'피우 (Piu), 19세', artKey:'piu',
    role:'마법사 조수', job:'mage', icon:'🔮',
    color:'#6080e0',
    element:{name:'마법',icon:'✨',color:'#3070e0'},
    keywords:'내부고발·성장·흑막의 끝',
    story:'왕국 수석 마법사의 조수. 스승의 비밀을 알게 된 후 홀로 진실을 쫓는다.',
    recruit:{cost:400, condition:'마을 장로 퀘스트 완료'},
    base:{hp:65,maxHp:65,mp:140,maxMp:140,atk:16,def:5,spd:14,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'마법 화살',icon:'✦', type:'마법',desc:'ATK 100%',       mpCost:5, cd:0,maxCd:0, fn:'magicAtk'},
      {id:'def',  name:'마법 막',  icon:'🔮', type:'방어',desc:'피해 75%↓',     mpCost:15,cd:0,maxCd:0, fn:'magicShield'},
      {id:'sk1',  name:'화염구',   icon:'🔥', type:'마법',desc:'전체 ATK 250%, 쿨3',mpCost:30,cd:0,maxCd:3,fn:'fireball',special:true},
      {id:'sk2',  name:'시간 지연',icon:'⏳', type:'보조',desc:'적 1턴 스킵, 쿨5',mpCost:35,cd:0,maxCd:5,fn:'timestop',special:true},
    ],
    grow:{hp:8,atk:3,def:0.5,spd:0.5},
  },
  ch6:{
    id:'ch6', name:'카그', npc:'카그 (Kag), 나이 불명 · 오크', artKey:'kag',
    role:'족장 경호원', job:'warrior', icon:'👹',
    color:'#40c080',
    element:{name:'자연',icon:'🌿',color:'#20a090'},
    keywords:'시험 반격·블랙 코미디·감동',
    story:'오크 족장의 경호원. 말이 없지만 의리 하나는 왕국 최고다.',
    recruit:{cost:0, condition:'숨겨진 던전 발견'},
    base:{hp:180,maxHp:180,mp:40,maxMp:40,atk:28,def:18,spd:5,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'박살',     icon:'💢', type:'물리',desc:'ATK 120%',       mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'야성의 직감',icon:'🐾',type:'방어',desc:'피해 30%↓+반격',mpCost:0, cd:0,maxCd:0, fn:'wildDefend'},
      {id:'sk1',  name:'대지 강타',icon:'🌋', type:'물리',desc:'단일 ATK 300%, 쿨4',mpCost:20,cd:0,maxCd:4,fn:'earthSmash',special:true},
      {id:'sk2',  name:'오크의 포효',icon:'📢',type:'보조',desc:'파티 ATK +30% 2턴, 쿨4',mpCost:15,cd:0,maxCd:4,fn:'warCry',special:true},
    ],
    grow:{hp:28,atk:5,def:3,spd:0.2},
  },
  ch7:{
    id:'ch7', name:'리라', npc:'리라 (Lyra), 27세 · 엘프', artKey:'lyra',
    role:'엘프 레인저', job:'rogue', icon:'🏹',
    color:'#40c060',
    element:{name:'바람',icon:'🌬',color:'#20b060'},
    keywords:'고향 상실·자연의 수호·빠른 발',
    story:'숲을 잃은 엘프 레인저. 아르칸 왕국의 자연을 지키기 위해 홀로 싸운다. 백발의 은발에 날카로운 녹색 눈동자.',
    recruit:{cost:600, condition:'왕성 지하 클리어'},
    base:{hp:85,maxHp:85,mp:90,maxMp:90,atk:22,def:8,spd:18,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'정밀 사격',icon:'🏹', type:'물리',desc:'ATK 110%',          mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'숲의 발걸음',icon:'🌿',type:'방어',desc:'회피+다음 ATK 1.5배',mpCost:12,cd:0,maxCd:0, fn:'evasion'},
      {id:'sk1',  name:'폭풍 화살',icon:'💨', type:'물리',desc:'전체 ATK 160%+출혈, 쿨3',mpCost:22,cd:0,maxCd:3,fn:'stormArrow',special:true},
      {id:'sk2',  name:'마비 화살',icon:'⚡', type:'보조',desc:'적 1체 2턴 행동불능, 쿨4',mpCost:28,cd:0,maxCd:4,fn:'paraArrow',special:true},
    ],
    grow:{hp:10,atk:3,def:0.5,spd:1.2},
  },
  ch8:{
    id:'ch8', name:'자인', npc:'자인 (Zain), 34세', artKey:'zain',
    role:'다크 나이트', job:'knight', icon:'⚔',
    color:'#c03040',
    element:{name:'어둠',icon:'🌑',color:'#800020'},
    keywords:'속죄·어둠의 힘·동료 보호',
    story:'왕국을 배신한 기사단의 생존자. 어둠의 힘을 빌려 속죄하기 위해 싸운다. 검은 갑옷과 붉은 망토.',
    recruit:{cost:0, condition:'마왕의 성 진입'},
    base:{hp:160,maxHp:160,mp:70,maxMp:70,atk:32,def:20,spd:9,level:1,xp:0,xpNext:100},
    equip:{weapon:null,armor:null,shield:null,accessory:null},
    skills:[
      {id:'atk',  name:'대검 베기',icon:'⚔', type:'물리',desc:'ATK 115%',            mpCost:0, cd:0,maxCd:0, fn:'basicAtk'},
      {id:'def',  name:'암흑 방패',icon:'🌑', type:'방어',desc:'피해 65%↓+적에 반사10',mpCost:10,cd:0,maxCd:0, fn:'darkShield'},
      {id:'sk1',  name:'어둠의 참격',icon:'💀',type:'물리',desc:'ATK 260%+출혈3턴, 쿨3',mpCost:25,cd:0,maxCd:3,fn:'darkSlash',special:true},
      {id:'sk2',  name:'죽음의 선고',icon:'☠', type:'마법',desc:'적 1체 최대HP 20% 고정데미지, 쿨5',mpCost:35,cd:0,maxCd:5,fn:'deathMark',special:true},
    ],
    grow:{hp:20,atk:4,def:2.5,spd:0.4},
  },
};

// ══════════════════════════════════
// ENEMY DB
// ══════════════════════════════════
const ENEMIES = {
  goblin:  {id:'goblin', name:'고블린',    emoji:'👺', hp:60, atk:12,def:4, spd:12,xp:30, gold:15,elementName:'대지',
    skills:['basicAtk','basicAtk','basicAtk','rush']},
  wolf:    {id:'wolf',   name:'늑대',      emoji:'🐺', hp:70, atk:15,def:5, spd:14,xp:35, gold:20,elementName:'자연',
    skills:['basicAtk','bite','basicAtk','bite']},
  skeleton:{id:'skeleton',name:'해골 병사',emoji:'💀', hp:80, atk:14,def:8, spd:8, xp:40, gold:25,elementName:'어둠',
    skills:['basicAtk','basicAtk','boneThrow','basicAtk']},
  orc:     {id:'orc',    name:'오크 전사', emoji:'👹', hp:130,atk:20,def:10,spd:7, xp:70, gold:40,elementName:'대지',
    skills:['basicAtk','powerAtk','basicAtk','roar']},
  spider:  {id:'spider', name:'독거미',    emoji:'🕷', hp:55, atk:10,def:3, spd:16,xp:28, gold:12,elementName:'자연',
    skills:['basicAtk','poison','basicAtk','webShot']},
  golem:   {id:'golem',  name:'석상 골렘', emoji:'🗿', hp:200,atk:22,def:20,spd:4, xp:120,gold:80,elementName:'강철',
    skills:['slam','slam','stomp','ironSkin']},
  dragon:  {id:'dragon', name:'어둠 드래곤',emoji:'🐉', hp:350,atk:35,def:15,spd:10,xp:300,gold:200,elementName:'어둠',
    skills:['bite','breathe','tailSwipe','roar']},
  bandit:  {id:'bandit', name:'산적',      emoji:'🗡', hp:95, atk:18,def:8, spd:13,xp:55, gold:35,elementName:'강철',
    skills:['basicAtk','rush','basicAtk','backstabEnemy']},
  vampire: {id:'vampire',name:'흡혈귀',    emoji:'🧛', hp:110,atk:22,def:10,spd:12,xp:90, gold:60,elementName:'어둠',
    skills:['basicAtk','drainLife','basicAtk','hypnosis']},
  lich:    {id:'lich',   name:'리치',      emoji:'💀', hp:160,atk:28,def:12,spd:9, xp:140,gold:100,elementName:'어둠',
    skills:['darkMagic','basicAtk','darkMagic','curseAll']},
  guardian:{id:'guardian',name:'성기사 수호자',emoji:'⚔',hp:240,atk:26,def:24,spd:6,xp:180,gold:130,elementName:'마법',
    skills:['slam','holySmite','ironSkin','holySmite']},
  demon_lord:{id:'demon_lord',name:'마왕',emoji:'👿',hp:500,atk:45,def:20,spd:11,xp:600,gold:500,elementName:'어둠',
    skills:['darkMagic','breathe','slam','curseAll']},
};

// 던전 구성표
const DUNGEONS = {
  dungeon1:{
    name:'폐허 던전', floors:3,
    encounters:[['goblin','wolf'],['skeleton','goblin'],['orc'],['spider','spider','wolf']],
    boss:'golem',
    bossIntro:{emoji:'🗿',title:'던전 보스 등장!',name:'석상 골렘 (Stone Golem)',desc:'고대 마법으로 만들어진 수호자.\n가슴의 룬 문자가 동력원이다.\n마법 공격이 핵심!'},
    bossPhase2Hp:0.5, bossPhase2Skills:['stomp','stomp','slam','stomp','ironSkin','stomp'],
    bossPhase2Msg:'💢 골렘이 격분한다! 룬 문자가 붉게 타오르며 짓밟기를 반복한다!',
  },
  dungeon2:{
    name:'어둠의 탑', floors:5,
    encounters:[['orc','skeleton'],['spider','orc'],['golem'],['orc','orc','wolf']],
    boss:'dragon',
    bossIntro:{emoji:'🐉',title:'최종 보스 등장!!!',name:'어둠 드래곤 (Shadow Dragon)',desc:'어둠의 탑에 봉인된 고대 드래곤.\n브레스로 파티 전체를 쓸어버린다.\n피우의 시간 지연이 핵심!'},
    bossPhase2Hp:0.4, bossPhase2Skills:['breathe','tailSwipe','breathe','roar','breathe','tailSwipe'],
    bossPhase2Msg:'🔥 드래곤이 광란한다! 연속 브레스가 파티를 덮친다!',
  },
  dungeon3:{
    name:'왕성 지하', floors:4,
    encounters:[['bandit','skeleton'],['bandit','bandit'],['vampire','spider'],['bandit','vampire','skeleton']],
    boss:'vampire',
    bossIntro:{emoji:'🧛',title:'보스 등장!',name:'흡혈귀 로드 (Vampire Lord)',desc:'왕성 지하에 봉인된 흡혈귀의 왕.\n흡혈로 HP를 회복하며 현혹으로 파티를 무력화.\n빠른 처치가 핵심!'},
    bossPhase2Hp:0.45, bossPhase2Skills:['drainLife','drainLife','hypnosis','drainLife','basicAtk','drainLife'],
    bossPhase2Msg:'🩸 흡혈귀 로드 격분! 흡혈 집중 패턴으로 전환한다!',
  },
  dungeon4:{
    name:'고대 유적', floors:5,
    encounters:[['golem','skeleton'],['lich'],['guardian','orc'],['lich','vampire'],['guardian','guardian']],
    boss:'lich',
    bossIntro:{emoji:'💀',title:'⚠ 보스 등장 ⚠',name:'대리치 네크로스 (Archlich Necros)',desc:'고대 유적을 지배하는 리치 마법사.\n어둠 마법과 전체 저주로 파티를 침식한다.\n마법 저항 필수!'},
    bossPhase2Hp:0.4, bossPhase2Skills:['curseAll','darkMagic','curseAll','darkMagic','darkMagic','curseAll'],
    bossPhase2Msg:'☠ 네크로스 격분! 연속 저주로 파티 전체를 침식한다!',
  },
  dungeon5:{
    name:'마왕의 성', floors:6,
    encounters:[['guardian','lich'],['vampire','bandit','bandit'],['guardian','dragon'],['lich','vampire','guardian']],
    boss:'demon_lord',
    bossIntro:{emoji:'👿',title:'⚠⚠ 최종 보스 ⚠⚠',name:'마왕 마라키스 (Demon Lord Marakis)',desc:'아르칸 왕국을 지배하려는 마왕.\n브레스·어둠 마법·전체 저주를 구사한다.\n파티 최강 조합이 필요하다!'},
    bossPhase2Hp:0.35, bossPhase2Skills:['breathe','curseAll','breathe','darkMagic','breathe','curseAll'],
    bossPhase2Msg:'💥 마왕 마라키스 격노! 어둠의 브레스가 왕국 전체를 뒤덮는다!!!',
  },
};

// NPC 데이터 — 전면 보강
const NPCS = {
  elder:{
    name:'카덴 장로', role:'아르칸 왕국 제3지구 장로',
    artKey:'merdoc',
    dialog:[{
      text:'어서 오게, 모험가여. 나는 카덴이라 하지. 아르칸 왕국을 지키는 이 지구의 장로네. 요즘 서쪽 폐허에서 이상한 기운이 올라오고 있어... 단순한 마물 출몰이 아닌 것 같아.',
      choices:[
        {text:'퀘스트를 받겠습니다.', action:'quest_offer'},
        {text:'아르칸 왕국의 역사를 알려주세요.', action:'lore_history'},
        {text:'마왕에 대해 알려주세요.', action:'lore_demon'},
        {text:'파티 동료들 이야기를 들려주세요.', action:'lore_party'},
        {text:'대화 종료', action:'leave'},
      ]
    }],
    extraDialogs:{
      lore_history:{
        text:'아르칸 왕국은 500년 전, 초대 국왕 아르칸 1세가 이 땅을 개척하면서 시작됐지. 동쪽 산맥의 광물이 왕국을 번성하게 했어. 하지만 300년 전 왕성 지하에서 봉인이 풀리면서부터... 왕국은 서서히 무너지기 시작했네. 역대 국왕들은 그 사실을 숨겨왔지만, 이제는 더 이상 감출 수 없어.',
        choices:[{text:'봉인이란 무엇입니까?', action:'lore_seal'},{text:'돌아가기', action:'back'}]
      },
      lore_seal:{
        text:'아르칸 왕국이 건국되기 훨씬 전, 마왕 마라키스가 이 땅을 지배했었지. 초대 국왕이 12명의 영웅과 함께 마왕을 봉인했고, 그 봉인석이 왕성 지하에 잠들어 있었네. 300년 전 봉인이 약해지면서 마물들이 쏟아져 나오기 시작했고... 지금은 거의 완전히 풀려가고 있어.',
        choices:[{text:'자세히 알겠습니다.', action:'back'}]
      },
      lore_demon:{
        text:'마왕 마라키스... 수천 년을 살아온 존재라고 전해지지. 왕성 지하, 고대 유적, 어둠의 탑... 이 모든 곳이 마왕의 힘이 닿은 곳일세. 그를 막으려면 다섯 개의 봉인 던전을 모두 정화해야 해. 자네라면 할 수 있을 거야.',
        choices:[{text:'반드시 해내겠습니다.', action:'back'}]
      },
      lore_party:{
        text:'고른은 젊었을 때 내 대장간에서 일을 배웠지. 고집불통이지만 의리만큼은 왕국 최고야. 엘라는 왕궁에서 무슨 비밀을 알게 됐는지 입을 꾹 다물고 있어. 머독은 믿기 어려운 인물이지만 위기의 순간에 항상 옳은 선택을 하더군.',
        choices:[{text:'감사합니다.', action:'back'}]
      },
    },
    quests:[
      {id:'q1',title:'폐허의 고블린 처치',desc:'서쪽 폐허에 출몰하는 고블린들을 처치해 주게. 마을 농부들이 겁에 질려 있네.',reward:{gold:200,xp:80},condition:'dungeon1_clear'},
      {id:'q2',title:'흡혈귀의 소굴',desc:'왕성 지하에서 흡혈귀가 출몰한다는 신고가 들어왔어. 경계가 필요하네.',reward:{gold:500,xp:200},condition:'dungeon3_clear'},
      {id:'q3',title:'마왕을 막아라',desc:'마왕 마라키스의 부활이 임박했네. 마왕의 성으로 나아가 이 왕국을 구해주게!',reward:{gold:2000,xp:1000},condition:'dungeon5_clear'},
    ]
  },
};

// ── 속성 상성 시스템 ──
const ELEMENT_CHART = {
  '화염': {'대지':1.5, '자연':1.5, '강철':1.3, '어둠':1.2, '번개':0.8},
  '번개': {'바람':1.5, '강철':1.5, '화염':1.3, '마법':0.8},
  '대지': {'번개':1.5, '강철':1.5, '화염':0.8},
  '강철': {'자연':1.5, '바람':1.5, '대지':0.8, '번개':0.8},
  '마법':  {'어둠':1.5, '강철':1.3, '번개':1.2, '자연':0.9},
  '자연': {'대지':1.5, '마법':1.3, '화염':0.8, '강철':0.7},
  '바람': {'자연':1.5, '마법':1.3, '강철':0.8},
  '어둠': {'마법':1.5, '바람':1.5, '화염':0.8, '자연':0.7},
};

function getElementMultiplier(attackerElement, defenderElem){
  if(!attackerElement||!defenderElem)return 1.0;
  const att=attackerElement.name||attackerElement;
  const def=typeof defenderElem==='string'?defenderElem:(defenderElem.name||defenderElem);
  return (ELEMENT_CHART[att]&&ELEMENT_CHART[att][def])||1.0;
}

const ELEMENT_WEAKNESS = {
  goblin:'대지', wolf:'화염', skeleton:'마법', orc:'번개',
  spider:'바람', golem:'마법', dragon:'번개',
  bandit:'마법', vampire:'자연', lich:'화염', guardian:'어둠', demon_lord:'자연',
};

// 월드맵 노드
const MAP_NODES = [
  {id:'town1',   name:'아르칸 마을', icon:'🏘', x:28, y:55, action:'town',   unlocked:true},
  {id:'dungeon1',name:'폐허 던전',   icon:'⚔',  x:52, y:34, action:'dungeon',unlocked:true,  dungeonId:'dungeon1'},
  {id:'dungeon2',name:'어둠의 탑',   icon:'🗼', x:72, y:58, action:'dungeon',unlocked:false, dungeonId:'dungeon2'},
  {id:'dungeon3',name:'왕성 지하',   icon:'🏰', x:40, y:72, action:'dungeon',unlocked:false, dungeonId:'dungeon3'},
  {id:'dungeon4',name:'고대 유적',   icon:'🏛', x:18, y:36, action:'dungeon',unlocked:false, dungeonId:'dungeon4'},
  {id:'dungeon5',name:'마왕의 성',   icon:'💀', x:80, y:22, action:'dungeon',unlocked:false, dungeonId:'dungeon5'},
  {id:'secret1', name:'???',         icon:'❓',  x:50, y:88, action:'locked', unlocked:false},
];
const MAP_EDGES = [
  ['town1','dungeon1'],['dungeon1','dungeon2'],
  ['dungeon1','dungeon3'],['dungeon3','dungeon4'],
  ['dungeon2','dungeon5'],['dungeon4','dungeon5'],
];

// ══════════════════════════════════
// SCREEN ROUTER
// ══════════════════════════════════
