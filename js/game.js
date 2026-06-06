/* ARKAN: game logic: screens, guild, shop, party, battle, save, codex */
function gotoScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);
  if(el){el.classList.add('active');el.classList.add('fade-in');
    setTimeout(()=>el.classList.remove('fade-in'),400);}
  // 배경 캔버스 재렌더링
  setTimeout(()=>{
    const cv=document.getElementById('px-'+id);
    if(cv && typeof window._drawBg==='function') window._drawBg(cv,'px-'+id);
  },0);
  // 디버그: 어떤 화면이 active인지 표시
  const dbg=document.getElementById('_dbg');
  if(dbg){
    const actives=[...document.querySelectorAll('.screen.active')].map(s=>s.id).join(', ');
    const sw=document.getElementById('s-world');
    dbg.textContent='goto:'+id+' | active:'+actives+' | s-world display:'+(sw?getComputedStyle(sw).display:'null');
  }
  if(id==='s-world'){
    const tryBuild=()=>{
      const map=document.getElementById('world-map');
      const sw=document.getElementById('s-world');
      if(dbg) dbg.textContent+=' | map.w='+( map?map.offsetWidth:0)+' sw.display='+(sw?getComputedStyle(sw).display:'?');
      buildWorldMap();
    };
    setTimeout(tryBuild, 100);
  }
  if(id==='s-guild') buildGuild();
  if(id==='s-shop')  buildShop();
  if(id==='s-codex') buildCodex();
  updateGoldDisplay();
}

function startNewGame(){
  G.party=['ch1','ch2'];
  G.gold=200;
  G.inventory=[{id:'potion',qty:3},{id:'ether',qty:2}];
  // 캐릭터 스탯 초기화
  Object.values(CHARS).forEach(c=>{
    c.base.hp=c.base.maxHp; c.base.mp=c.base.maxMp;
    c.base.level=1; c.base.xp=0; c.base.xpNext=100;
    c.skills.forEach(sk=>sk.cd=0);
    c.equip={weapon:null,armor:null,shield:null,accessory:null};
  });
  gotoScreen('s-world');
}

function updateGoldDisplay(){
  document.querySelectorAll('#gold-display,#town-gold,#shop-gold,#guild-gold')
    .forEach(el=>{if(el)el.textContent=G.gold;});
}

// ══════════════════════════════════
// WORLD MAP
// ══════════════════════════════════
function buildWorldMap(){
  const map=document.getElementById('world-map');
  map.querySelectorAll('.map-node,.map-deco').forEach(n=>n.remove());
  const svg=document.getElementById('map-paths');
  svg.innerHTML='';

  const W=map.offsetWidth||360, H=map.offsetHeight||480;

  // ── 픽셀 아트 지형 캔버스 렌더링
  const tc=document.getElementById('map-terrain-canvas');
  tc.width=W; tc.height=H;
  tc.style.cssText='position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;';
  const cx=tc.getContext('2d');
  cx.imageSmoothingEnabled=false;

  const T=6; // 지형 타일 크기 (6px)
  const cols=Math.ceil(W/T), rows=Math.ceil(H/T);

  // 지형 팔레트
  const TERRAIN={
    deep:  ['#0d0824','#0f0a2c','#0b0820','#110a28'],
    sea:   ['#0a1440','#0c1850','#0e1a58','#0a1238'],
    coast: ['#1a1850','#201c60','#181648'],
    plains:['#1a2808','#1e2e08','#222e0a','#1c2c06'],
    forest:['#0c2010','#0e2814','#0a1c0c','#102412'],
    mtn:   ['#2a1e30','#32243a','#241830','#302040'],
    peak:  ['#3a2048','#442858','#382048'],
    road:  ['#3a2808','#2e2006','#342606'],
    ruins: ['#2a1c10','#322010','#281808'],
  };

  function ri(a,b){return Math.floor(a+Math.random()*(b-a));}
  function noise(x,y,s=1){
    const n=((x*374761393+y*668265263+s*1234567)|0);
    return(((n^(n>>13))*1274126177)>>>0)/4294967295;
  }

  // 지형 높이맵 생성 (심플 노이즈)
  const hmap=[];
  for(let r=0;r<rows;r++){
    hmap[r]=[];
    for(let c=0;c<cols;c++){
      // 여러 주파수 합산
      const n1=noise(c*0.08,r*0.08,1);
      const n2=noise(c*0.15,r*0.15,2)*0.5;
      const n3=noise(c*0.3,r*0.3,3)*0.25;
      // 가장자리 어둡게 (비녜트)
      const ex=Math.abs(c/cols-0.5)*2, ey=Math.abs(r/rows-0.5)*2;
      const edge=Math.max(ex,ey);
      hmap[r][c]=Math.max(0,Math.min(1,(n1+n2+n3)-edge*0.3));
    }
  }

  // 지형 타일 그리기
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const h=hmap[r][c];
      const bx=c*T, by=r*T;
      let palette, alpha=1;

      if(h<0.2)       palette=TERRAIN.deep;
      else if(h<0.32) palette=TERRAIN.sea;
      else if(h<0.4)  palette=TERRAIN.coast;
      else if(h<0.58) palette=TERRAIN.plains;
      else if(h<0.72) palette=TERRAIN.forest;
      else if(h<0.84) palette=TERRAIN.mtn;
      else            palette=TERRAIN.peak;

      const col=palette[ri(0,palette.length)];
      const vari=(noise(c,r,7)-0.5)*30;
      const [rv,gv,bv]=hexRgbMap(col);
      cx.fillStyle=`rgb(${cl(rv+vari)},${cl(gv+vari)},${cl(bv+vari)})`;
      cx.fillRect(bx,by,T,T);

      // 픽셀 아트 입체감
      cx.fillStyle='rgba(255,255,255,0.05)';
      cx.fillRect(bx,by,T,1);
      cx.fillStyle='rgba(0,0,0,0.2)';
      cx.fillRect(bx,by+T-1,T,1);
    }
  }

  // 강줄기 (픽셀)
  {
    let ry=Math.floor(rows*0.88);
    for(let s=0;s<rows*0.55;s++){
      const rx=Math.floor(cols*(0.42+Math.sin(s*0.2)*0.06));
      for(let w=-1;w<=1;w++){
        if(rx+w>=0&&rx+w<cols){
          cx.fillStyle=s<5?'rgba(20,40,120,0.7)':'rgba(15,30,100,0.6)';
          cx.fillRect((rx+w)*T,ry*T,T,T);
        }
      }
      ry--;
    }
  }

  // 비녜트 (가장자리 안개)
  const vg=cx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(4,2,20,0.65)');
  cx.fillStyle=vg; cx.fillRect(0,0,W,H);

  // 양피지 질감 오버레이
  for(let i=0;i<1200;i++){
    const px=ri(0,W), py=ri(0,H);
    cx.fillStyle=`rgba(255,200,100,${Math.random()*0.03})`;
    cx.fillRect(px,py,1,1);
  }

  function hexRgbMap(h){
    h=h.replace('#','');
    return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  function cl(v){return Math.max(0,Math.min(255,Math.round(v)));}

  // ── SVG 경로선 — 고품질
  svg.setAttribute('style','position:absolute;inset:0;width:100%;height:100%;pointer-events:none;');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);

  // defs (필터)
  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  const glow=document.createElementNS('http://www.w3.org/2000/svg','filter');
  glow.setAttribute('id','pathGlow');
  const fe=document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
  fe.setAttribute('stdDeviation','2');fe.setAttribute('result','blur');
  const feComposite=document.createElementNS('http://www.w3.org/2000/svg','feComposite');
  feComposite.setAttribute('in','SourceGraphic');feComposite.setAttribute('in2','blur');
  feComposite.setAttribute('operator','over');
  glow.appendChild(fe);glow.appendChild(feComposite);defs.appendChild(glow);
  svg.appendChild(defs);

  MAP_EDGES.forEach(([a,b])=>{
    const na=MAP_NODES.find(n=>n.id===a), nb=MAP_NODES.find(n=>n.id===b);
    if(!na||!nb)return;
    const x1=na.x/100*W, y1=na.y/100*H, x2=nb.x/100*W, y2=nb.y/100*H;
    const bothUnlocked=na.unlocked&&nb.unlocked;

    // 그림자
    const sh=document.createElementNS('http://www.w3.org/2000/svg','line');
    sh.setAttribute('x1',x1+3);sh.setAttribute('y1',y1+3);
    sh.setAttribute('x2',x2+3);sh.setAttribute('y2',y2+3);
    sh.setAttribute('stroke','rgba(0,0,0,0.5)');sh.setAttribute('stroke-width','6');
    sh.setAttribute('stroke-linecap','round');
    svg.appendChild(sh);

    // 하단 베이스 (두꺼운 어두운 선)
    const base=document.createElementNS('http://www.w3.org/2000/svg','line');
    base.setAttribute('x1',x1);base.setAttribute('y1',y1);
    base.setAttribute('x2',x2);base.setAttribute('y2',y2);
    base.setAttribute('stroke',bothUnlocked?'rgba(120,80,20,0.6)':'rgba(60,40,10,0.4)');
    base.setAttribute('stroke-width','6');base.setAttribute('stroke-linecap','round');
    svg.appendChild(base);

    // 중간 골드 선
    const mid=document.createElementNS('http://www.w3.org/2000/svg','line');
    mid.setAttribute('x1',x1);mid.setAttribute('y1',y1);
    mid.setAttribute('x2',x2);mid.setAttribute('y2',y2);
    mid.setAttribute('stroke',bothUnlocked?'rgba(200,150,30,0.7)':'rgba(80,60,20,0.3)');
    mid.setAttribute('stroke-width','3');mid.setAttribute('stroke-linecap','round');
    svg.appendChild(mid);

    // 점선 오버레이 (이동 파티클 느낌)
    if(bothUnlocked){
      const dot=document.createElementNS('http://www.w3.org/2000/svg','line');
      dot.setAttribute('x1',x1);dot.setAttribute('y1',y1);
      dot.setAttribute('x2',x2);dot.setAttribute('y2',y2);
      dot.setAttribute('stroke','rgba(255,220,80,0.55)');
      dot.setAttribute('stroke-width','1.5');
      dot.setAttribute('stroke-dasharray','6,8');
      dot.setAttribute('stroke-linecap','round');
      const anim=document.createElementNS('http://www.w3.org/2000/svg','animate');
      anim.setAttribute('attributeName','stroke-dashoffset');
      anim.setAttribute('from','0');anim.setAttribute('to','-28');
      anim.setAttribute('dur','1.2s');anim.setAttribute('repeatCount','indefinite');
      dot.appendChild(anim);
      svg.appendChild(dot);
    }
  });

  // ── 노드 렌더링 — 커스텀 픽셀 아트 아이콘
  const NODE_DESIGNS={
    town1:    {svg:drawNodeTown,   label:'마을',   color:'#ffd700', cls:'map-node-town'},
    dungeon1: {svg:drawNodeRuins,  label:'던전 1', color:'#ff6040', cls:'map-node-dungeon'},
    dungeon2: {svg:drawNodeTower,  label:'던전 2', color:'#c060ff', cls:'map-node-dungeon'},
    dungeon3: {svg:drawNodeCastle, label:'던전 3', color:'#ff8040', cls:'map-node-dungeon'},
    dungeon4: {svg:drawNodeRelic,  label:'던전 4', color:'#40d0c0', cls:'map-node-dungeon'},
    dungeon5: {svg:drawNodeDemon,  label:'던전 5', color:'#ff2040', cls:'map-node-dungeon'},
    secret1:  {svg:drawNodeSecret, label:'?',      color:'#806090', cls:'map-node-locked-type'},
  };

  MAP_NODES.forEach(node=>{
    const design=NODE_DESIGNS[node.id]||{svg:drawNodeDefault,label:'',color:'#888',cls:''};
    const div=document.createElement('div');
    div.className=`map-node ${node.unlocked?'':' locked'} ${design.cls}`;
    div.style.cssText=`left:${node.x}%;top:${node.y}%;position:absolute;`;

    // 커스텀 SVG 아이콘 (56×56px 픽셀 아트)
    const iconSvg=design.svg(node.unlocked, design.color);
    const clearanceLabel=node.unlocked
      ? `<div class="map-node-name">${node.name}</div>`
      : `<div class="map-node-name" style="color:var(--text3);">🔒 ${node.name}</div>`;

    div.innerHTML=`
      <div class="map-node-frame">${iconSvg}</div>
      ${clearanceLabel}`;

    if(node.unlocked) div.onclick=()=>handleMapNode(node);
    map.appendChild(div);
  });

  // 방위 나침반 (픽셀 아트)
  const compass=document.createElement('div');
  compass.className='map-deco';
  compass.style.cssText='position:absolute;bottom:16px;right:18px;pointer-events:none;z-index:5;';
  compass.innerHTML=`<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="0" y="0" width="44" height="44" fill="rgba(4,2,16,0.8)"/>
    <rect x="1" y="1" width="42" height="42" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="1"/>
    <!-- 나침반 원 -->
    <rect x="10" y="4" width="4" height="4" fill="rgba(255,215,0,0.8)"/>
    <rect x="18" y="4" width="8" height="2" fill="rgba(255,215,0,0.5)"/>
    <rect x="30" y="10" width="4" height="4" fill="rgba(255,215,0,0.8)"/>
    <rect x="4" y="10" width="4" height="4" fill="rgba(255,215,0,0.8)"/>
    <!-- N -->
    <rect x="19" y="6" width="2" height="6" fill="#ff4040"/>
    <rect x="23" y="6" width="2" height="6" fill="#ff4040"/>
    <rect x="21" y="8" width="2" height="2" fill="#ff4040"/>
    <!-- 십자 -->
    <rect x="21" y="12" width="2" height="20" fill="rgba(255,215,0,0.6)"/>
    <rect x="12" y="21" width="20" height="2" fill="rgba(255,215,0,0.6)"/>
    <!-- 중심 -->
    <rect x="20" y="20" width="4" height="4" fill="#ffd700"/>
    <rect x="21" y="21" width="2" height="2" fill="#fff8c0"/>
    <!-- S -->
    <rect x="19" y="32" width="6" height="2" fill="rgba(200,180,100,0.7)"/>
    <rect x="19" y="34" width="3" height="2" fill="rgba(200,180,100,0.7)"/>
    <rect x="19" y="36" width="6" height="2" fill="rgba(200,180,100,0.7)"/>
    <rect x="22" y="36" width="3" height="2" fill="rgba(200,180,100,0.7)"/>
    <rect x="19" y="38" width="6" height="2" fill="rgba(200,180,100,0.7)"/>
  </svg>`;
  map.appendChild(compass);

  // 파티바
  buildPartyBarWorld();
}

// ── 노드 픽셀 아트 SVG 함수들 ──
function _nodeBase(unlocked, color, innerContent){
  const oc=unlocked?color:'#444';
  const shadow=unlocked?`rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.3)`:'rgba(0,0,0,0.2)';
  return `<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- 외곽 그림자 -->
  <rect x="4" y="4" width="68" height="68" fill="rgba(0,0,0,0.5)"/>
  <!-- 배경 패널 -->
  <rect x="2" y="2" width="68" height="68" fill="#08041a"/>
  <rect x="2" y="2" width="68" height="2" fill="rgba(255,255,255,0.12)"/>
  <rect x="2" y="2" width="2" height="68" fill="rgba(255,255,255,0.08)"/>
  <rect x="68" y="2" width="2" height="68" fill="rgba(0,0,0,0.5)"/>
  <rect x="2" y="68" width="68" height="2" fill="rgba(0,0,0,0.5)"/>
  <!-- 테두리 -->
  <rect x="4" y="4" width="64" height="64" fill="none" stroke="${oc}" stroke-width="2" opacity="0.6"/>
  <!-- 모서리 장식 -->
  <rect x="4" y="4" width="8" height="2" fill="${oc}" opacity="0.8"/>
  <rect x="4" y="4" width="2" height="8" fill="${oc}" opacity="0.8"/>
  <rect x="60" y="4" width="8" height="2" fill="${oc}" opacity="0.8"/>
  <rect x="66" y="4" width="2" height="8" fill="${oc}" opacity="0.8"/>
  <rect x="4" y="66" width="8" height="2" fill="${oc}" opacity="0.8"/>
  <rect x="4" y="60" width="2" height="8" fill="${oc}" opacity="0.8"/>
  <rect x="60" y="66" width="8" height="2" fill="${oc}" opacity="0.8"/>
  <rect x="66" y="60" width="2" height="8" fill="${oc}" opacity="0.8"/>
  ${innerContent}
  <!-- 잠금 오버레이 -->
  ${!unlocked?'<rect x="2" y="2" width="68" height="68" fill="rgba(0,0,0,0.45)"/>':''}
  </svg>`;
}

function drawNodeTown(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 집 실루엣 (픽셀 아트 마을) -->
  <rect x="18" y="44" width="36" height="20" fill="#8a4820"/>
  <rect x="20" y="46" width="32" height="16" fill="#a85828"/>
  <!-- 지붕 -->
  <rect x="14" y="36" width="44" height="10" fill="#6a3010"/>
  <rect x="10" y="28" width="8" height="10" fill="#7a3818"/>
  <rect x="10" y="26" width="52" height="4" fill="#8a4820"/>
  <rect x="14" y="20" width="44" height="8" fill="#7a3818"/>
  <rect x="18" y="14" width="36" height="8" fill="#6a2c10"/>
  <rect x="22" y="10" width="28" height="6" fill="#5a2408"/>
  <rect x="28" y="6" width="16" height="6" fill="#4a1c04"/>
  <!-- 창문 (노란 불빛) -->
  <rect x="26" y="48" width="8" height="8" fill="#ffd060"/>
  <rect x="38" y="48" width="8" height="8" fill="#ffd060"/>
  <rect x="27" y="49" width="6" height="6" fill="#ffe880"/>
  <rect x="39" y="49" width="6" height="6" fill="#ffe880"/>
  <!-- 문 -->
  <rect x="32" y="54" width="8" height="10" fill="#3a1808"/>
  <rect x="33" y="55" width="6" height="8" fill="#5a2810"/>
  <!-- 깃발 -->
  <rect x="36" y="6" width="2" height="16" fill="#c89020"/>
  <rect x="38" y="6" width="12" height="8" fill="#e8a020"/>
  <rect x="38" y="8" width="10" height="4" fill="#ffd040"/>
  <!-- 빛 효과 -->
  <rect x="14" y="36" width="44" height="2" fill="rgba(255,200,80,0.3)"/>
  `);
}

function drawNodeRuins(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 폐허 던전 (무너진 성) -->
  <rect x="14" y="20" width="12" height="44" fill="#3a2010"/>
  <rect x="46" y="28" width="12" height="36" fill="#3a2010"/>
  <rect x="16" y="22" width="8" height="40" fill="#4a2c14"/>
  <rect x="48" y="30" width="8" height="34" fill="#4a2c14"/>
  <!-- 무너진 부분 -->
  <rect x="26" y="32" width="20" height="32" fill="#2a1808"/>
  <rect x="28" y="34" width="16" height="28" fill="#3a2010"/>
  <!-- 바닥 -->
  <rect x="10" y="58" width="52" height="6" fill="#2a1808"/>
  <rect x="12" y="60" width="48" height="2" fill="#3a2010"/>
  <!-- 균열/파편 -->
  <rect x="20" y="40" width="2" height="14" fill="#1a0c04"/>
  <rect x="50" y="36" width="2" height="10" fill="#1a0c04"/>
  <rect x="30" y="44" width="12" height="2" fill="#1a0c04"/>
  <!-- 탑 꼭대기 (부서진) -->
  <rect x="14" y="14" width="12" height="8" fill="#2a1808"/>
  <rect x="14" y="12" width="4" height="4" fill="#2a1808"/>
  <rect x="22" y="10" width="4" height="6" fill="#2a1808"/>
  <!-- 잡초/이끼 -->
  <rect x="26" y="58" width="4" height="4" fill="#206010" opacity="0.7"/>
  <rect x="40" y="56" width="4" height="6" fill="#1a5010" opacity="0.7"/>
  <!-- 붉은 빛 -->
  <rect x="24" y="44" width="24" height="2" fill="rgba(255,80,20,0.25)"/>
  `);
}

function drawNodeTower(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 어둠의 탑 (검은 탑 + 보라빛) -->
  <rect x="24" y="8" width="24" height="56" fill="#1a0830"/>
  <rect x="26" y="10" width="20" height="52" fill="#220c40"/>
  <!-- 탑 꼭대기 -->
  <rect x="20" y="4" width="32" height="6" fill="#2a1048"/>
  <rect x="18" y="2" width="8" height="4" fill="#1a0830"/>
  <rect x="46" y="2" width="8" height="4" fill="#1a0830"/>
  <rect x="22" y="0" width="4" height="4" fill="#1a0830"/>
  <rect x="46" y="0" width="4" height="4" fill="#1a0830"/>
  <!-- 창문 (보라빛) -->
  <rect x="30" y="18" width="12" height="8" fill="#4a1060"/>
  <rect x="32" y="20" width="8" height="4" fill="#8030c0"/>
  <rect x="34" y="21" width="4" height="2" fill="#c060ff"/>
  <rect x="30" y="34" width="12" height="8" fill="#4a1060"/>
  <rect x="32" y="36" width="8" height="4" fill="#8030c0"/>
  <rect x="34" y="37" width="4" height="2" fill="#c060ff"/>
  <!-- 문 -->
  <rect x="30" y="52" width="12" height="12" fill="#100820"/>
  <rect x="32" y="54" width="8" height="10" fill="#1a0c30"/>
  <!-- 보라 빛줄기 -->
  <rect x="34" y="8" width="4" height="56" fill="rgba(160,60,255,0.08)"/>
  <!-- 마법진 (바닥) -->
  <rect x="22" y="62" width="28" height="2" fill="rgba(160,60,255,0.3)"/>
  <rect x="26" y="60" width="20" height="2" fill="rgba(160,60,255,0.2)"/>
  `);
}

function drawNodeCastle(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 왕성 지하 입구 -->
  <rect x="12" y="20" width="48" height="44" fill="#3a1c08"/>
  <rect x="14" y="22" width="44" height="40" fill="#4a2410"/>
  <!-- 성벽 흉벽 -->
  <rect x="12" y="14" width="8" height="8" fill="#3a1c08"/>
  <rect x="24" y="14" width="8" height="8" fill="#3a1c08"/>
  <rect x="40" y="14" width="8" height="8" fill="#3a1c08"/>
  <rect x="52" y="14" width="8" height="8" fill="#3a1c08"/>
  <rect x="12" y="20" width="48" height="4" fill="#3a1c08"/>
  <!-- 지하 입구 (어두운 아치) -->
  <rect x="24" y="34" width="24" height="30" fill="#1a0808"/>
  <rect x="26" y="36" width="20" height="28" fill="#220a08"/>
  <!-- 아치 -->
  <rect x="24" y="30" width="24" height="6" fill="#2a1008"/>
  <rect x="26" y="28" width="20" height="4" fill="#3a1808"/>
  <rect x="30" y="26" width="12" height="4" fill="#3a1808"/>
  <!-- 황금 문장 -->
  <rect x="34" y="22" width="4" height="8" fill="#c89020"/>
  <rect x="30" y="24" width="12" height="4" fill="#c89020"/>
  <rect x="33" y="22" width="6" height="2" fill="#ffd040"/>
  <!-- 계단 -->
  <rect x="28" y="58" width="16" height="2" fill="#2a1008"/>
  <rect x="30" y="56" width="12" height="2" fill="#2a1008"/>
  <rect x="32" y="54" width="8" height="2" fill="#2a1008"/>
  <!-- 빛 (오렌지) -->
  <rect x="12" y="20" width="48" height="2" fill="rgba(255,160,40,0.2)"/>
  `);
}

function drawNodeRelic(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 고대 유적 (기둥+마법진) -->
  <!-- 기둥 왼 -->
  <rect x="12" y="14" width="10" height="50" fill="#2a2838"/>
  <rect x="14" y="16" width="6" height="46" fill="#343248"/>
  <rect x="12" y="12" width="10" height="4" fill="#3a3850"/>
  <!-- 기둥 오른 -->
  <rect x="50" y="14" width="10" height="50" fill="#2a2838"/>
  <rect x="52" y="16" width="6" height="46" fill="#343248"/>
  <rect x="50" y="12" width="10" height="4" fill="#3a3850"/>
  <!-- 기둥 중 (부서진) -->
  <rect x="31" y="28" width="10" height="36" fill="#2a2838"/>
  <rect x="33" y="30" width="6" height="32" fill="#343248"/>
  <rect x="29" y="24" width="14" height="6" fill="#3a3850"/>
  <!-- 바닥 마법진 -->
  <rect x="14" y="58" width="44" height="4" fill="#1a1828"/>
  <rect x="20" y="56" width="32" height="4" fill="#1a1828"/>
  <!-- 마법진 빛 (청록) -->
  <rect x="18" y="58" width="36" height="2" fill="rgba(40,200,180,0.4)"/>
  <rect x="24" y="56" width="24" height="2" fill="rgba(40,200,180,0.3)"/>
  <rect x="30" y="54" width="12" height="2" fill="rgba(40,200,180,0.2)"/>
  <!-- 룬 문자 -->
  <rect x="16" y="30" width="6" height="2" fill="rgba(80,200,200,0.5)"/>
  <rect x="16" y="34" width="4" height="2" fill="rgba(80,200,200,0.4)"/>
  <rect x="16" y="38" width="6" height="2" fill="rgba(80,200,200,0.5)"/>
  <rect x="50" y="28" width="6" height="2" fill="rgba(80,200,200,0.5)"/>
  <rect x="52" y="32" width="4" height="2" fill="rgba(80,200,200,0.4)"/>
  <rect x="50" y="36" width="6" height="2" fill="rgba(80,200,200,0.5)"/>
  `);
}

function drawNodeDemon(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 마왕의 성 (어둡고 거대한) -->
  <!-- 중앙 성탑 -->
  <rect x="26" y="6" width="20" height="58" fill="#200414"/>
  <rect x="28" y="8" width="16" height="54" fill="#2c0618"/>
  <!-- 뿔 -->
  <rect x="22" y="2" width="8" height="10" fill="#1a0310"/>
  <rect x="42" y="2" width="8" height="10" fill="#1a0310"/>
  <rect x="24" y="0" width="6" height="4" fill="#240418"/>
  <rect x="42" y="0" width="6" height="4" fill="#240418"/>
  <!-- 좌측 탑 -->
  <rect x="10" y="22" width="14" height="42" fill="#1a0310"/>
  <rect x="12" y="24" width="10" height="38" fill="#220418"/>
  <rect x="8" y="18" width="18" height="6" fill="#1a0310"/>
  <!-- 우측 탑 -->
  <rect x="48" y="22" width="14" height="42" fill="#1a0310"/>
  <rect x="50" y="24" width="10" height="38" fill="#220418"/>
  <rect x="46" y="18" width="18" height="6" fill="#1a0310"/>
  <!-- 불꽃 창문 -->
  <rect x="30" y="16" width="12" height="10" fill="#800010"/>
  <rect x="32" y="18" width="8" height="6" fill="#cc0020"/>
  <rect x="34" y="19" width="4" height="3" fill="#ff2040"/>
  <rect x="30" y="30" width="12" height="10" fill="#800010"/>
  <rect x="32" y="32" width="8" height="6" fill="#cc0020"/>
  <rect x="34" y="33" width="4" height="3" fill="#ff2040"/>
  <!-- 문 (마법 인장) -->
  <rect x="30" y="52" width="12" height="12" fill="#100008"/>
  <rect x="32" y="54" width="8" height="10" fill="#180010"/>
  <rect x="35" y="54" width="2" height="10" fill="#ff0030" opacity="0.5"/>
  <rect x="32" y="59" width="8" height="2" fill="#ff0030" opacity="0.5"/>
  <!-- 붉은 빛 -->
  <rect x="26" y="6" width="20" height="2" fill="rgba(255,0,40,0.3)"/>
  <rect x="28" y="62" width="16" height="2" fill="rgba(255,0,40,0.2)"/>
  `);
}

function drawNodeSecret(unlocked, color){
  return _nodeBase(unlocked,color,`
  <!-- 미지의 장소 (물음표) -->
  <rect x="28" y="14" width="16" height="8" fill="#404050"/>
  <rect x="22" y="18" width="8" height="8" fill="#404050"/>
  <rect x="42" y="18" width="8" height="8" fill="#404050"/>
  <rect x="42" y="26" width="8" height="12" fill="#404050"/>
  <rect x="34" y="34" width="8" height="8" fill="#404050"/>
  <rect x="34" y="46" width="8" height="8" fill="#404050"/>
  <rect x="26" y="16" width="12" height="6" fill="#505060"/>
  <rect x="22" y="20" width="6" height="6" fill="#505060"/>
  <rect x="44" y="20" width="4" height="10" fill="#505060"/>
  <rect x="36" y="36" width="4" height="6" fill="#505060"/>
  <rect x="36" y="48" width="4" height="4" fill="#505060"/>
  <!-- 발광 -->
  <rect x="30" y="16" width="12" height="4" fill="rgba(150,120,200,0.3)"/>
  <rect x="36" y="38" width="4" height="4" fill="rgba(150,120,200,0.25)"/>
  <rect x="36" y="50" width="4" height="2" fill="rgba(150,120,200,0.25)"/>
  `);
}

function drawNodeDefault(unlocked, color){
  return _nodeBase(unlocked,color,`<rect x="28" y="28" width="16" height="16" fill="${color}" opacity="0.6"/>`);
}

function handleMapNode(node){
  if(node.action==='town') gotoScreen('s-town');
  else if(node.action==='dungeon'){
    G.dungeon.dungeonId=node.dungeonId;
    G.dungeon.floor=1;
    G.dungeon.encounter=0;
    gotoScreen('s-guild');
  }
}

function buildPartyBarWorld(){
  const bar=document.getElementById('party-bar-world');
  if(!bar)return;
  bar.innerHTML='';
  G.party.forEach(cid=>{
    const c=CHARS[cid]; if(!c)return;
    const div=document.createElement('div');
    div.className='party-mini';
    div.title=c.name;
    const svg=CHAR_SVG[c.artKey]||'';
    const hpPct=Math.max(0,c.base.hp/c.base.maxHp*100);
    div.innerHTML=svg+`<div class="mini-hp" style="width:${hpPct}%"></div>`;
    div.onclick=()=>{gotoScreen('s-status');buildStatusScreen(cid);};
    bar.appendChild(div);
  });
}

// ══════════════════════════════════
// GUILD
// ══════════════════════════════════
function buildGuild(){
  buildCharRoster();
  buildPartySlots();
  buildPartyStats();
}

function buildCharRoster(){
  const el=document.getElementById('char-roster');
  if(!el)return;
  el.innerHTML='';
  Object.values(CHARS).forEach(c=>{
    const unlocked=G.unlockedChars.includes(c.id);
    const inParty=G.party.includes(c.id);
    const div=document.createElement('div');
    div.className='char-card'+(inParty?' in-party':'')+(unlocked?'':' locked');
    const svg=CHAR_SVG[c.artKey]||'';
    const tagText=inParty?'파티 합류 중':unlocked?(c.recruit.cost>0?`🪙${c.recruit.cost} 영입`:'영입 가능'):'🔒 잠금';
    div.innerHTML=`
      <div class="char-thumb">${svg}</div>
      <div class="char-info">
        <h4>${c.name}</h4>
        <div class="char-role">${c.role}</div>
        <div class="char-level">Lv.${c.base.level} · ${c.element.name} ${c.element.icon}</div>
        <span class="char-tag ${inParty?'in-party-tag':''}">${tagText}</span>
        ${!unlocked?`<div style="font-size:11px;color:var(--text3);margin-top:5px;">${c.recruit.condition}</div>`:''}
      </div>`;
    // 모든 카드 클릭 가능 (잠긴 건 안내 메시지)
    div.onclick=()=>toggleParty(c.id);
    el.appendChild(div);
  });
}

function toggleParty(cid){
  const unlocked=G.unlockedChars.includes(cid);
  const c=CHARS[cid];
  if(!unlocked){
    showToast(`🔒 해금 조건: ${c.recruit.condition}`);
    return;
  }
  if(G.party.includes(cid)){
    G.party=G.party.filter(id=>id!==cid);
    showToast(`${c.name} 파티에서 제외`);
  } else {
    if(G.party.length>=3){showToast('파티는 최대 3명입니다');return;}
    if(c.recruit.cost>0&&G.gold<c.recruit.cost){
      showToast(`골드가 부족합니다 (🪙${c.recruit.cost} 필요)`);return;
    }
    if(c.recruit.cost>0){G.gold-=c.recruit.cost;updateGoldDisplay();}
    G.party.push(cid);
    showToast(`${c.name} 파티에 합류!`);
  }
  buildCharRoster();
  buildPartySlots();
  buildPartyStats();
}

function buildPartySlots(){
  const el=document.getElementById('party-slots');
  if(!el)return;
  el.innerHTML='';
  for(let i=0;i<3;i++){
    const cid=G.party[i];
    const c=cid?CHARS[cid]:null;
    const div=document.createElement('div');
    div.className='party-slot'+(c?' filled':'');
    if(c){
      const svg=CHAR_SVG[c.artKey]||'';
      const hpPct=Math.round(c.base.hp/c.base.maxHp*100);
      div.innerHTML=`
        <span class="slot-num">${i+1}</span>
        <div class="slot-thumb">${svg}</div>
        <div class="slot-info">
          <h4>${c.name}</h4>
          <p>Lv.${c.base.level} · HP ${c.base.hp}/${c.base.maxHp} · ATK ${getTotalStat(c,'atk')}</p>
        </div>
        <button class="btn-remove" onclick="toggleParty('${c.id}');event.stopPropagation()">제거</button>`;
    } else {
      div.innerHTML=`<span class="slot-num">${i+1}</span><span class="slot-empty-txt">파티원을 선택하세요</span>`;
      div.onclick=()=>{};
    }
    el.appendChild(div);
  }
  const btn=document.getElementById('btn-dungeon');
  if(btn) btn.disabled=G.party.length===0;
}

function buildPartyStats(){
  const el=document.getElementById('party-stats');
  if(!el)return;
  let totHp=0,totAtk=0,totDef=0,totSpd=0;
  G.party.forEach(cid=>{
    const c=CHARS[cid];if(!c)return;
    totHp+=c.base.maxHp; totAtk+=getTotalStat(c,'atk');
    totDef+=getTotalStat(c,'def'); totSpd+=getTotalStat(c,'spd');
  });
  el.innerHTML=`
    <div class="pstat-row"><span class="pstat-label">총 HP</span><span class="pstat-val">${totHp}</span></div>
    <div class="pstat-row"><span class="pstat-label">평균 ATK</span><span class="pstat-val">${G.party.length?Math.round(totAtk/G.party.length):0}</span></div>
    <div class="pstat-row"><span class="pstat-label">평균 DEF</span><span class="pstat-val">${G.party.length?Math.round(totDef/G.party.length):0}</span></div>
    <div class="pstat-row"><span class="pstat-label">선제 (최고 SPD)</span><span class="pstat-val">${totSpd?Math.max(...G.party.map(id=>getTotalStat(CHARS[id],'spd'))):0}</span></div>
    <div class="pstat-row"><span class="pstat-label">파티원 수</span><span class="pstat-val">${G.party.length} / 3</span></div>`;
}

function getTotalStat(c,stat){
  let val=c.base[stat]||0;
  Object.values(c.equip).forEach(itemId=>{
    if(!itemId)return;
    const item=ITEMS[itemId];
    if(item&&item.stat&&item.stat[stat]) val+=item.stat[stat];
  });
  return Math.round(val);
}

// ══════════════════════════════════
// SHOP
// ══════════════════════════════════
const SHOP_STOCK=['iron_sword','mage_staff','leather_armor','iron_shield','silver_ring','fire_gem','potion','hipotion','ether','antidote'];
let selectedShopItem=null;

function buildShop(){
  updateGoldDisplay();
  buildShopItems();
  buildInventory();
  document.getElementById('item-detail-panel').innerHTML=
    `<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px;line-height:2.5;">
      ← 아이템을 선택하면<br>상세 정보가 표시됩니다
    </div>`;
}

function buildShopItems(){
  const el=document.getElementById('shop-items');
  if(!el)return;
  el.innerHTML='';
  SHOP_STOCK.forEach(itemId=>{
    const item=ITEMS[itemId];if(!item)return;
    const div=document.createElement('div');
    div.className='shop-item'+(selectedShopItem===itemId?' selected':'');
    div.innerHTML=`
      <span class="item-icon">${item.icon}</span>
      <div class="item-info">
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
        <span class="item-type-badge type-${item.type}">${{weapon:'무기',armor:'방어구',potion:'포션',accessory:'장신구'}[item.type]||item.type}</span>
      </div>
      <span class="item-price">🪙${item.price}</span>`;
    div.onclick=()=>selectShopItem(itemId);
    el.appendChild(div);
  });
}

function selectShopItem(itemId){
  selectedShopItem=itemId;
  buildShopItems();
  const item=ITEMS[itemId];
  const el=document.getElementById('item-detail-panel');
  let statsHtml='';
  if(item.stat) Object.entries(item.stat).forEach(([k,v])=>{
    const labels={atk:'ATK',def:'DEF',spd:'SPD',maxHp:'최대HP',maxMp:'최대MP'};
    statsHtml+=`<div class="item-stat"><span>${labels[k]||k}</span><span class="stat-up">+${v}</span></div>`;
  });
  if(item.effect&&item.effect.hp) statsHtml+=`<div class="item-stat"><span>HP 회복</span><span class="stat-up">+${item.effect.hp}</span></div>`;
  if(item.effect&&item.effect.mp) statsHtml+=`<div class="item-stat"><span>MP 회복</span><span class="stat-up">+${item.effect.mp}</span></div>`;
  // 직업 제한
  const jobNames={warrior:'전사',knight:'기사',rogue:'도적',mage:'마법사'};
  const jobRestrict=item.jobs?`<div class="item-stat"><span>장착 직업</span><span style="color:var(--blue2)">${item.jobs.map(j=>jobNames[j]||j).join('·')}</span></div>`:'';
  // 슬롯
  const slotNames={weapon:'무기',armor:'방어구',shield:'방패',accessory:'장신구'};
  const slotInfo=item.slot?`<div class="item-stat"><span>슬롯</span><span style="color:var(--text3)">${slotNames[item.slot]||item.slot}</span></div>`:'';
  const canBuy=G.gold>=item.price;
  const typeLabel={weapon:'⚔ 무기',armor:'🛡 방어구',potion:'🧪 포션',accessory:'💍 장신구'}[item.type]||item.type;
  el.innerHTML=`
    <div class="item-detail">
      <h3>${item.icon} ${item.name}</h3>
      <div class="item-stat"><span>종류</span><span>${typeLabel}</span></div>
      <div class="item-stat"><span>가격</span><span style="color:var(--gold);text-shadow:0 0 8px rgba(255,215,0,.4)">🪙 ${item.price}</span></div>
      ${slotInfo}${jobRestrict}${statsHtml}
      <div class="item-stat"><span>효과</span><span style="color:var(--text2)">${item.desc}</span></div>
    </div>
    <button class="btn-buy" ${canBuy?'':'disabled'} onclick="buyItem('${itemId}')">
      ${canBuy?`🪙 ${item.price} 구매`:'골드 부족'}
    </button>`;
}

function buyItem(itemId){
  const item=ITEMS[itemId];if(!item)return;
  if(G.gold<item.price){showToast('골드가 부족합니다');return;}
  G.gold-=item.price;
  const existing=G.inventory.find(i=>i.id===itemId);
  if(existing) existing.qty++;
  else G.inventory.push({id:itemId,qty:1});
  updateGoldDisplay();
  buildInventory();
  selectShopItem(itemId);
  showToast(`${item.name} 구매 완료!`);
}

function buildInventory(){
  const el=document.getElementById('inventory-list');
  if(!el)return;
  if(!G.inventory.length){el.innerHTML='<p style="font-size:12px;color:var(--text3)">인벤토리가 비어 있습니다</p>';return;}
  el.innerHTML='';
  G.inventory.forEach(({id,qty})=>{
    const item=ITEMS[id];if(!item)return;
    const div=document.createElement('div');
    div.className='inv-slot';
    const isEquip=item.type==='weapon'||item.type==='armor'||item.type==='accessory';
    div.innerHTML=`
      <span class="inv-icon">${item.icon}</span>
      <span class="inv-name">${item.name}</span>
      <span class="inv-qty">x${qty}</span>
      ${item.type==='potion'?`<button class="btn-use-item" onclick="useItemFromInv('${id}')">사용</button>`:''}
      ${isEquip?`<button class="btn-equip" onclick="openEquipModal('${id}')">장착</button>`:''}`;
    el.appendChild(div);
  });
}

function useItemFromInv(itemId){
  if(!G.party.length){showToast('파티원이 없습니다');return;}
  // 파티원이 1명이면 바로 사용, 여러 명이면 선택
  if(G.party.length===1){
    const target=CHARS[G.party[0]];
    useItem(itemId,target);
    buildInventory();
  } else {
    openItemTargetModal(itemId);
  }
}

function openItemTargetModal(itemId){
  const item=ITEMS[itemId]; if(!item)return;
  const ol=document.createElement('div');ol.className='modal-overlay';ol.id='item-target-modal';
  const box=document.createElement('div');box.className='modal-box';
  box.innerHTML=`<div class="modal-title">🎯 ${item.name} — 사용 대상 선택</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${G.party.map(cid=>{
        const c=CHARS[cid];
        const hpPct=Math.round(c.base.hp/c.base.maxHp*100);
        return `<button class="npc-choice" onclick="useItemOnTarget('${itemId}','${cid}')">
          ${c.name} — HP ${c.base.hp}/${c.base.maxHp} (${hpPct}%)
        </button>`;
      }).join('')}
    </div>
    <div class="modal-btns"><button class="modal-btn cancel" onclick="document.getElementById('item-target-modal').remove()">취소</button></div>`;
  ol.appendChild(box);
  document.body.appendChild(ol);
}

function useItemOnTarget(itemId,cid){
  const modal=document.getElementById('item-target-modal');
  if(modal)modal.remove();
  const target=CHARS[cid]; if(!target)return;
  useItem(itemId,target);
  buildInventory();
}

function useItem(itemId,target){
  const item=ITEMS[itemId];if(!item||item.type!=='potion')return;
  const inv=G.inventory.find(i=>i.id===itemId);
  if(!inv||inv.qty<=0)return;
  inv.qty--;
  if(inv.qty<=0) G.inventory=G.inventory.filter(i=>i.id!==itemId);
  if(item.effect.hp){
    target.base.hp=Math.min(target.base.maxHp,target.base.hp+item.effect.hp);
    showToast(`${target.name} HP +${item.effect.hp}`);
  }
  if(item.effect.mp){
    target.base.mp=Math.min(target.base.maxMp,target.base.mp+item.effect.mp);
    showToast(`${target.name} MP +${item.effect.mp}`);
  }
}

function openEquipModal(itemId){
  if(!G.party.length){showToast('파티원이 없습니다');return;}
  const item=ITEMS[itemId];
  const overlay=document.createElement('div');
  overlay.className='modal-overlay';
  overlay.id='equip-modal';
  let charBtns=G.party.map(cid=>{
    const c=CHARS[cid];
    return `<button class="npc-choice" onclick="equipItem('${itemId}','${cid}');closeModal('equip-modal')">${c.name} (Lv.${c.base.level})</button>`;
  }).join('');
  overlay.innerHTML=`
    <div class="modal-box">
      <div class="modal-title">${item.icon} ${item.name} 장착</div>
      <p style="font-size:12px;color:var(--text3);margin-bottom:12px;">누구에게 장착할까요?</p>
      ${charBtns}
      <div class="modal-btns"><button class="modal-btn cancel" onclick="closeModal('equip-modal')">취소</button></div>
    </div>`;
  document.body.appendChild(overlay);
}

function equipItem(itemId,cid){
  const c=CHARS[cid]; const item=ITEMS[itemId];
  if(!c||!item)return;
  const slot=item.slot||'accessory';
  // 기존 장비 해제
  if(c.equip[slot]){
    const old=ITEMS[c.equip[slot]];
    showToast(`${c.name}: ${old.name} 해제`);
  }
  c.equip[slot]=itemId;
  // 인벤에서 제거
  const inv=G.inventory.find(i=>i.id===itemId);
  if(inv){inv.qty--;if(inv.qty<=0)G.inventory=G.inventory.filter(i=>i.id!==itemId);}
  buildInventory();
  showToast(`${c.name}: ${item.name} 장착 완료!`);
}

function closeModal(id){
  const el=document.getElementById(id);if(el)el.remove();
}

// ══════════════════════════════════
// NPC
// ══════════════════════════════════
let _currentNpcId='elder';

function openNPC(npcId){
  const npc=NPCS[npcId];if(!npc)return;
  _currentNpcId=npcId;
  document.getElementById('npc-screen-title').textContent=npc.name;
  document.getElementById('npc-name-display').textContent=npc.name;
  document.getElementById('npc-role').textContent=npc.role;
  const art=CHAR_SVG[npc.artKey]||'';
  const artDiv=document.getElementById('npc-art');
  artDiv.innerHTML=art;
  artDiv.style.cssText='width:200px;height:auto;';
  showNPCDialog(npc.dialog[0]);
  gotoScreen('s-npc');
}

function showNPCDialog(dlg){
  document.getElementById('npc-text').textContent=dlg.text;
  const choices=document.getElementById('npc-choices');
  choices.innerHTML='';
  dlg.choices.forEach(ch=>{
    const btn=document.createElement('button');
    btn.className='npc-choice';
    btn.textContent=ch.text;
    btn.onclick=()=>handleNPCChoice(ch);
    choices.appendChild(btn);
  });
}

function handleNPCChoice(choice){
  const npc=NPCS[_currentNpcId]||NPCS['elder'];
  if(choice.action==='leave'){gotoScreen('s-town');return;}
  if(choice.action==='back'){showNPCDialog(npc.dialog[0]);return;}

  // extraDialogs 분기
  if(npc.extraDialogs&&npc.extraDialogs[choice.action]){
    showNPCDialog(npc.extraDialogs[choice.action]);
    return;
  }

  if(choice.action==='quest_offer'){
    const choices=document.getElementById('npc-choices');
    choices.innerHTML='';
    // 제목 텍스트
    document.getElementById('npc-text').textContent='수락할 퀘스트를 선택하세요. 완료된 퀘스트는 보상을 받을 수 있습니다.';
    npc.quests.forEach(q=>{
      const isActive=G.activeQuests.includes(q.id);
      const isCompleted=G.flags[q.id+'_done'];
      const qDiv=document.createElement('div');
      qDiv.className='quest-item';
      qDiv.innerHTML=`<div class="quest-title">📜 ${q.title} ${isCompleted?'<span style="color:var(--green2)">✔ 완료</span>':''}</div>
        <div class="quest-desc">${q.desc}</div>
        <div class="quest-reward">보상: 🪙${q.reward.gold} + XP ${q.reward.xp}</div>
        ${isCompleted
          ?`<button class="btn-accept-quest" style="background:linear-gradient(135deg,#102010,#081408);color:var(--green2);box-shadow:0 0 0 1px var(--green);" onclick="claimQuest('${q.id}','${_currentNpcId}')">🎁 보상 수령</button>`
          :isActive
            ?`<button class="btn-accept-quest" disabled style="opacity:.5">진행 중...</button>`
            :`<button class="btn-accept-quest" onclick="acceptQuest('${q.id}')">수락</button>`}`;
      choices.appendChild(qDiv);
    });
    const backBtn=document.createElement('button');
    backBtn.className='npc-choice';backBtn.textContent='← 돌아가기';
    backBtn.onclick=()=>showNPCDialog(npc.dialog[0]);
    choices.appendChild(backBtn);
    return;
  }

  // fallback — 원래 대화로
  showNPCDialog(npc.dialog[0]);
}

function acceptQuest(qid){
  if(G.activeQuests.includes(qid)){showToast('이미 수락한 퀘스트입니다');return;}
  G.activeQuests.push(qid);
  showToast('퀘스트 수락!');
  const npc=NPCS[_currentNpcId]||NPCS['elder'];
  showNPCDialog(npc.dialog[0]);
}

function claimQuest(qid, npcId){
  if(!G.flags[qid+'_done']){showToast('아직 조건을 달성하지 못했습니다');return;}
  if(G.flags[qid+'_claimed']){showToast('이미 보상을 수령했습니다');return;}
  const npc=NPCS[npcId]||NPCS['elder'];
  const q=npc.quests.find(x=>x.id===qid);
  if(!q)return;
  G.gold+=q.reward.gold;
  G.party.forEach(cid=>{if(CHARS[cid])CHARS[cid].base.xp+=Math.floor(q.reward.xp/Math.max(1,G.party.length));});
  G.flags[qid+'_claimed']=true;
  updateGoldDisplay();
  showToast(`🎁 보상 수령! 🪙+${q.reward.gold} XP+${q.reward.xp}`);
  const dlg=npc.dialog[0];showNPCDialog(dlg);
}

// 던전 클리어 시 퀘스트 플래그 설정 (dungeonClear에서 호출)
function checkQuestFlags(dungeonId){
  const flagMap={
    dungeon1:'q1_done', dungeon3:'q2_done', dungeon5:'q3_done',
  };
  if(flagMap[dungeonId]) G.flags[flagMap[dungeonId]]=true;
}

// ══════════════════════════════════
// STATUS SCREEN
// ══════════════════════════════════
let statusViewChar=null;
function buildStatusScreen(cid){
  statusViewChar=cid||G.party[0]||'ch1';
  const listEl=document.getElementById('status-char-list');
  if(!listEl)return;
  listEl.innerHTML='';
  G.party.forEach(id=>{
    const c=CHARS[id];
    const div=document.createElement('div');
    div.style.cssText='padding:8px;border-radius:5px;cursor:pointer;margin-bottom:6px;border:1px solid '+(id===statusViewChar?'var(--accent)':'var(--b1)')+';background:'+(id===statusViewChar?'rgba(160,112,255,.1)':'var(--panel)');
    const svg=CHAR_SVG[c.artKey]||'';
    div.innerHTML=`<div style="width:60px;height:70px;overflow:hidden;">${svg}</div>
      <div style="font-size:11px;color:var(--text2);margin-top:6px;text-align:center;">${c.name}</div>`;
    div.onclick=()=>{statusViewChar=id;buildStatusScreen(id);};
    listEl.appendChild(div);
  });
  renderCharDetail(statusViewChar);
}

function renderCharDetail(cid){
  const c=CHARS[cid];if(!c)return;
  const el=document.getElementById('status-detail');
  if(!el)return;
  const hpPct=Math.round(c.base.hp/c.base.maxHp*100);
  const mpPct=Math.round(c.base.mp/c.base.maxMp*100);
  const xpPct=Math.round(c.base.xp/c.base.xpNext*100);
  const svg=CHAR_SVG[c.artKey]||'';
  const equipSlots=['weapon','armor','shield','accessory'];
  const slotNames={weapon:'무기',armor:'방어구',shield:'방패',accessory:'장신구'};
  let equipHtml=equipSlots.map(s=>{
    const item=c.equip[s]?ITEMS[c.equip[s]]:null;
    return `<div class="equip-slot">
      <span class="equip-slot-name">${slotNames[s]}</span>
      <span class="equip-item-name ${item?'':'empty'}">${item?item.icon+' '+item.name:'— 없음 —'}</span>
    </div>`;
  }).join('');
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
      <div style="padding:16px;border-right:1px solid var(--b1);">
        <div class="char-portrait-big">${svg}</div>
        <div style="text-align:center;margin-bottom:14px;">
          <div style="font-family:'Press Start 2P',monospace;font-size:15px;color:var(--gold2);text-shadow:0 0 10px rgba(255,215,0,.4);">${c.name}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:6px;">${c.role} · ${c.element.name}${c.element.icon}</div>
        </div>
        <div class="xp-bar-wrap">
          <div class="xp-label"><span>Lv.${c.base.level}</span><span>${c.base.xp} / ${c.base.xpNext} XP</span></div>
          <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
        </div>
        <div class="stat-group">
          <div class="stat-group-title">HP / MP</div>
          <div class="stat-row"><span class="stat-name">HP</span><span class="stat-value">${c.base.hp} / ${c.base.maxHp}</span></div>
          <div class="hud-bar" style="margin:4px 0 8px;"><div class="hud-bar-fill hp" style="width:${hpPct}%"></div></div>
          <div class="stat-row"><span class="stat-name">MP</span><span class="stat-value">${c.base.mp} / ${c.base.maxMp}</span></div>
          <div class="hud-bar" style="margin:4px 0;"><div class="hud-bar-fill mp" style="width:${mpPct}%"></div></div>
        </div>
      </div>
      <div style="padding:16px;">
        <div class="stat-group">
          <div class="stat-group-title">전투 스탯</div>
          <div class="stat-row"><span class="stat-name">ATK</span><span class="stat-value">${getTotalStat(c,'atk')}</span></div>
          <div class="stat-row"><span class="stat-name">DEF</span><span class="stat-value">${getTotalStat(c,'def')}</span></div>
          <div class="stat-row"><span class="stat-name">SPD</span><span class="stat-value">${getTotalStat(c,'spd')}</span></div>
          <div class="stat-row"><span class="stat-name">최대HP</span><span class="stat-value">${getTotalStat(c,'maxHp')||c.base.maxHp}</span></div>
          <div class="stat-row"><span class="stat-name">최대MP</span><span class="stat-value">${getTotalStat(c,'maxMp')||c.base.maxMp}</span></div>
        </div>
        <div class="stat-group">
          <div class="stat-group-title">장비</div>
          ${equipHtml}
        </div>
        <div class="stat-group">
          <div class="stat-group-title">스킬</div>
          ${c.skills.filter(sk=>sk.special).map(sk=>`
            <div class="stat-row">
              <span class="stat-name">${sk.icon} ${sk.name}</span>
              <span style="font-size:11px;color:var(--text3)">${sk.desc}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════
// DUNGEON & BATTLE
// ══════════════════════════════════
function startDungeon(){
  if(!G.party.length){showToast('파티원을 선택하세요');return;}
  const dId=G.dungeon.dungeonId||'dungeon1';
  const dDef=DUNGEONS[dId];
  G.dungeon.def=dDef;
  G.dungeon.encounter=0;
  G.dungeon.totalEnc=dDef.encounters.length;
  G.dungeon.floor=1;
  G.dungeon.bossDefeated=false;
  G.dungeon.currentBoss=null;
  nextEncounter();
}

function nextEncounter(){
  const dDef=G.dungeon.def;
  const normalEncs=dDef.encounters;

  // 일반 인카운터 끝났으면 보스전
  if(G.dungeon.encounter>=normalEncs.length){
    if(!G.dungeon.bossDefeated){
      showBossEntrance(dDef);
    } else {
      dungeonClear();
    }
    return;
  }

  const encEnemyIds=normalEncs[G.dungeon.encounter];
  G.dungeon.encounter++;

  // 적 인스턴스 생성
  const enemies=encEnemyIds.map((eid,i)=>{
    const base=ENEMIES[eid];
    return {
      ...base,
      uid:'e'+i+Date.now(),
      hp:base.hp, maxHp:base.hp,
      buffs:{defending:false,shielded:false,evasion:false,poisoned:0,bleeding:0,weakened:0,boosted:0},
      skillIdx:0,
    };
  });

  startBattle(enemies);
}

function startBattle(enemies, isBoss=false){
  // 보스 배너 제거
  const oldBanner=document.getElementById('boss-banner-el');
  if(oldBanner)oldBanner.remove();

  G.battle.isBoss=isBoss;

  // 파티 버프 초기화
  G.party.forEach(cid=>{
    const c=CHARS[cid];
    c.buffs={defending:false,shielded:false,evasion:false,poisoned:0,bleeding:0,weakened:0,boosted:0};
    c.skills.forEach(sk=>{if(sk.cd>0)sk.cd=Math.max(0,sk.cd-1);});
  });

  // 전투 순서: SPD 기준 (파티+적 합산)
  const allUnits=[
    ...G.party.map(cid=>({type:'player',id:cid,spd:getTotalStat(CHARS[cid],'spd')})),
    ...enemies.map(e=>({type:'enemy',id:e.uid,spd:e.spd})),
  ].sort((a,b)=>b.spd-a.spd);

  G.battle.enemies=enemies;
  G.battle.order=allUnits;
  G.battle.idx=0;
  G.battle.turn=1;
  G.battle.phase='player';
  G.currentAction='attack';

  // 던전 UI 업데이트
  document.getElementById('dungeon-floor-label').textContent=isBoss?'👑 BOSS':`B${G.dungeon.floor}F`;
  const normalTotal=G.dungeon.def?G.dungeon.def.encounters.length:G.dungeon.totalEnc;
  const pct=isBoss?100:Math.round((G.dungeon.encounter-1)/normalTotal*100);
  document.getElementById('dungeon-progress').style.width=pct+'%';
  document.getElementById('dungeon-enc-label').textContent=isBoss?'BOSS':''+G.dungeon.encounter+' / '+normalTotal;

  gotoScreen('s-battle');
  renderBattleArena();
  renderBattleHUD();
  renderBattleLog([]);
  battleLog('전투 시작!','l-sys');
  enemies.forEach(e=>battleLog(`${e.emoji} ${e.name} 등장!`,'l-sys'));
  // 보스 배너 + 배경 오버레이 표시
  if(isBoss && enemies[0]){
    setTimeout(()=>{
      renderBossBanner(enemies[0]);
      // 보스 배경 붉은빛 오버레이
      const arena=document.getElementById('battle-arena');
      const old=arena.querySelector('.boss-alert-overlay');
      if(!old){const ov=document.createElement('div');ov.className='boss-alert-overlay';arena.appendChild(ov);}
    },100);
  } else {
    // 일반 전투면 오버레이 제거
    const arena=document.getElementById('battle-arena');
    const ov=arena&&arena.querySelector('.boss-alert-overlay');
    if(ov)ov.remove();
  }
  advanceTurn();
}

function renderBattleArena(){
  // 파티
  const partyEl=document.getElementById('battle-party');
  partyEl.innerHTML='';
  G.party.forEach(cid=>{
    const c=CHARS[cid];
    const dead=c.base.hp<=0;
    const div=document.createElement('div');
    div.className='fighter'+(dead?' dead':'');
    div.id='fighter-'+cid;
    const svg=CHAR_SVG[c.artKey]||'';
    const hp=Math.max(0,Math.round(c.base.hp/c.base.maxHp*100));
    const mp=Math.max(0,Math.round(c.base.mp/c.base.maxMp*100));
    div.innerHTML=`
      <div class="fighter-sprite">${svg}</div>
      <div class="fighter-hpbar"><div class="fighter-hpfill" id="fhp-${cid}" style="width:${hp}%"></div></div>
      <div class="fighter-mpbar"><div class="fighter-mpfill" id="fmp-${cid}" style="width:${mp}%"></div></div>
      <div class="fighter-name">${c.name}</div>`;
    partyEl.appendChild(div);
  });

  // 적
  const enemyEl=document.getElementById('battle-enemies');
  enemyEl.innerHTML='';
  G.battle.enemies.forEach(e=>{
    const dead=e.hp<=0;
    const div=document.createElement('div');
    div.className='fighter'+(dead?' dead':'')+(e.isBoss?' boss-enemy-card':'');
    div.id='fighter-'+e.uid;
    const hp=Math.max(0,Math.round(e.hp/e.maxHp*100));
    div.innerHTML=`
      <div class="fighter-sprite enemy-sprite">${ENEMY_SVG[e.id]||e.emoji}</div>
      <div class="fighter-hpbar"><div class="fighter-hpfill" id="fhp-${e.uid}" style="width:${hp}%;background:${e.isBoss?'linear-gradient(90deg,#ff2200,#ff6600)':'var(--red2)'}"></div></div>
      <div class="fighter-name" style="${e.isBoss?'color:var(--red2);':''}">${e.isBoss?'👑 ':''} ${e.name}</div>`;
    div.onclick=()=>{if(G.battle.targetMode)selectTarget(e.uid,'enemy');};
    enemyEl.appendChild(div);
  });
}

function renderBattleHUD(){
  const el=document.getElementById('battle-hud');
  el.innerHTML='';
  G.party.forEach(cid=>{
    const c=CHARS[cid];
    const dead=c.base.hp<=0;
    const isActive=G.battle.currentUnit===cid;
    const hp=Math.max(0,c.base.hp); const mp=Math.max(0,c.base.mp);
    const div=document.createElement('div');
    div.className='hud-char'+(dead?' dead':'')+(isActive?' active':'');
    div.id='hud-'+cid;
    div.innerHTML=`
      <div class="hud-name">${c.name} · Lv${c.base.level}</div>
      <div class="hud-bar-row">
        <span class="hud-bar-label">HP</span>
        <div class="hud-bar"><div class="hud-bar-fill hp" id="hhp-${cid}" style="width:${Math.round(hp/c.base.maxHp*100)}%"></div></div>
        <span class="hud-val" id="hhpv-${cid}">${hp}/${c.base.maxHp}</span>
      </div>
      <div class="hud-bar-row">
        <span class="hud-bar-label">MP</span>
        <div class="hud-bar"><div class="hud-bar-fill mp" id="hmp-${cid}" style="width:${Math.round(mp/c.base.maxMp*100)}%"></div></div>
        <span class="hud-val" id="hmpv-${cid}">${mp}/${c.base.maxMp}</span>
      </div>`;
    el.appendChild(div);
  });
}

function updateBars(){
  G.party.forEach(cid=>{
    const c=CHARS[cid];
    const hp=Math.max(0,c.base.hp); const mp=Math.max(0,c.base.mp);
    const fhp=document.getElementById('fhp-'+cid);
    const hhp=document.getElementById('hhp-'+cid);
    const hmp=document.getElementById('hmp-'+cid);
    const hhpv=document.getElementById('hhpv-'+cid);
    const hmpv=document.getElementById('hmpv-'+cid);
    const fmp=document.getElementById('fmp-'+cid);
    const pct=Math.round(hp/c.base.maxHp*100);
    if(fhp)fhp.style.width=pct+'%';
    if(hhp)hhp.style.width=pct+'%';
    if(fmp)fmp.style.width=Math.round(mp/c.base.maxMp*100)+'%';
    if(hmp)hmp.style.width=Math.round(mp/c.base.maxMp*100)+'%';
    if(hhpv)hhpv.textContent=hp+'/'+c.base.maxHp;
    if(hmpv)hmpv.textContent=mp+'/'+c.base.maxMp;
    const fighter=document.getElementById('fighter-'+cid);
    if(fighter){fighter.classList.toggle('dead',c.base.hp<=0);}
  });
  G.battle.enemies.forEach(e=>{
    const fhp=document.getElementById('fhp-'+e.uid);
    if(fhp)fhp.style.width=Math.max(0,Math.round(e.hp/e.maxHp*100))+'%';
    const fighter=document.getElementById('fighter-'+e.uid);
    if(fighter)fighter.classList.toggle('dead',e.hp<=0);
    // 보스 배너 HP 실시간 업데이트
    if(e.isBoss) updateBossBanner(e);
  });
}

const logLines=[];
function battleLog(msg,cls=''){
  logLines.push({msg,cls});
  if(logLines.length>30)logLines.shift();
  renderBattleLog(logLines);
}
function renderBattleLog(lines){
  const el=document.getElementById('battle-log');
  if(!el)return;
  el.innerHTML=lines.map(l=>`<div class="log-line ${l.cls||''}">${l.msg}</div>`).join('');
  el.scrollTop=el.scrollHeight;
}

function advanceTurn(){
  // 다음 살아있는 유닛 찾기
  let attempts=0;
  while(attempts<G.battle.order.length*2){
    const unit=G.battle.order[G.battle.idx%G.battle.order.length];
    G.battle.idx++;
    attempts++;
    if(unit.type==='player'){
      const c=CHARS[unit.id];
      if(!c||c.base.hp<=0)continue;
      // 도트 데미지 처리
      processDots(c,'player');
      if(c.base.hp<=0){checkBattleEnd();continue;}
      G.battle.currentUnit=unit.id;
      G.battle.phase='player';
      // 쿨다운 감소
      c.skills.forEach(sk=>{if(sk.cd>0)sk.cd--;});
      document.getElementById('turn-char-name').textContent=c.name;
      if(G.battle.turn>1&&G.battle.idx%G.battle.order.length===1)G.battle.turn++;
      document.getElementById('turn-count').textContent=G.battle.turn;
      highlightActive(unit.id);
      buildActionGrid('attack');
      document.getElementById('enemy-overlay').style.display='none';
      return;
    } else {
      const e=G.battle.enemies.find(en=>en.uid===unit.id);
      if(!e||e.hp<=0)continue;
      // 도트 처리
      processDots(e,'enemy');
      if(e.hp<=0){checkBattleEnd();continue;}
      G.battle.currentUnit=null;
      G.battle.phase='enemy';
      document.getElementById('enemy-overlay').style.display='flex';
      document.getElementById('turn-char-name').textContent=e.name;
      setTimeout(()=>doEnemyAction(e),900);
      return;
    }
  }
  checkBattleEnd();
}

function processDots(unit,type){
  if(!unit.buffs)return;
  const name=unit.name||(unit.npc?unit.npc:unit.id);
  if(unit.buffs.poisoned>0){
    const baseStat=type==='player'?unit.base.maxHp:unit.maxHp;
    const dmg=Math.max(5,Math.floor(baseStat*0.06)); // 최대HP 6% 독 데미지
    if(type==='player'){unit.base.hp-=dmg;spawnDmg(dmg,'player','magic');}
    else{unit.hp-=dmg;spawnDmg(dmg,'enemy','magic');}
    battleLog(`☠ ${name} 독 피해 ${dmg} (남은 ${unit.buffs.poisoned-1}턴)`,'l-magic');
    unit.buffs.poisoned--;
  }
  if(unit.buffs.bleeding>0){
    const baseStat=type==='player'?unit.base.maxHp:unit.maxHp;
    const dmg=Math.max(6,Math.floor(baseStat*0.05)); // 최대HP 5% 출혈 데미지
    if(type==='player'){unit.base.hp-=dmg;spawnDmg(dmg,'player','phys');}
    else{unit.hp-=dmg;spawnDmg(dmg,'enemy','phys');}
    battleLog(`🩸 ${name} 출혈 피해 ${dmg} (남은 ${unit.buffs.bleeding-1}턴)`,'l-atk');
    unit.buffs.bleeding--;
  }
  updateBars();
}

function highlightActive(uid){
  document.querySelectorAll('.fighter').forEach(f=>f.classList.remove('active-turn'));
  const el=document.getElementById('fighter-'+uid);
  if(el)el.classList.add('active-turn');
  document.querySelectorAll('.hud-char').forEach(h=>h.classList.remove('active'));
  const hud=document.getElementById('hud-'+uid);
  if(hud)hud.classList.add('active');
}

function switchActionTab(tab,btn){
  document.querySelectorAll('.action-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  G.currentAction=tab;
  buildActionGrid(tab);
}

function buildActionGrid(tab){
  const el=document.getElementById('action-grid');
  if(!el)return;
  el.innerHTML='';
  const cid=G.battle.currentUnit;
  if(!cid)return;
  const c=CHARS[cid];

  if(tab==='attack'){
    // 기본 공격
    const atk=c.skills.find(s=>s.id==='atk');
    const def=c.skills.find(s=>s.id==='def');
    [atk,def].filter(Boolean).forEach(sk=>{
      const btn=makeActionBtn(sk.icon,sk.name,'',false,()=>useSkill(sk,cid));
      el.appendChild(btn);
    });
    // 전체 공격 (적 모두)
    const allAtk=makeActionBtn('💢','전체 공격','전체','',()=>allAttack(cid));
    el.appendChild(allAtk);
    // 대기
    const wait=makeActionBtn('⏸','대기','—','',()=>{battleLog(`${c.name} 대기`,'l-sys');setTimeout(advanceTurn,400);});
    el.appendChild(wait);
  } else if(tab==='skill'){
    const specials=c.skills.filter(s=>s.special);
    specials.forEach(sk=>{
      const onCd=sk.cd>0;
      const noMp=c.base.mp<sk.mpCost;
      const btn=makeActionBtn(sk.icon,sk.name,`MP${sk.mpCost}`,onCd||noMp,()=>useSkill(sk,cid));
      if(onCd){const cd=document.createElement('span');cd.className='act-cd';cd.textContent=`CD:${sk.cd}`;btn.appendChild(cd);}
      el.appendChild(btn);
    });
  } else if(tab==='item'){
    if(!G.inventory.length){
      el.innerHTML='<p style="font-size:12px;color:var(--text3);grid-column:span 4;padding:10px;">인벤토리가 비어 있습니다</p>';return;
    }
    G.inventory.forEach(({id,qty})=>{
      const item=ITEMS[id];if(!item||item.type!=='potion')return;
      const btn=makeActionBtn(item.icon,item.name,`x${qty}`,qty<=0,()=>useBattleItem(id));
      el.appendChild(btn);
    });
  } else if(tab==='other'){
    const flee=makeActionBtn('🏃','도망','',false,()=>{
      if(Math.random()<0.5){battleLog('도망 성공!','l-sys');setTimeout(()=>afterBattle(false),600);}
      else{battleLog('도망 실패!','l-enemy');setTimeout(advanceTurn,600);}
    });
    el.appendChild(flee);
  }
}

function makeActionBtn(icon,name,sub,disabled,cb){
  const btn=document.createElement('button');
  btn.className='action-btn';
  if(disabled)btn.disabled=true;
  btn.innerHTML=`<span class="act-icon">${icon}</span><span class="act-name">${name}</span>${sub?`<span class="act-cost">${sub}</span>`:''}`;
  btn.onclick=cb;
  return btn;
}

function useSkill(sk,cid){
  const c=CHARS[cid];
  if(c.base.mp<sk.mpCost){showToast('MP 부족');return;}
  if(sk.cd>0){showToast(`쿨다운 ${sk.cd}턴`);return;}
  c.base.mp-=sk.mpCost;
  sk.cd=sk.maxCd;
  // 타겟이 필요한 스킬
  if(['basicAtk','powerStrike','poison','backstab','charge','earthSmash','magicAtk'].includes(sk.fn)){
    enterTargetMode(sk,cid);
  } else {
    execPlayerSkill(sk,c,null);
    setTimeout(advanceTurn,600);
  }
}

function enterTargetMode(sk,cid){
  G.battle.targetMode=true;
  G.battle.pendingSkill={sk,cid};
  battleLog('대상을 선택하세요...','l-sys');
  document.querySelectorAll('#battle-enemies .fighter').forEach(f=>{
    if(!f.classList.contains('dead'))f.classList.add('targeted');
  });
}

function selectTarget(uid,type){
  if(!G.battle.targetMode)return;
  G.battle.targetMode=false;
  document.querySelectorAll('.fighter').forEach(f=>f.classList.remove('targeted'));
  const {sk,cid}=G.battle.pendingSkill;
  const c=CHARS[cid];
  const target=G.battle.enemies.find(e=>e.uid===uid);
  if(!target||target.hp<=0)return;
  execPlayerSkill(sk,c,target);
  checkBattleEnd(()=>setTimeout(advanceTurn,700));
}

function execPlayerSkill(sk,c,target){
  const atk=getTotalStat(c,'atk');
  let msg='', cls='l-atk';
  switch(sk.fn){
    case 'basicAtk':{
      if(!target)return;
      const dmg=getDmg(atk,1.0,target,false,c);
      target.hp-=dmg;
      spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} → ${target.name} 강타 ${dmg}`;
      break;}
    case 'powerStrike':{
      if(!target)return;
      const dmg=getDmg(atk,2.2,target,false,c);
      target.hp-=dmg;
      spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} → ${target.name} 분노의 일격! ${dmg}`;
      break;}
    case 'defend':
      c.buffs.defending=true;
      spawnDmg('방어!','player','heal');
      msg=`${c.name} 방어 태세!`;cls='l-sys';break;
    case 'knightDef':
      c.buffs.defending=true; c.buffs.shielded=true;
      msg=`${c.name} 기사 방패!`;cls='l-sys';break;
    case 'evasion':
      c.buffs.evasion=true;
      msg=`${c.name} 회피 준비!`;cls='l-sys';break;
    case 'drunkDefend':
      c.buffs.defending=true;
      msg=`${c.name} 술기운으로 버텨!`;cls='l-sys';break;
    case 'wildDefend':
      c.buffs.defending=true;
      msg=`${c.name} 야성의 직감!`;cls='l-sys';break;
    case 'magicShield':
      c.buffs.shielded=true;
      msg=`${c.name} 마법 막 전개!`;cls='l-sys';break;
    case 'ironwall':
      c.buffs.shielded=true;
      msg=`${c.name} 철벽!`;cls='l-sys';break;
    case 'poison':{
      if(!target)return;
      const dmg=getDmg(atk,0.8,target);
      target.hp-=dmg;target.buffs.poisoned=3;
      spawnDmg(dmg,'enemy','magic');
      msg=`${c.name} → ${target.name} 독 바늘! ${dmg}+독3턴`;cls='l-magic';break;}
    case 'weaken':
      G.battle.enemies.forEach(e=>{if(e.hp>0)e.buffs.weakened=2;});
      msg=`${c.name} 현혹! 적 전체 ATK -50% 2턴`;cls='l-magic';break;
    case 'analyze':
      c.buffs.boosted=1;
      msg=`${c.name} 정보 거래! 다음 공격 1.5배`;cls='l-magic';break;
    case 'backstab':{
      if(!target)return;
      const dmg=getDmg(atk,1.8,target);
      target.hp-=dmg; target.buffs.weakened=1;
      spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} → ${target.name} 뒤통수! ${dmg}+기절1턴`;break;}
    case 'spinSlash':
      G.battle.enemies.filter(e=>e.hp>0).forEach(e=>{
        const dmg=getDmg(atk,1.8,e);
        e.hp-=dmg; e.buffs.bleeding=2;
        spawnDmg(dmg,'enemy','phys');
      });
      msg=`${c.name} 회전 베기! 전체 공격+출혈`;break;
    case 'charge':{
      if(!target)return;
      let dmg=getDmg(atk,1.2,target); target.hp-=dmg;
      dmg=getDmg(atk,1.2,target); target.hp-=dmg;
      spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} 돌격! 2연속 공격`;break;}
    case 'magicAtk':{
      if(!target)return;
      const dmg=getDmg(atk,1.0,target,true);
      target.hp-=dmg;spawnDmg(dmg,'enemy','magic');
      msg=`${c.name} → ${target.name} 마법 화살 ${dmg}`;cls='l-magic';break;}
    case 'fireball':
      G.battle.enemies.filter(e=>e.hp>0).forEach(e=>{
        const dmg=getDmg(atk,2.5,e,true);
        e.hp-=dmg;spawnDmg(dmg,'enemy','magic');
      });
      msg=`${c.name} 화염구! 전체 ${atk*2}`;cls='l-magic';break;
    case 'timestop':
      G.battle.enemies.forEach(e=>{if(e.hp>0)e.buffs.weakened=Math.max(e.buffs.weakened||0,1);});
      msg=`${c.name} 시간 지연! 적 전체 스킵`;cls='l-magic';break;
    case 'earthSmash':{
      if(!target)return;
      const dmg=getDmg(atk,3.0,target);
      target.hp-=dmg;spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} 대지 강타! ${dmg}`;break;}
    case 'warCry':
      G.party.forEach(id=>{const p=CHARS[id];if(p&&p.base.hp>0)p.buffs.boosted=2;});
      msg=`${c.name} 오크의 포효! 파티 ATK +30%`;cls='l-magic';break;
    // ── 리라 (ch7) 스킬
    case 'stormArrow':
      G.battle.enemies.filter(e=>e.hp>0).forEach(e=>{
        const dmg=getDmg(atk,1.6,e,false,c);
        e.hp-=dmg; e.buffs.bleeding=Math.max(e.buffs.bleeding||0,2);
        spawnDmg(dmg,'enemy','phys');
      });
      msg=`${c.name} 폭풍 화살! 전체 공격+출혈2턴`;break;
    case 'paraArrow':{
      if(!target)return;
      const dmg=getDmg(atk,0.8,target,false,c);
      target.hp-=dmg; target.buffs.weakened=2;
      spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} → ${target.name} 마비 화살! ${dmg}+행동불능2턴`;cls='l-magic';break;}
    // ── 자인 (ch8) 스킬
    case 'darkShield':
      c.buffs.shielded=true;
      spawnDmg('암흑막!','player','heal');
      msg=`${c.name} 암흑 방패 전개!`;cls='l-sys';break;
    case 'darkSlash':{
      if(!target)return;
      const dmg=getDmg(atk,2.6,target,false,c);
      target.hp-=dmg; target.buffs.bleeding=3;
      spawnDmg(dmg,'enemy','phys');
      msg=`${c.name} → ${target.name} 어둠의 참격! ${dmg}+출혈3턴`;break;}
    case 'deathMark':{
      if(!target)return;
      const dmg=Math.floor((target.maxHp||target.hp)*0.2);
      target.hp-=dmg;
      spawnDmg(dmg,'enemy','magic');
      msg=`${c.name} → ${target.name} 죽음의 선고! 최대HP 20% 고정 ${dmg}`;cls='l-magic';break;}
    default:
      msg=`${c.name} 행동`;
  }
  battleLog(msg,cls);
  updateBars();
}

function allAttack(cid){
  const c=CHARS[cid];
  const atk=getTotalStat(c,'atk');
  G.battle.enemies.filter(e=>e.hp>0).forEach(e=>{
    const dmg=getDmg(atk,0.7,e);
    e.hp-=dmg;spawnDmg(dmg,'enemy','phys');
  });
  battleLog(`${c.name} 전체 공격!`,'l-atk');
  updateBars();
  checkBattleEnd(()=>setTimeout(advanceTurn,700));
}

function useBattleItem(itemId){
  // 파티원이 1명이면 바로, 여러 명이면 선택
  if(G.party.length===1){
    const c=CHARS[G.party[0]];
    useItem(itemId,c);
    updateBars();
    const item=ITEMS[itemId];
    battleLog(`${c.name} ${item?item.name:'아이템'} 사용!`,'l-heal');
    setTimeout(advanceTurn,600);
  } else {
    openBattleItemTargetModal(itemId);
  }
}

function openBattleItemTargetModal(itemId){
  const item=ITEMS[itemId]; if(!item)return;
  const ol=document.createElement('div');ol.className='modal-overlay';ol.id='battle-item-modal';
  const box=document.createElement('div');box.className='modal-box';
  box.innerHTML=`<div class="modal-title">🎯 ${item.name} — 사용 대상 선택</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${G.party.filter(cid=>CHARS[cid].base.hp>0).map(cid=>{
        const c=CHARS[cid];
        const hpPct=Math.round(c.base.hp/c.base.maxHp*100);
        return `<button class="npc-choice" onclick="confirmBattleItem('${itemId}','${cid}')">
          ${c.name} — HP ${c.base.hp}/${c.base.maxHp} (${hpPct}%)
        </button>`;
      }).join('')}
    </div>
    <div class="modal-btns"><button class="modal-btn cancel" onclick="document.getElementById('battle-item-modal').remove()">취소</button></div>`;
  ol.appendChild(box);
  document.body.appendChild(ol);
}

function confirmBattleItem(itemId,cid){
  const modal=document.getElementById('battle-item-modal');
  if(modal)modal.remove();
  const c=CHARS[cid]; if(!c)return;
  const item=ITEMS[itemId];
  useItem(itemId,c);
  updateBars();
  battleLog(`${c.name} ${item?item.name:'아이템'} 사용!`,'l-heal');
  setTimeout(advanceTurn,600);
}

// getDmg: calcDmg 래퍼 — 숫자만 반환, 속성 로그 포함
function getDmg(atk,mult,target,isMagic=false,attacker=null){
  const res=calcDmg(atk,mult,target,isMagic,attacker);
  if(res.elemMult>=1.4) battleLog(`⚡ 속성 유효! ×${res.elemMult.toFixed(1)}`,'l-magic');
  else if(res.elemMult<=0.8) battleLog(`🛡 속성 저항! ×${res.elemMult.toFixed(1)}`,'l-sys');
  return res.dmg;
}

function calcDmg(atk,mult,target,isMagic=false,attacker=null){
  let a=Math.round(atk*mult);
  // 공격자 부스트 버프 적용
  if(attacker&&attacker.buffs&&attacker.buffs.boosted>0){
    a=Math.round(a*1.3);
    attacker.buffs.boosted--;
  }
  if(target.buffs&&target.buffs.weakened>0) a=Math.round(a*1.3);
  const def=isMagic?Math.floor((target.def||0)*0.4):(target.def||0);

  // ── 속성 상성 보정 ──
  let elemMult=1.0;
  if(attacker&&attacker.element){
    const defElem=target.element||target.elementName||null;
    if(defElem) elemMult=getElementMultiplier(attacker.element, defElem);
  }
  if(elemMult!==1.0) a=Math.round(a*elemMult);

  const dmg=Math.max(1, a - def + Math.floor(Math.random()*6)-2);
  return {dmg, elemMult};
}

function spawnDmg(amount,side,type){
  const arena=document.getElementById('battle-arena');
  if(!arena)return;
  const el=document.createElement('div');
  el.className='dmg-num dmg-'+({phys:'phys',magic:'magic',heal:'heal'}[type]||'phys');
  el.textContent=amount;
  const x=side==='enemy'?Math.random()*120+160:Math.random()*80+20;
  const y=Math.random()*40+80;
  el.style.cssText=`left:${x}px;top:${y}px;`;
  arena.appendChild(el);
  setTimeout(()=>el.remove(),900);
}

// 적 행동
function doEnemyAction(enemy){
  const livingParty=G.party.filter(id=>CHARS[id]&&CHARS[id].base.hp>0);
  if(!livingParty.length){checkBattleEnd();return;}

  // 약화(행동 불능) 처리
  if(enemy.buffs.weakened>0){
    battleLog(`${enemy.name} 행동 불능!`,'l-sys');
    enemy.buffs.weakened--;
    setTimeout(()=>{document.getElementById('enemy-overlay').style.display='none';advanceTurn();},700);
    return;
  }

  const target=CHARS[livingParty[Math.floor(Math.random()*livingParty.length)]];
  const skillFn=enemy.skills[enemy.skillIdx%enemy.skills.length];
  enemy.skillIdx++;
  const isBoss=!!enemy.isBoss;
  // 보스는 배율 1.15배 추가 보정
  const bossMult=isBoss?1.15:1.0;

  let dmg=0, msg='', cls='l-enemy';

  switch(skillFn){
    // ── 기본 물리
    case 'basicAtk':
      dmg=calcEnemyDmg(enemy,target,1.0*bossMult);
      msg=`${enemy.name} → ${target.name} 공격 ${dmg}`;
      break;
    case 'bite':
      dmg=calcEnemyDmg(enemy,target,1.1*bossMult);
      msg=`${enemy.name} → ${target.name} 물기! ${dmg}`;
      break;
    case 'slam':
      dmg=calcEnemyDmg(enemy,target,1.2*bossMult);
      msg=`${enemy.name} → ${target.name} 강타! ${dmg}`;
      break;
    // ── 강습계
    case 'rush':
    case 'powerAtk':
      dmg=calcEnemyDmg(enemy,target,1.5*bossMult);
      msg=`${enemy.name} → ${target.name} 강습! ${dmg}`;
      break;
    // ── 원거리
    case 'boneThrow':
      dmg=calcEnemyDmg(enemy,target,0.8*bossMult);
      msg=`${enemy.name} 뼈 투척 ${dmg}`;
      break;
    // ── 독
    case 'poison':
      dmg=calcEnemyDmg(enemy,target,0.6*bossMult);
      target.buffs.poisoned=isBoss?4:3; // 보스는 독 지속 1턴 더
      msg=`${enemy.name} 독 공격! ${dmg} + 독${isBoss?4:3}턴`;
      break;
    // ── 거미줄
    case 'webShot':{
      // 보스면 랜덤 2명 동시 행동 불능
      if(isBoss){
        const targets=livingParty.slice().sort(()=>Math.random()-.5).slice(0,2);
        targets.forEach(id=>CHARS[id].buffs.weakened=Math.max(CHARS[id].buffs.weakened||0,1));
        msg=`${enemy.name} 광역 거미줄! 파티원 최대 2명 행동 불능`;
      } else {
        target.buffs.weakened=Math.max(target.buffs.weakened||0,1);
        msg=`${enemy.name} 거미줄! ${target.name} 행동 불능 1턴`;
      }
      break;
    }
    // ── 브레스 (전체 마법 공격) — 드래곤 핵심기
    case 'breathe':{
      const brMult=isBoss?(enemy._phase2Triggered?1.1:0.9):0.8;
      let totalDmg=0;
      livingParty.forEach(id=>{
        const p=CHARS[id];
        const d=calcEnemyDmg(enemy,p,brMult,true); // 마법 판정
        p.base.hp-=d; totalDmg+=d;
        spawnDmg(d,'player','magic');
      });
      msg=isBoss
        ? `🔥 ${enemy.name} 어둠의 브레스! 파티 전체 (합산 ${totalDmg})`
        : `${enemy.name} 브레스! 전체 공격`;
      cls='l-magic';
      // 보스 2페이즈 브레스는 출혈 추가
      if(isBoss&&enemy._phase2Triggered){
        livingParty.forEach(id=>{if(CHARS[id].base.hp>0)CHARS[id].buffs.bleeding=Math.max(CHARS[id].buffs.bleeding||0,2);});
        msg+=' + 출혈 2턴';
      }
      break;
    }
    // ── 꼬리 강타 — 드래곤 2페이즈 연타
    case 'tailSwipe':{
      if(isBoss&&enemy._phase2Triggered){
        // 2페이즈: 2연속 꼬리 강타
        const d1=calcEnemyDmg(enemy,target,1.1*bossMult);
        const d2=calcEnemyDmg(enemy,target,1.1*bossMult);
        target.base.hp-=(d1+d2);
        spawnDmg(d1,'player','phys'); setTimeout(()=>spawnDmg(d2,'player','phys'),250);
        msg=`🐉 ${enemy.name} 꼬리 2연타! ${target.name} ${d1}+${d2}`;
      } else {
        dmg=calcEnemyDmg(enemy,target,1.2*bossMult);
        msg=`${enemy.name} 꼬리 강타 ${dmg}`;
      }
      break;
    }
    // ── 짓밟기 (전체 물리) — 골렘 핵심기
    case 'stomp':{
      const stMult=isBoss?(enemy._phase2Triggered?1.4:1.1):1.0;
      let stTot=0;
      livingParty.forEach(id=>{
        const p=CHARS[id];
        const d=calcEnemyDmg(enemy,p,stMult);
        p.base.hp-=d; stTot+=d;
        spawnDmg(d,'player','phys');
      });
      msg=isBoss
        ? `🌋 ${enemy.name} 대지 짓밟기! 전체 ${stTot} (${enemy._phase2Triggered?'격노':'일반'})`
        : `${enemy.name} 짓밟기! 전체 공격`;
      // 보스 2페이즈 짓밟기는 방어 중인 유닛도 50%만 경감 (방어 관통)
      if(isBoss&&enemy._phase2Triggered){
        msg+=' [방어 관통]';
      }
      break;
    }
    // ── 포효 (버프/자기강화) — 1페이즈용
    case 'roar':
      if(!enemy.buffs)enemy.buffs={};
      enemy.buffs.boosted=(enemy.buffs.boosted||0)+2;
      msg=isBoss
        ? `📣 ${enemy.name} 분노의 포효! 다음 2턴 ATK 대폭 상승`
        : `${enemy.name} 포효! 공격력 상승`;
      cls='l-sys';
      break;
    // ── 철피 (방어 강화) — 골렘 1페이즈용
    case 'ironSkin':
      if(!enemy.buffs)enemy.buffs={};
      enemy.buffs.defending=true;
      enemy.buffs.shielded=true; // 보스는 완전 차단까지
      msg=isBoss
        ? `🗿 ${enemy.name} 철피 발동! 다음 공격 완전 차단`
        : `${enemy.name} 방어 강화!`;
      cls='l-sys';
      break;
    // ── 신규 적 스킬
    case 'backstabEnemy':{
      dmg=calcEnemyDmg(enemy,target,1.8*bossMult);
      target.buffs.weakened=Math.max(target.buffs.weakened||0,1);
      msg=`${enemy.name} → ${target.name} 기습! ${dmg}+기절1턴`;break;}
    case 'drainLife':{
      dmg=calcEnemyDmg(enemy,target,1.1*bossMult);
      enemy.hp=Math.min(enemy.maxHp, (enemy.hp||0)+Math.floor(dmg*0.4));
      msg=`${enemy.name} 흡혈! ${target.name} ${dmg} → 자신 HP 회복`;
      spawnDmg(Math.floor(dmg*0.4),'enemy','heal');
      cls='l-magic';break;}
    case 'hypnosis':{
      const hypTargets=livingParty.slice().sort(()=>Math.random()-.5).slice(0,isBoss?2:1);
      hypTargets.forEach(id=>CHARS[id].buffs.weakened=Math.max(CHARS[id].buffs.weakened||0,isBoss?2:1));
      msg=`${enemy.name} 최면! ${isBoss?'파티원 2명':'파티원 1명'} 행동불능${isBoss?'2':'1'}턴`;
      cls='l-magic';break;}
    case 'darkMagic':{
      const dmMult=isBoss?(enemy._phase2Triggered?1.3:1.0):0.9;
      livingParty.forEach(id=>{
        const p=CHARS[id];
        const d=calcEnemyDmg(enemy,p,dmMult,true);
        p.base.hp-=d; spawnDmg(d,'player','magic');
      });
      msg=isBoss?`☠ ${enemy.name} 어둠의 마법! 전체 공격`:`${enemy.name} 어둠 마법!`;
      cls='l-magic';break;}
    case 'curseAll':{
      livingParty.forEach(id=>{
        const p=CHARS[id];
        p.buffs.poisoned=Math.max(p.buffs.poisoned||0,3);
        p.buffs.weakened=Math.max(p.buffs.weakened||0,1);
      });
      msg=isBoss?`💀 ${enemy.name} 전체 저주! 파티 전원 독+행동불능`:`${enemy.name} 저주!`;
      cls='l-magic';break;}
    case 'holySmite':{
      dmg=calcEnemyDmg(enemy,target,1.4*bossMult);
      msg=`${enemy.name} 성스러운 심판! ${target.name} ${dmg}`;
      cls='l-magic';break;}
    default:
      dmg=calcEnemyDmg(enemy,target,1.0*bossMult);
      msg=`${enemy.name} 공격 ${dmg}`;
  }

  // 단일 대상 피해 처리 (dmg > 0 이고 전체 공격이 아닐 때)
  if(dmg>0&&target){
    if(target.buffs&&target.buffs.evasion){
      target.buffs.evasion=false;
      spawnDmg('MISS','player','miss');
      msg+=` → 회피!`;
    } else if(target.buffs&&target.buffs.shielded){
      target.buffs.shielded=false;
      spawnDmg('BLOCK','player','heal');
      msg+=` → 차단!`;
    } else {
      let finalDmg=dmg;
      // 보스 2페이즈 stomp는 방어 관통 처리됨 (위에서 직접 처리)
      if(target.buffs&&target.buffs.defending) finalDmg=Math.floor(dmg*0.5);
      target.base.hp-=finalDmg;
      spawnDmg(finalDmg,'player','phys');
      if(target.buffs&&target.buffs.defending){target.buffs.defending=false;}
    }
  }
  battleLog(msg,cls);
  updateBars();
  setTimeout(()=>{
    document.getElementById('enemy-overlay').style.display='none';
    checkBattleEnd(()=>setTimeout(advanceTurn,500));
  },800);
}

function calcEnemyDmg(enemy,target,mult,isMagic=false){
  let atk=Math.round(enemy.atk*mult);
  if(enemy.buffs&&enemy.buffs.boosted){atk=Math.round(atk*1.3);enemy.buffs.boosted=Math.max(0,(enemy.buffs.boosted||1)-1);}
  const def=isMagic?Math.floor((getTotalStat(target,'def')||0)*0.4):(getTotalStat(target,'def')||0);
  return Math.max(1,atk-def+Math.floor(Math.random()*4)-1);
}

function checkBattleEnd(cont){
  const allEnemiesDead=G.battle.enemies.every(e=>e.hp<=0);
  const allPartyDead=G.party.every(id=>CHARS[id].base.hp<=0);
  if(allEnemiesDead){
    battleVictory();return;
  }
  if(allPartyDead){
    battleDefeat();return;
  }
  if(cont)cont();
}

function battleVictory(){
  document.getElementById('enemy-overlay').style.display='none';
  // 보스 배너 제거
  const banner=document.getElementById('boss-banner-el');
  if(banner)banner.remove();

  let totalXp=0,totalGold=0;
  G.battle.enemies.forEach(e=>{totalXp+=e.xp;totalGold+=e.gold;});
  G.gold+=totalGold;
  // XP 분배
  const livingParty=G.party.filter(id=>CHARS[id].base.hp>0);
  livingParty.forEach(id=>{
    const c=CHARS[id];
    c.base.xp+=Math.floor(totalXp/livingParty.length);
    checkLevelUp(c);
  });

  // 재료 드롭
  const drops=rollMaterialDrop(G.battle.enemies);
  addMaterials(drops);
  const dropHtml=Object.entries(drops).length
    ? Object.entries(drops).map(([id,qty])=>{
        const mat=MATERIALS[id]||{icon:'📦',name:id};
        return `<div class="reward-row"><span class="reward-icon">${mat.icon}</span>${mat.name} x${qty}</div>`;
      }).join('')
    : '';

  // 보스 처치 시 특별 처리
  const wasBoss=G.battle.isBoss;
  if(wasBoss){
    G.dungeon.bossDefeated=true;
    document.getElementById('result-icon').textContent='🏆';
    document.getElementById('result-title').textContent='보스 처치!';
    document.getElementById('result-title').className='result-title win';
    document.getElementById('result-rewards').innerHTML=`
      <div class="reward-row"><span class="reward-icon">🏆</span>보스 처치 성공!</div>
      <div class="reward-row"><span class="reward-icon">🪙</span>골드 +${totalGold}</div>
      <div class="reward-row"><span class="reward-icon">⭐</span>경험치 +${totalXp}</div>
      ${dropHtml}
      ${livingParty.map(id=>`<div class="reward-row"><span class="reward-icon">✔</span>${CHARS[id].name} (HP: ${CHARS[id].base.hp}/${CHARS[id].base.maxHp})</div>`).join('')}`;
    setTimeout(()=>gotoScreen('s-result'),800);
    return;
  }

  // 결과 화면
  document.getElementById('result-icon').textContent='⭐';
  document.getElementById('result-title').textContent='전투 승리!';
  document.getElementById('result-title').className='result-title win';
  document.getElementById('result-rewards').innerHTML=`
    <div class="reward-row"><span class="reward-icon">🪙</span>골드 +${totalGold}</div>
    <div class="reward-row"><span class="reward-icon">⭐</span>경험치 +${totalXp}</div>
    ${dropHtml}
    ${livingParty.map(id=>`<div class="reward-row"><span class="reward-icon">${CHAR_SVG[CHARS[id].artKey]?'✔':'▸'}</span>${CHARS[id].name} (HP: ${CHARS[id].base.hp}/${CHARS[id].base.maxHp})</div>`).join('')}`;
  setTimeout(()=>gotoScreen('s-result'),800);
}

function battleDefeat(){
  document.getElementById('enemy-overlay').style.display='none';
  // 보스 배너 제거
  const banner=document.getElementById('boss-banner-el');
  if(banner)banner.remove();
  document.getElementById('result-icon').textContent='💀';
  document.getElementById('result-title').textContent='전투 패배...';
  document.getElementById('result-title').className='result-title lose';
  document.getElementById('result-rewards').innerHTML=`
    <div class="reward-row"><span class="reward-icon">💔</span>파티 전멸</div>
    <div class="reward-row" style="color:var(--text3);font-size:12px;">HP가 회복된 상태로 마을로 돌아갑니다</div>`;
  // 마을 귀환시 HP 일부 회복 (한 번만)
  G.party.forEach(id=>{CHARS[id].base.hp=Math.floor(CHARS[id].base.maxHp*0.3);});
  G.battle._isDefeat=true;
  setTimeout(()=>gotoScreen('s-result'),800);
}

function checkLevelUp(c){
  while(c.base.xp>=c.base.xpNext){
    c.base.xp-=c.base.xpNext;
    c.base.level++;
    c.base.xpNext=Math.floor(c.base.xpNext*1.5);
    c.base.maxHp+=c.grow.hp; c.base.hp=c.base.maxHp;
    c.base.atk+=c.grow.atk; c.base.def+=c.grow.def; c.base.spd+=c.grow.spd;
    showToast(`${c.name} 레벨업! Lv.${c.base.level} 🎉`);
  }
}

function afterBattle(win=true){
  if(G.battle._isDefeat){
    G.battle._isDefeat=false;
    // 보스 배너 정리
    const banner=document.getElementById('boss-banner-el');
    if(banner)banner.remove();
    gotoScreen('s-world');
    return;
  }
  if(win){
    const allDead=G.party.every(id=>CHARS[id].base.hp<=0);
    if(allDead){gotoScreen('s-world');return;}
    // 보스를 이겼으면 → 던전 클리어
    if(G.dungeon.bossDefeated){
      dungeonClear();
      return;
    }
    nextEncounter();
  } else {
    gotoScreen('s-world');
  }
}

function dungeonClear(){
  const banner=document.getElementById('boss-banner-el');
  if(banner)banner.remove();
  const ov=document.getElementById('battle-arena')?.querySelector('.boss-alert-overlay');
  if(ov)ov.remove();

  const dId=G.dungeon.dungeonId;
  let unlockMsg='';
  let rewardHtml='<div class="reward-row"><span class="reward-icon">🏆</span>던전 완전 공략!</div>';

  // 클리어 보너스 골드
  const bonusGold={dungeon1:300,dungeon2:600,dungeon3:800,dungeon4:1200,dungeon5:2000}[dId]||0;
  G.gold+=bonusGold;
  updateGoldDisplay();
  rewardHtml+=`<div class="reward-row"><span class="reward-icon">🪙</span>클리어 보너스 +${bonusGold} 골드</div>`;

  const unlock=(nid)=>{
    const n=MAP_NODES.find(n=>n.id===nid);
    if(n)n.unlocked=true;
    if(!G.world.unlockedNodes.includes(nid))G.world.unlockedNodes.push(nid);
  };
  const addChar=(cid)=>{
    if(!G.unlockedChars.includes(cid))G.unlockedChars.push(cid);
  };

  if(dId==='dungeon1'){
    unlock('dungeon2'); unlock('dungeon3');
    addChar('ch4');
    unlockMsg='어둠의 탑 · 왕성 지하 해금! 세라 영입 가능!';
    rewardHtml+=`<div class="reward-row"><span class="reward-icon">🗝</span>어둠의 탑 해금</div>
      <div class="reward-row"><span class="reward-icon">🗝</span>왕성 지하 해금</div>
      <div class="reward-row"><span class="reward-icon">⚔</span>세라 영입 가능</div>`;
  } else if(dId==='dungeon2'){
    unlock('dungeon5');
    addChar('ch5'); addChar('ch6');
    unlockMsg='피우·카그 영입 가능! 마왕의 성 반봉인 해제!';
    rewardHtml+=`<div class="reward-row"><span class="reward-icon">🔮</span>피우 영입 가능</div>
      <div class="reward-row"><span class="reward-icon">👹</span>카그 영입 가능</div>`;
  } else if(dId==='dungeon3'){
    unlock('dungeon4');
    addChar('ch7');
    unlockMsg='고대 유적 해금! 엘프 레인저 리라 영입 가능!';
    rewardHtml+=`<div class="reward-row"><span class="reward-icon">🗝</span>고대 유적 해금</div>
      <div class="reward-row"><span class="reward-icon">🏹</span>리라 영입 가능</div>`;
  } else if(dId==='dungeon4'){
    unlock('dungeon5');
    unlockMsg='마왕의 성 완전 해금!';
    rewardHtml+=`<div class="reward-row"><span class="reward-icon">💀</span>마왕의 성 해금</div>`;
  } else if(dId==='dungeon5'){
    addChar('ch8');
    unlockMsg='🎉 마왕을 쓰러뜨렸다! 자인 영입 가능! 왕국에 평화가 찾아왔다!';
    rewardHtml+=`<div class="reward-row"><span class="reward-icon">⚔</span>자인 영입 가능</div>
      <div class="reward-row"><span class="reward-icon">👑</span>왕국 평화 달성!</div>`;
  }

  if(unlockMsg) showToast(unlockMsg);

  // 퀘스트 완료 플래그 설정
  checkQuestFlags(dId);

  // dungeon5 클리어 → 엔딩 화면
  if(dId==='dungeon5'){
    G.battle._isDefeat=false;
    G.dungeon.bossDefeated=false;
    G.dungeon.encounter=0;
    setTimeout(()=>showEnding(), 600);
    return;
  }

  document.getElementById('result-icon').textContent='🏆';
  document.getElementById('result-title').textContent='던전 클리어!';
  document.getElementById('result-title').className='result-title win';
  document.getElementById('result-rewards').innerHTML=rewardHtml;
  G.battle._isDefeat=false;
  G.dungeon.bossDefeated=false;
  G.dungeon.encounter=0;
  gotoScreen('s-result');
}

// ══════════════════════════════════
// BOSS BATTLE SYSTEM
// ══════════════════════════════════

function showBossEntrance(dDef){
  const intro=dDef.bossIntro;
  const screen=document.createElement('div');
  screen.className='boss-entrance-screen';
  screen.id='boss-entrance';
  screen.innerHTML=`
    <div class="boss-entrance-title">⚠ ${intro.title} ⚠</div>
    <div class="boss-entrance-art">${intro.emoji}</div>
    <div class="boss-entrance-name">${intro.name}</div>
    <div class="boss-entrance-desc">${intro.desc.replace(/\n/g,'<br>')}</div>
    <button class="btn-boss-fight" onclick="startBossBattle()">⚔ 도전!</button>
    <button class="px-btn" style="padding:8px 16px;font-size:11px;color:var(--text3);" onclick="retreatFromBoss()">← 후퇴 (마을로)</button>
  `;
  document.body.appendChild(screen);
}

function retreatFromBoss(){
  const sc=document.getElementById('boss-entrance');
  if(sc)sc.remove();
  gotoScreen('s-world');
}

function startBossBattle(){
  const sc=document.getElementById('boss-entrance');
  if(sc)sc.remove();

  const dDef=G.dungeon.def;
  const bossId=dDef.boss;
  const base=ENEMIES[bossId];

  // 보스 HP 1.5배 강화
  const boss={
    ...base,
    uid:'boss_'+Date.now(),
    hp:Math.floor(base.hp*1.5), maxHp:Math.floor(base.hp*1.5),
    atk:Math.floor(base.atk*1.2),
    def:Math.floor(base.def*1.2),
    xp:Math.floor(base.xp*2),
    gold:Math.floor(base.gold*2),
    isBoss:true,
    phase:1,
    buffs:{defending:false,shielded:false,evasion:false,poisoned:0,bleeding:0,weakened:0,boosted:0},
    skillIdx:0,
  };

  G.dungeon.currentBoss=boss;
  G.dungeon.bossDefeated=false;
  startBattle([boss], true);
}

function renderBossBanner(boss){
  const old=document.getElementById('boss-banner-el');
  if(old)old.remove();
  if(!boss||!boss.isBoss)return;

  const hpPct=Math.max(0,Math.round(boss.hp/boss.maxHp*100));
  const phase=boss._phase2Triggered?2:1;
  const hpColor=hpPct>60?'linear-gradient(90deg,#ff2200,#ff6600)':
                hpPct>30?'linear-gradient(90deg,#dd0000,#ff2200)':
                         'linear-gradient(90deg,#990000,#dd0000)';

  // 현재 다음에 쓸 스킬 미리보기
  const patternNames={
    stomp:'짓밟기',breathe:'브레스',tailSwipe:'꼬리 강타',slam:'강타',
    ironSkin:'철피',roar:'포효',basicAtk:'공격',bite:'물기',
    powerAtk:'강습',rush:'강습',poison:'독',webShot:'거미줄',
  };
  const nextSkillKey=boss.skills[boss.skillIdx%boss.skills.length];
  const nextSkillName=patternNames[nextSkillKey]||nextSkillKey;

  const statusIcons=[];
  if(boss.buffs){
    if(boss.buffs.defending||boss.buffs.shielded) statusIcons.push('🛡방어중');
    if((boss.buffs.boosted||0)>0) statusIcons.push('💢강화중');
    if((boss.buffs.poisoned||0)>0) statusIcons.push(`☠독${boss.buffs.poisoned}`);
    if((boss.buffs.weakened||0)>0) statusIcons.push('💤행동불능');
  }

  const banner=document.createElement('div');
  banner.className='boss-banner';
  banner.id='boss-banner-el';
  banner.innerHTML=`
    <span class="boss-banner-label">⚠ BOSS</span>
    <div style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="boss-banner-name" style="font-size:12px;">${boss.name}</span>
        ${phase===2?`<span class="boss-phase-badge">🔥 PHASE 2</span>`:''}
        ${statusIcons.length?`<span style="font-size:10px;color:var(--text3);">${statusIcons.join(' ')}</span>`:''}
      </div>
      <div class="boss-hp-bar-wrap">
        <div class="boss-hp-bar-fill" id="boss-hp-fill" style="width:${hpPct}%;background:${hpColor}"></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
      <span style="font-size:11px;color:var(--red2);">${boss.hp}/${boss.maxHp}</span>
      <span style="font-size:10px;color:var(--text3);">다음: ${nextSkillName}</span>
    </div>
  `;
  const battleScreen=document.getElementById('s-battle');
  battleScreen.insertBefore(banner,battleScreen.firstChild);
}

function updateBossBanner(boss){
  if(!boss||!boss.isBoss)return;
  // 배너 전체 재렌더 (상태이상·다음스킬 반영 위해)
  renderBossBanner(boss);
  // 2페이즈 전환 체크
  const dDef=G.dungeon.def;
  const phase2Threshold=dDef?dDef.bossPhase2Hp:0.5;
  if(!boss._phase2Triggered && boss.hp/boss.maxHp<=phase2Threshold){
    boss._phase2Triggered=true;
    triggerBossPhase2(boss);
  }
}

function triggerBossPhase2(boss){
  const dDef=G.dungeon.def;

  // 보스별 커스텀 2페이즈 스킬로 교체
  if(dDef && dDef.bossPhase2Skills){
    boss.skills=dDef.bossPhase2Skills;
    boss.skillIdx=0; // 패턴 처음부터 재시작
  }

  // 2페이즈 전용 대사
  const msg=dDef&&dDef.bossPhase2Msg
    ? dDef.bossPhase2Msg
    : `💢 ${boss.name} — 2페이즈 전환! 패턴이 바뀐다!`;

  // ATK 추가 강화
  boss.atk=Math.floor(boss.atk*1.3);
  boss.def=Math.floor(boss.def*0.85); // 방어 약간 낮아짐 (공격적 변화)

  battleLog(msg,'l-enemy');
  showToast(`⚠ ${boss.name} 격분!`);

  // 화면 진동 연출
  const arena=document.getElementById('battle-arena');
  if(arena){
    arena.style.animation='bossShake .25s steps(4) 4';
    setTimeout(()=>arena.style.animation='',1100);
  }

  // 배틀 로그에 패턴 변화 경고
  setTimeout(()=>{
    const patternNames={
      stomp:'짓밟기(전체)',breathe:'브레스(전체)',tailSwipe:'꼬리 강타',
      slam:'강타',ironSkin:'철피(방어)',roar:'포효(강화)',
    };
    const dDef=G.dungeon.def;
    if(dDef&&dDef.bossPhase2Skills){
      const preview=[...new Set(dDef.bossPhase2Skills)].map(s=>patternNames[s]||s).join(' → ');
      battleLog(`📋 새 패턴: ${preview}`,'l-sys');
    }
  },600);
}

// ══════════════════════════════════
// FORGE SYSTEM (대장간: 강화 + 합성)
// ══════════════════════════════════

const MATERIALS = {
  iron_ore:    {id:'iron_ore',   name:'철광석',    icon:`<img src="assets/sprites/iron_ore.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, desc:'기본 강화 재료'},
  magic_stone: {id:'magic_stone',name:'마법석',    icon:`<img src="assets/sprites/magic_stone.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, desc:'마법 강화 재료'},
  monster_bone:{id:'monster_bone',name:'몬스터 뼈',icon:`<img src="assets/sprites/monster_bone.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, desc:'중급 강화 재료'},
  dragon_scale:{id:'dragon_scale',name:'용의 비늘',icon:`<img src="assets/sprites/dragon_scale.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, desc:'최고급 강화 재료'},
  dark_shard:  {id:'dark_shard', name:'어둠 파편',  icon:`<img src="assets/sprites/dark_shard.webp" style="width:1.6em;height:1.6em;vertical-align:middle;image-rendering:pixelated;" alt="">`, desc:'어둠 강화 재료'},
};

const UPGRADE_RECIPES = {
  iron_sword:[
    {lv:1,mats:{iron_ore:2},gold:100,    bonus:{atk:3}},
    {lv:2,mats:{iron_ore:4,magic_stone:1},gold:200,bonus:{atk:4}},
    {lv:3,mats:{iron_ore:6,magic_stone:2,monster_bone:1},gold:350,bonus:{atk:5}},
    {lv:4,mats:{magic_stone:3,monster_bone:2},gold:500,bonus:{atk:7}},
    {lv:5,mats:{magic_stone:4,dragon_scale:1},gold:800,bonus:{atk:10}},
  ],
  mage_staff:[
    {lv:1,mats:{magic_stone:2},gold:120,     bonus:{atk:2,maxMp:15}},
    {lv:2,mats:{magic_stone:4,iron_ore:1},gold:240,  bonus:{atk:3,maxMp:20}},
    {lv:3,mats:{magic_stone:5,monster_bone:1},gold:400,bonus:{atk:4,maxMp:25}},
    {lv:4,mats:{magic_stone:6,dragon_scale:1},gold:600,bonus:{atk:5,maxMp:30}},
    {lv:5,mats:{dragon_scale:2,dark_shard:1},gold:900,bonus:{atk:7,maxMp:40}},
  ],
  leather_armor:[
    {lv:1,mats:{iron_ore:2},gold:80,     bonus:{def:2}},
    {lv:2,mats:{iron_ore:3,monster_bone:1},gold:160, bonus:{def:3}},
    {lv:3,mats:{iron_ore:5,magic_stone:1},gold:280,  bonus:{def:4}},
    {lv:4,mats:{magic_stone:2,monster_bone:2},gold:420,bonus:{def:5}},
    {lv:5,mats:{magic_stone:3,dragon_scale:1},gold:650,bonus:{def:7}},
  ],
  iron_shield:[
    {lv:1,mats:{iron_ore:3},gold:120,     bonus:{def:3}},
    {lv:2,mats:{iron_ore:5,magic_stone:1},gold:240,  bonus:{def:4}},
    {lv:3,mats:{iron_ore:6,monster_bone:1},gold:380, bonus:{def:5}},
    {lv:4,mats:{magic_stone:3,monster_bone:2},gold:560,bonus:{def:6}},
    {lv:5,mats:{magic_stone:4,dragon_scale:1},gold:850,bonus:{def:9}},
  ],
  silver_ring:[
    {lv:1,mats:{magic_stone:1},gold:80,bonus:{spd:1}},
    {lv:2,mats:{magic_stone:2},gold:160,bonus:{spd:2}},
    {lv:3,mats:{magic_stone:3,monster_bone:1},gold:280,bonus:{spd:2,atk:2}},
    {lv:4,mats:{magic_stone:4,dragon_scale:1},gold:450,bonus:{spd:3,atk:3}},
    {lv:5,mats:{dragon_scale:2,dark_shard:1},gold:700,bonus:{spd:4,atk:5}},
  ],
  fire_gem:[
    {lv:1,mats:{magic_stone:2,iron_ore:1},gold:150,  bonus:{atk:3}},
    {lv:2,mats:{magic_stone:3,monster_bone:1},gold:300,bonus:{atk:4}},
    {lv:3,mats:{magic_stone:5,dragon_scale:1},gold:500,bonus:{atk:6}},
    {lv:4,mats:{dragon_scale:2,dark_shard:1},gold:750,bonus:{atk:8}},
    {lv:5,mats:{dragon_scale:3,dark_shard:2},gold:1100,bonus:{atk:12}},
  ],
};
// 강화 대상 아이템의 원본 스탯 스냅샷(스크립트 로드 시 1회). 세이브 로드 시 여기서 리셋 후 재적용해 중복/유령 강화를 막는다.
const _ITEM_BASE_STATS = {};
Object.keys(UPGRADE_RECIPES).forEach(id=>{ if(ITEMS[id]) _ITEM_BASE_STATS[id]=JSON.parse(JSON.stringify(ITEMS[id].stat||{})); });

const SYNTH_RECIPES = [
  {id:'synth1',name:'강철 검 합성',desc:'철제 검 +4 이상 → 강철 검 (ATK+20)',
    mats:{iron_ore:5},matCond:{iron_sword_lv:4},gold:500,
    result:{id:'steel_sword',name:'강철 검',icon:'⚔',type:'weapon',desc:'ATK +20',price:800,stat:{atk:20},slot:'weapon',jobs:['warrior','knight']}},
  {id:'synth2',name:'마왕의 지팡이 합성',desc:'마법 지팡이 +4 + 어둠 파편 2개 → 마왕의 지팡이',
    mats:{dark_shard:2},matCond:{mage_staff_lv:4},gold:800,
    result:{id:'demon_staff',name:'마왕의 지팡이',icon:'🪄',type:'weapon',desc:'ATK +12, MP +60',price:1500,stat:{atk:12,maxMp:60},slot:'weapon',jobs:['mage']}},
  {id:'synth3',name:'드래곤 갑옷 합성',desc:'가죽 갑옷 +3 + 용의 비늘 3개 → 드래곤 갑옷',
    mats:{dragon_scale:3},matCond:{leather_armor_lv:3},gold:1000,
    result:{id:'dragon_armor',name:'드래곤 갑옷',icon:'🐉',type:'armor',desc:'DEF +18, HP +40',price:2000,stat:{def:18,maxHp:40},slot:'armor'}},
  {id:'synth4',name:'마법석 합성',desc:'철광석 5개 → 마법석 2개',
    mats:{iron_ore:5},matCond:{},gold:50,resultMat:{id:'magic_stone',qty:2}},
  {id:'synth5',name:'몬스터 뼈 정제',desc:'몬스터 뼈 3개 + 마법석 2개 → 용의 비늘 1개',
    mats:{monster_bone:3,magic_stone:2},matCond:{},gold:200,resultMat:{id:'dragon_scale',qty:1}},
  {id:'synth6',name:'어둠 파편 합성',desc:'용의 비늘 2개 + 마법석 3개 → 어둠 파편 1개',
    mats:{dragon_scale:2,magic_stone:3},matCond:{},gold:400,resultMat:{id:'dark_shard',qty:1}},
];

// 재료 드롭 테이블
const MAT_DROP_TABLE = {
  goblin:    [{id:'iron_ore',rate:.4,qty:1},{id:'monster_bone',rate:.15,qty:1}],
  wolf:      [{id:'monster_bone',rate:.35,qty:1},{id:'iron_ore',rate:.2,qty:1}],
  skeleton:  [{id:'monster_bone',rate:.5,qty:1},{id:'iron_ore',rate:.25,qty:1}],
  orc:       [{id:'iron_ore',rate:.4,qty:2},{id:'monster_bone',rate:.4,qty:1}],
  spider:    [{id:'magic_stone',rate:.25,qty:1},{id:'monster_bone',rate:.2,qty:1}],
  golem:     [{id:'iron_ore',rate:.8,qty:3},{id:'magic_stone',rate:.4,qty:1}],
  dragon:    [{id:'dragon_scale',rate:.7,qty:2},{id:'magic_stone',rate:.6,qty:2}],
  bandit:    [{id:'iron_ore',rate:.3,qty:1},{id:'magic_stone',rate:.15,qty:1}],
  vampire:   [{id:'magic_stone',rate:.4,qty:1},{id:'dark_shard',rate:.2,qty:1}],
  lich:      [{id:'magic_stone',rate:.5,qty:2},{id:'dark_shard',rate:.35,qty:1}],
  guardian:  [{id:'iron_ore',rate:.6,qty:2},{id:'magic_stone',rate:.3,qty:1}],
  demon_lord:[{id:'dragon_scale',rate:1,qty:3},{id:'dark_shard',rate:1,qty:3},{id:'magic_stone',rate:1,qty:5}],
};

function rollMaterialDrop(enemies){
  const drops={};
  enemies.forEach(e=>{
    const table=MAT_DROP_TABLE[e.id];
    if(!table)return;
    table.forEach(entry=>{
      if(Math.random()<entry.rate) drops[entry.id]=(drops[entry.id]||0)+entry.qty;
    });
  });
  return drops;
}

function addMaterials(drops){
  if(!G.materials)G.materials={};
  Object.entries(drops).forEach(([id,qty])=>{G.materials[id]=(G.materials[id]||0)+qty;});
}

function getMaterialQty(id){return(G.materials&&G.materials[id])||0;}

let forgeMode='upgrade';
let forgeSelectedItem=null;
let forgeSelectedSynth=null;

function buildForge(){
  document.getElementById('forge-gold').textContent=G.gold;
  renderForgeLayout();
}

function renderForgeLayout(){
  const el=document.getElementById('forge-layout');
  if(!el)return;
  el.innerHTML=`
    <div class="forge-left">
      <div class="forge-tab-row">
        <button class="forge-tab ${forgeMode==='upgrade'?'active':''}" onclick="setForgeMode('upgrade')">⬆ 장비 강화</button>
        <button class="forge-tab ${forgeMode==='synth'?'active':''}" onclick="setForgeMode('synth')">🔮 합성</button>
        <button class="forge-tab ${forgeMode==='materials'?'active':''}" onclick="setForgeMode('materials')">📦 재료 창고</button>
      </div>
      <div id="forge-list"></div>
    </div>
    <div class="forge-right">
      <div class="forge-section-title">상세 정보</div>
      <div id="forge-detail-panel"><div style="padding:20px;text-align:center;color:var(--text3);font-size:12px;line-height:2.5;">← 좌측에서 항목을 선택하세요</div></div>
    </div>`;
  renderForgeList();
}

function setForgeMode(mode){
  forgeMode=mode;forgeSelectedItem=null;forgeSelectedSynth=null;renderForgeLayout();
}

function renderForgeList(){
  const el=document.getElementById('forge-list');if(!el)return;
  if(forgeMode==='upgrade'){
    const upgradeable=G.inventory.filter(({id})=>UPGRADE_RECIPES[id]);
    if(!upgradeable.length){el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:14px;word-break:keep-all;line-height:1.7;">강화 가능한 장비가 없습니다.<br>상점에서 장비를 구매하세요.</div>';return;}
    el.innerHTML='';
    upgradeable.forEach(({id})=>{
      const item=ITEMS[id];if(!item)return;
      const lv=G.upgradeLevels[id]||0;
      const maxLv=UPGRADE_RECIPES[id].length;
      const isMax=lv>=maxLv;
      const div=document.createElement('div');
      div.className='forge-item'+(forgeSelectedItem===id?' selected':'');
      div.innerHTML=`<span class="forge-item-icon">${item.icon}</span>
        <div class="forge-item-info">
          <div class="forge-item-name">${item.name} ${isMax?`<span class="forge-max-badge">MAX</span>`:`<span class="forge-lv-badge">+${lv}</span>`}</div>
          <div class="forge-item-desc">${item.desc}</div>
          <div class="forge-item-lv">${isMax?'최대 강화 완료':'강화 가능'} (${lv}/${maxLv})</div>
        </div>`;
      div.onclick=()=>{forgeSelectedItem=id;renderForgeList();renderUpgradeDetail(id);};
      el.appendChild(div);
    });
  } else if(forgeMode==='synth'){
    el.innerHTML='';
    SYNTH_RECIPES.forEach(recipe=>{
      const matsOk=Object.entries(recipe.mats).every(([mid,qty])=>getMaterialQty(mid)>=qty);
      const condOk=checkSynthCond(recipe);
      const canAfford=G.gold>=recipe.gold;
      const ok=matsOk&&condOk&&canAfford;
      const div=document.createElement('div');
      div.className='forge-item'+(forgeSelectedSynth===recipe.id?' selected':'');
      const resIcon=recipe.resultMat?MATERIALS[recipe.resultMat.id]?.icon||'📦':recipe.result?.icon||'❓';
      div.innerHTML=`<span class="forge-item-icon">${resIcon}</span>
        <div class="forge-item-info">
          <div class="forge-item-name">${recipe.name}</div>
          <div class="forge-item-desc">${recipe.desc}</div>
          <div class="forge-item-lv" style="color:${ok?'var(--green2)':'var(--red2)'}">${ok?'✔ 제작 가능':'✗ 조건 부족'}</div>
        </div>`;
      div.onclick=()=>{forgeSelectedSynth=recipe.id;renderForgeList();renderSynthDetail(recipe);};
      el.appendChild(div);
    });
  } else {
    if(!G.materials||!Object.keys(G.materials).filter(k=>G.materials[k]>0).length){
      el.innerHTML='<div style="font-size:12px;color:var(--text3);padding:14px;">재료가 없습니다.<br>전투에서 적을 처치하면 재료를 획득합니다.</div>';return;
    }
    el.innerHTML='<div class="forge-section-title">보유 재료</div>';
    Object.entries(G.materials).forEach(([id,qty])=>{
      if(!qty)return;
      const mat=MATERIALS[id];if(!mat)return;
      const div=document.createElement('div');div.className='forge-material';
      div.innerHTML=`<span class="forge-material-icon">${mat.icon}</span><span class="forge-material-name">${mat.name}</span><span class="forge-material-qty ok">x${qty}</span>`;
      el.appendChild(div);
    });
  }
}

function checkSynthCond(recipe){
  if(!recipe.matCond||!Object.keys(recipe.matCond).length)return true;
  return Object.entries(recipe.matCond).every(([key,val])=>{
    const [itemId]=key.split('_lv');return(G.upgradeLevels[itemId]||0)>=val;
  });
}

function calcUpgradeBonus(itemId,stat){
  const lv=G.upgradeLevels[itemId]||0;
  const recipes=UPGRADE_RECIPES[itemId];if(!recipes)return 0;
  let t=0;for(let i=0;i<lv;i++)t+=(recipes[i].bonus[stat]||0);return t;
}

function renderUpgradeDetail(itemId){
  const el=document.getElementById('forge-detail-panel');
  const item=ITEMS[itemId];if(!item){el.innerHTML='';return;}
  const lv=G.upgradeLevels[itemId]||0;
  const recipes=UPGRADE_RECIPES[itemId];
  const maxLv=recipes.length;
  if(lv>=maxLv){
    el.innerHTML=`<div class="forge-detail"><h3>${item.icon} ${item.name} <span class="forge-max-badge">MAX +${lv}</span></h3>
      <div class="forge-stat"><span>상태</span><span style="color:var(--green2)">✔ 최대 강화 완료</span></div></div>`;return;
  }
  const next=recipes[lv];
  const canAfford=G.gold>=next.gold;
  const matsOk=Object.entries(next.mats).every(([mid,qty])=>getMaterialQty(mid)>=qty);
  const matsHtml=Object.entries(next.mats).map(([mid,qty])=>{
    const mat=MATERIALS[mid]||{icon:'📦',name:mid};
    const have=getMaterialQty(mid);const ok=have>=qty;
    return `<div class="forge-material"><span class="forge-material-icon">${mat.icon}</span>
      <span class="forge-material-name">${mat.name}</span>
      <span class="forge-material-qty ${ok?'ok':'ng'}">${have}/${qty} ${ok?'✔':'✗'}</span></div>`;
  }).join('');
  const bonusHtml=Object.entries(next.bonus).map(([s,v])=>{
    const n={atk:'ATK',def:'DEF',spd:'SPD',maxHp:'최대HP',maxMp:'최대MP'}[s]||s;
    return `<div class="forge-stat"><span>${n}</span><span><span style="color:var(--text3)">+${calcUpgradeBonus(itemId,s)}</span> <span class="forge-arrow">→</span> <span class="stat-up">+${calcUpgradeBonus(itemId,s)+v}</span></span></div>`;
  }).join('');
  el.innerHTML=`<div class="forge-detail"><h3>${item.icon} ${item.name} <span class="forge-lv-badge">+${lv}</span> → <span class="forge-lv-badge">+${lv+1}</span></h3>${bonusHtml}</div>
    <div class="forge-section-title">필요 재료</div>${matsHtml}
    <div class="forge-cost-row"><span>🪙 비용</span><span class="${canAfford?'forge-cost-ok':'forge-cost-ng'}">${next.gold} (보유: ${G.gold})</span></div>
    <button class="btn-forge" ${matsOk&&canAfford?'':'disabled'} onclick="doUpgrade('${itemId}')">
      ${matsOk&&canAfford?`⚒ ${item.name} +${lv+1} 강화`:'재료·골드 부족'}</button>`;
}

function renderSynthDetail(recipe){
  const el=document.getElementById('forge-detail-panel');
  const matsOk=Object.entries(recipe.mats).every(([mid,qty])=>getMaterialQty(mid)>=qty);
  const condOk=checkSynthCond(recipe);const canAfford=G.gold>=recipe.gold;
  const matsHtml=Object.entries(recipe.mats).map(([mid,qty])=>{
    const mat=MATERIALS[mid]||{icon:'📦',name:mid};
    const have=getMaterialQty(mid);const ok=have>=qty;
    return `<div class="forge-material"><span class="forge-material-icon">${mat.icon}</span>
      <span class="forge-material-name">${mat.name}</span>
      <span class="forge-material-qty ${ok?'ok':'ng'}">${have}/${qty} ${ok?'✔':'✗'}</span></div>`;
  }).join('');
  const condHtml=recipe.matCond&&Object.keys(recipe.matCond).length
    ?Object.entries(recipe.matCond).map(([key,val])=>{
        const [itemId]=key.split('_lv');const item=ITEMS[itemId];const have=G.upgradeLevels[itemId]||0;const ok=have>=val;
        return `<div class="forge-stat"><span>${item?item.name:itemId} +${val} 필요</span><span class="${ok?'forge-cost-ok':'forge-cost-ng'}">${ok?'✔ 충족':'✗ 부족(+'+have+')'}</span></div>`;
      }).join(''):'';
  const resIcon=recipe.resultMat?MATERIALS[recipe.resultMat.id]?.icon||'📦':recipe.result?.icon||'❓';
  const resName=recipe.resultMat?`${MATERIALS[recipe.resultMat.id]?.name||recipe.resultMat.id} x${recipe.resultMat.qty}`:recipe.result?.name||'?';
  const canSynth=matsOk&&condOk&&canAfford;
  el.innerHTML=`<div class="forge-detail"><h3>🔮 ${recipe.name}</h3>
    <div class="forge-stat"><span>결과물</span><span>${resIcon} ${resName}</span></div>
    <div class="forge-stat"><span>설명</span><span style="color:var(--text3);font-size:11px;">${recipe.desc}</span></div>
    ${condHtml}</div>
    <div class="forge-section-title">필요 재료</div>${matsHtml}
    <div class="forge-cost-row"><span>🪙 비용</span><span class="${canAfford?'forge-cost-ok':'forge-cost-ng'}">${recipe.gold} (보유: ${G.gold})</span></div>
    <button class="btn-forge" ${canSynth?'':'disabled'} onclick="doSynth('${recipe.id}')">
      ${canSynth?'🔮 합성 실행':'조건·재료·골드 부족'}</button>`;
}

function doUpgrade(itemId){
  const lv=G.upgradeLevels[itemId]||0;const recipes=UPGRADE_RECIPES[itemId];
  if(!recipes||lv>=recipes.length){showToast('최대 강화 완료');return;}
  const recipe=recipes[lv];
  if(G.gold<recipe.gold){showToast('골드가 부족합니다');return;}
  if(!Object.entries(recipe.mats).every(([mid,qty])=>getMaterialQty(mid)>=qty)){showToast('재료가 부족합니다');return;}
  Object.entries(recipe.mats).forEach(([mid,qty])=>{G.materials[mid]-=qty;});
  G.gold-=recipe.gold;G.upgradeLevels[itemId]=(lv+1);
  if(!ITEMS[itemId].stat)ITEMS[itemId].stat={};
  Object.entries(recipe.bonus).forEach(([s,v])=>{ITEMS[itemId].stat[s]=(ITEMS[itemId].stat[s]||0)+v;});
  updateGoldDisplay();document.getElementById('forge-gold').textContent=G.gold;
  showToast(`⚒ ${ITEMS[itemId].name} +${lv+1} 강화 완료!`);
  renderForgeList();renderUpgradeDetail(itemId);
}

function doSynth(recipeId){
  const recipe=SYNTH_RECIPES.find(r=>r.id===recipeId);if(!recipe)return;
  if(G.gold<recipe.gold){showToast('골드가 부족합니다');return;}
  if(!Object.entries(recipe.mats).every(([mid,qty])=>getMaterialQty(mid)>=qty)){showToast('재료가 부족합니다');return;}
  if(!checkSynthCond(recipe)){showToast('조건이 충족되지 않았습니다');return;}
  Object.entries(recipe.mats).forEach(([mid,qty])=>{G.materials[mid]-=qty;});
  G.gold-=recipe.gold;
  if(recipe.resultMat){
    const{id,qty}=recipe.resultMat;if(!G.materials)G.materials={};G.materials[id]=(G.materials[id]||0)+qty;
    showToast(`🔮 합성! ${MATERIALS[id]?.name||id} x${qty} 획득!`);
  } else if(recipe.result){
    const res={...recipe.result};ITEMS[res.id]=res;
    const ex=G.inventory.find(i=>i.id===res.id);if(ex)ex.qty++;else G.inventory.push({id:res.id,qty:1});
    showToast(`🔮 합성! ${res.name} 획득!`);
  }
  updateGoldDisplay();document.getElementById('forge-gold').textContent=G.gold;
  renderForgeList();
  document.getElementById('forge-detail-panel').innerHTML='<div style="padding:20px;text-align:center;color:var(--green2);font-size:12px;">✔ 합성 성공!</div>';
}

// ══════════════════════════════════
// ENDING SCREEN
// ══════════════════════════════════
function showEnding(){
  // 파티 캐릭터 표시
  const partyRow=document.getElementById('ending-party-row');
  if(partyRow){
    partyRow.innerHTML='';
    G.party.forEach(cid=>{
      const c=CHARS[cid]; if(!c)return;
      const div=document.createElement('div');
      div.className='ending-char-card';
      div.innerHTML=`<div class="ending-char-sprite">${CHAR_SVG[c.artKey]||''}</div>
        <div class="ending-char-name">${c.name}</div>`;
      partyRow.appendChild(div);
    });
  }

  // 플레이 통계
  const statsBox=document.getElementById('ending-stats-box');
  if(statsBox){
    const totalLv=G.party.reduce((s,cid)=>s+(CHARS[cid]?.base.level||1),0);
    const avgLv=G.party.length?Math.round(totalLv/G.party.length):1;
    statsBox.innerHTML=`
      <div class="ending-stat-row"><span class="ending-stat-label">파티원</span><span class="ending-stat-val">${G.party.map(id=>CHARS[id]?.name||'').join(' · ')}</span></div>
      <div class="ending-stat-row"><span class="ending-stat-label">평균 레벨</span><span class="ending-stat-val">Lv.${avgLv}</span></div>
      <div class="ending-stat-row"><span class="ending-stat-label">보유 골드</span><span class="ending-stat-val">🪙 ${G.gold.toLocaleString()}</span></div>
      <div class="ending-stat-row"><span class="ending-stat-label">클리어 던전</span><span class="ending-stat-val">${G.world.unlockedNodes.filter(n=>n.startsWith('dungeon')).length} / 5</span></div>
      <div class="ending-stat-row"><span class="ending-stat-label">영입 캐릭터</span><span class="ending-stat-val">${G.unlockedChars.length} / 8</span></div>`;
  }

  // 스토리 텍스트 (파티 구성에 따라 동적)
  const storyEl=document.getElementById('ending-story-text');
  if(storyEl){
    const names=G.party.map(id=>CHARS[id]?.name||'').filter(Boolean).join(', ');
    storyEl.innerHTML=`마왕 마라키스가 쓰러졌다.<br>
      ${names}을(를) 비롯한 용사들의 활약으로<br>
      500년 만에 왕국에 진정한 평화가 찾아왔다.<br><br>
      <span style="color:var(--gold);font-size:11px;">카덴 장로의 말이 떠오른다.<br>
      "진정한 왕국의 빛은 영웅들의 용기에서 온다."</span>`;
  }

  gotoScreen('s-ending');

  // 별 파티클 캔버스
  setTimeout(()=>{
    const canvas=document.getElementById('ending-stars');
    if(!canvas)return;
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    const ctx=canvas.getContext('2d');
    const stars=Array.from({length:200},()=>({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      r:Math.random()*1.5+0.5,
      a:Math.random(),
      da:(Math.random()-0.5)*0.02,
    }));
    function drawStars(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      stars.forEach(s=>{
        s.a=Math.max(0.1,Math.min(1,s.a+s.da));
        if(s.a<=0.1||s.a>=1)s.da*=-1;
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,240,200,${s.a})`;
        ctx.fill();
      });
      requestAnimationFrame(drawStars);
    }
    drawStars();
  }, 100);
}

// ──────────────────────────────────
// ══════════════════════════════════
const SAVE_KEY_PREFIX='arkan_save_';
const MAX_SLOTS=3;

function buildSaveData(){
  const chars={};
  Object.keys(CHARS).forEach(cid=>{
    const c=CHARS[cid];
    chars[cid]={base:{...c.base},equip:{...c.equip},skills:c.skills.map(sk=>({id:sk.id,cd:sk.cd}))};
  });
  const nodes={};MAP_NODES.forEach(n=>nodes[n.id]=n.unlocked);
  return {
    version:16,savedAt:Date.now(),gold:G.gold,
    party:[...G.party],inventory:JSON.parse(JSON.stringify(G.inventory)),
    activeQuests:[...G.activeQuests],unlockedChars:[...G.unlockedChars],
    world:{unlockedNodes:[...G.world.unlockedNodes]},
    chars,nodes,
    materials:JSON.parse(JSON.stringify(G.materials||{})),
    upgradeLevels:{...G.upgradeLevels},
  };
}

function applySaveData(data){
  if(!data||(data.version!==16&&data.version!==15&&data.version!==14)) return false;
  G.gold=data.gold;G.party=[...data.party];
  G.inventory=JSON.parse(JSON.stringify(data.inventory));
  G.activeQuests=[...data.activeQuests];G.unlockedChars=[...data.unlockedChars];
  G.world.unlockedNodes=[...data.world.unlockedNodes];
  G.materials=JSON.parse(JSON.stringify(data.materials||{}));
  G.upgradeLevels={...data.upgradeLevels||{}};
  // 강화 레벨 → ITEMS 스탯 재반영
  Object.keys(UPGRADE_RECIPES).forEach(itemId=>{
    if(!ITEMS[itemId])return;
    // 원본으로 리셋 후 저장된 강화 레벨만큼만 적용(멱등 — 자기 세이브 재로드·연속 로드에도 안전)
    ITEMS[itemId].stat=JSON.parse(JSON.stringify(_ITEM_BASE_STATS[itemId]||{}));
    const lv=G.upgradeLevels[itemId]||0;const recipes=UPGRADE_RECIPES[itemId];
    for(let i=0;i<lv;i++){
      const bonus=recipes[i]?.bonus||{};
      Object.entries(bonus).forEach(([s,v])=>{ITEMS[itemId].stat[s]=(ITEMS[itemId].stat[s]||0)+v;});
    }
  });
  Object.keys(data.chars).forEach(cid=>{
    if(!CHARS[cid])return;
    const saved=data.chars[cid];
    Object.assign(CHARS[cid].base,saved.base);Object.assign(CHARS[cid].equip,saved.equip);
    saved.skills.forEach(s=>{const sk=CHARS[cid].skills.find(k=>k.id===s.id);if(sk)sk.cd=s.cd;});
  });
  Object.keys(data.nodes).forEach(nid=>{
    const n=MAP_NODES.find(x=>x.id===nid);if(n)n.unlocked=data.nodes[nid];
  });
  return true;
}

function saveToSlot(slot){
  const data=buildSaveData();
  const partyNames=data.party.map(id=>CHARS[id]?CHARS[id].name:'?').join('·');
  data._meta={
    partyNames,
    gold:data.gold,
    savedAtStr:new Date(data.savedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}),
  };
  try{
    localStorage.setItem(SAVE_KEY_PREFIX+slot, JSON.stringify(data));
    showToast(`💾 슬롯 ${slot}에 저장 완료!`);
    return true;
  }catch(e){
    showToast('저장 실패: '+e.message);
    return false;
  }
}

function loadFromSlot(slot){
  try{
    const raw=localStorage.getItem(SAVE_KEY_PREFIX+slot);
    if(!raw)return false;
    const data=JSON.parse(raw);
    if(!applySaveData(data)){showToast('저장 데이터 버전이 맞지 않습니다');return false;}
    showToast(`📂 슬롯 ${slot} 불러오기 완료!`);
    return true;
  }catch(e){
    showToast('불러오기 실패: '+e.message);
    return false;
  }
}

function deleteSlot(slot){
  localStorage.removeItem(SAVE_KEY_PREFIX+slot);
  showToast(`🗑 슬롯 ${slot} 삭제됨`);
}

function getSlotMeta(slot){
  try{
    const raw=localStorage.getItem(SAVE_KEY_PREFIX+slot);
    if(!raw)return null;
    const data=JSON.parse(raw);
    return data._meta||null;
  }catch(e){return null;}
}

function openSaveModal(mode='save'){
  const old=document.getElementById('save-modal-root');
  if(old)old.remove();

  const overlay=document.createElement('div');
  overlay.className='save-modal-overlay';
  overlay.id='save-modal-root';

  const isLoadOnly=(mode==='load-title');
  const modeLabel=isLoadOnly?'불러오기':'저장 / 불러오기';

  let slotsHtml='';
  for(let s=1;s<=MAX_SLOTS;s++){
    const meta=getSlotMeta(s);
    if(meta){
      slotsHtml+=`
        <div class="save-slot">
          <span class="save-slot-num">${s}</span>
          <div class="save-slot-info">
            <div class="save-slot-name">🗡 ${meta.partyNames}</div>
            <div class="save-slot-detail">🪙${meta.gold} · ${meta.savedAtStr}</div>
          </div>
          <div class="save-slot-actions">
            ${isLoadOnly?'':`<button class="btn-save-act save" onclick="doSave(${s})">저장</button>`}
            <button class="btn-save-act load" onclick="doLoad(${s})">불러오기</button>
            ${isLoadOnly?'':`<button class="btn-save-act del" onclick="doDel(${s})">삭제</button>`}
          </div>
        </div>`;
    } else {
      slotsHtml+=`
        <div class="save-slot empty">
          <span class="save-slot-num">${s}</span>
          <div class="save-slot-info">
            <div class="save-slot-name">— 빈 슬롯 —</div>
          </div>
          <div class="save-slot-actions">
            ${isLoadOnly?'':`<button class="btn-save-act save" onclick="doSave(${s})">저장</button>`}
          </div>
        </div>`;
    }
  }

  overlay.innerHTML=`
    <div class="save-modal-box">
      <div class="save-modal-title">💾 ${modeLabel}</div>
      ${slotsHtml}
      <button class="save-modal-close" onclick="closeSaveModal()">✕ 닫기</button>
    </div>`;
  document.body.appendChild(overlay);
  // 배경 클릭으로 닫기
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeSaveModal();});
}

function closeSaveModal(){
  const m=document.getElementById('save-modal-root');
  if(m)m.remove();
}

function doSave(slot){
  saveToSlot(slot);
  closeSaveModal();
  setTimeout(()=>openSaveModal('save'),300);
}

function doLoad(slot){
  if(loadFromSlot(slot)){
    closeSaveModal();
    updateGoldDisplay();
    gotoScreen('s-world');
  }
}

function doDel(slot){
  if(confirm(`슬롯 ${slot}을 삭제하시겠습니까?`)){
    deleteSlot(slot);
    closeSaveModal();
    setTimeout(()=>openSaveModal('save'),300);
  }
}

// ──────────────────────────────────
function showToast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2200);
}

// 별 비활성화됨 (제거 완료)

// ══════════════════════════════════
// CODEX — 인물도감 + 몬스터도감
// ══════════════════════════════════

const MONSTER_LORE = {
  goblin:{
    fullName:'고블린 (Goblin)',
    desc:'아르칸 서쪽 폐허에 떼를 지어 사는 소형 마물. 혼자서는 약하지만 무리를 이루면 위험하다. 날카로운 단검을 주무기로 쓰며 기습을 즐긴다.',
    weakness:'마법 공격에 취약. 단독 교전 시 쉽게 처치 가능.',
    habitat:'폐허 던전 1~2층',
    rank:'D', rankColor:'#66ffaa',
  },
  wolf:{
    fullName:'야생 늑대 (Wild Wolf)',
    desc:'짙은 회색 털의 야생 늑대. 날카로운 이빨과 압도적인 속도로 기습을 선호한다. SPD가 높아 선제권을 빼앗기기 쉽다.',
    weakness:'출혈 도트 데미지가 효과적. 독 바늘 스킬에 취약.',
    habitat:'폐허 던전 1~3층',
    rank:'D', rankColor:'#66ffaa',
  },
  skeleton:{
    fullName:'해골 병사 (Skeleton Soldier)',
    desc:'한때 이 왕국을 지키던 병사들의 유골. 어둠의 기운에 의해 부활해 끝없이 배회한다. 뼈를 투척하는 원거리 공격도 구사한다.',
    weakness:'DEF가 높지만 HP는 낮다. 마법 공격으로 빠르게 처치.',
    habitat:'폐허 던전 2~4층',
    rank:'C', rankColor:'#77bbff',
  },
  spider:{
    fullName:'독거미 (Poison Spider)',
    desc:'독을 품은 대형 거미. 거미줄로 상대의 행동을 봉인하고 독 공격으로 서서히 파티를 약화시킨다. 빠른 속도가 가장 위협적인 특성.',
    weakness:'광역 공격으로 한 번에 처리할 것. 해독제 지참 강력 권장.',
    habitat:'폐허 던전 4층, 어둠의 탑 2층',
    rank:'C', rankColor:'#77bbff',
  },
  orc:{
    fullName:'오크 전사 (Orc Warrior)',
    desc:'강인한 체력과 높은 공격력을 가진 중형 마물. 포효로 자신을 강화한다. 정면 돌파를 즐기며 후퇴를 모른다. 갑옷을 입고 있어 물리 방어가 강력하다.',
    weakness:'속도가 느려 선제권 확보 유리. 약화(현혹) 디버프가 효과적.',
    habitat:'폐허 던전 3층, 어둠의 탑 1~4층',
    rank:'B', rankColor:'#ffaa55',
  },
  golem:{
    fullName:'석상 골렘 (Stone Golem)',
    desc:'고대 마법으로 만들어진 수호자. 가슴에 새겨진 룬 문자가 동력원이다. 전신이 돌로 이루어져 물리 방어가 극도로 높으며, 대지를 울리는 짓밟기로 파티 전원에게 피해를 입힌다.',
    weakness:'마법 공격으로 룬 문자를 파괴하면 약화. 철벽·방패 스킬로 짓밟기를 버틸 것.',
    habitat:'폐허 던전 최심층 (보스)',
    rank:'A', rankColor:'#ff8899',
  },
  dragon:{
    fullName:'어둠 드래곤 (Shadow Dragon)',
    desc:'어둠의 탑 최하층에 봉인된 고대 드래곤. 보라빛 눈동자와 두 개의 날카로운 뿔이 특징. 파티 전원을 덮치는 브레스와 강력한 꼬리 강타로 파티를 순식간에 와해시킨다. 전설에 따르면 아르칸 왕국 창건 이전부터 존재했다 전해진다.',
    weakness:'브레스 직전 방어 스킬 필수. 피우의 시간 지연 스킬이 극도로 효과적.',
    habitat:'어둠의 탑 최심층 (보스)',
    rank:'S', rankColor:'#c080ff',
  },
};

const MONSTER_ORDER=['goblin','wolf','skeleton','spider','orc','golem','dragon'];
if(!G.discoveredMonsters) G.discoveredMonsters={};

// 전투 시작 시 자동 발견 처리 — nextEncounter 이후 호출
const _orig_startBattle = startBattle;
startBattle = function(enemies){
  enemies.forEach(e=>{ G.discoveredMonsters[e.id]=true; });
  _orig_startBattle(enemies);
};

let codexTab='char';
let codexSelChar=null;
let codexSelMon=null;

function buildCodex(){
  const listEl=document.getElementById('codex-list');
  if(!listEl) return;

  // 탭 헤더
  listEl.innerHTML=`
    <div style="display:flex;gap:6px;margin-bottom:14px;">
      <button class="action-tab ${codexTab==='char'?'active':''}" style="flex:1;font-size:12px;padding:8px 2px;"
        onclick="codexTab='char';buildCodex();">👤 인물 (${Object.keys(CHARS).length})</button>
      <button class="action-tab ${codexTab==='monster'?'active':''}" style="flex:1;font-size:12px;padding:8px 2px;"
        onclick="codexTab='monster';buildCodex();">👾 몬스터 (${Object.keys(G.discoveredMonsters).length}/${MONSTER_ORDER.length})</button>
    </div>`;

  if(codexTab==='char'){
    Object.values(CHARS).forEach(c=>{
      const unlocked=G.unlockedChars.includes(c.id);
      const inParty=G.party.includes(c.id);
      const isActive=codexSelChar===c.id;
      const entry=document.createElement('div');
      entry.className='codex-entry'+(isActive?' active':'');
      const svg=CHAR_SVG[c.artKey]||'';
      const statusText=inParty?'★ 파티 합류':unlocked?'영입 가능':'???';
      const statusCls=inParty?'party':unlocked?'met':'unmet';
      entry.innerHTML=`
        <div class="codex-entry-thumb">${unlocked?svg:'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:1.5rem;color:#333;">?</div>'}</div>
        <div>
          <div class="codex-entry-name">${unlocked?c.name:'???'}</div>
          <div class="codex-entry-role">${unlocked?c.role:'미해금'}</div>
          <div class="codex-entry-status ${statusCls}">${statusText}</div>
        </div>`;
      entry.onclick=()=>{ codexSelChar=c.id; buildCodex(); showCodexChar(c.id); };
      listEl.appendChild(entry);
    });
    // 초기 선택
    if(!codexSelChar) codexSelChar=Object.keys(CHARS)[0];
    showCodexChar(codexSelChar);

  } else {
    MONSTER_ORDER.forEach(mid=>{
      const known=!!G.discoveredMonsters[mid];
      const base=ENEMIES[mid]; const lore=MONSTER_LORE[mid];
      const isActive=codexSelMon===mid;
      const entry=document.createElement('div');
      entry.className='codex-entry'+(isActive?' active':'')+(known?'':' locked-entry');
      entry.innerHTML=`
        <div class="codex-entry-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">
          ${known?base.emoji:'?'}
        </div>
        <div>
          <div class="codex-entry-name">${known?base.name:'???'}</div>
          <div class="codex-entry-role">${known?lore.habitat:'미조우'}</div>
          <div class="codex-entry-status ${known?'met':'unmet'}">${known?`<span style="color:${lore.rankColor}">★ ${lore.rank}급</span>`:'전투 미경험'}</div>
        </div>`;
      if(known) entry.onclick=()=>{ codexSelMon=mid; buildCodex(); showCodexMonster(mid); };
      listEl.appendChild(entry);
    });
    // 초기 선택 — 발견한 것 중 첫 번째
    const firstKnown=MONSTER_ORDER.find(m=>G.discoveredMonsters[m]);
    if(!codexSelMon&&firstKnown) codexSelMon=firstKnown;
    if(codexSelMon) showCodexMonster(codexSelMon);
    else document.getElementById('codex-detail').innerHTML=`
      <div class="codex-empty"><div class="codex-empty-icon">👾</div>
      <div class="codex-empty-text">아직 조우한 몬스터가 없습니다.<br>던전에 입장하면 도감이 채워집니다!</div></div>`;
  }

  // 수집 카운트 업데이트
  const countEl=document.getElementById('codex-count');
  if(countEl){
    const total=Object.keys(CHARS).length+MONSTER_ORDER.length;
    const got=Object.keys(CHARS).length+Object.keys(G.discoveredMonsters).length;
    countEl.textContent=`${got} / ${total} 수집`;
  }
}

function showCodexChar(cid){
  const c=CHARS[cid]; if(!c) return;
  const el=document.getElementById('codex-detail'); if(!el) return;
  const unlocked=G.unlockedChars.includes(c.id);
  const inParty=G.party.includes(c.id);
  const svg=CHAR_SVG[c.artKey]||'';

  if(!unlocked){
    el.innerHTML=`
      <div class="codex-empty">
        <div class="codex-empty-icon">🔒</div>
        <div class="codex-empty-text">아직 만나지 못한 인물입니다.<br><span style="color:var(--gold2);">${c.recruit.condition}</span></div>
      </div>`;
    return;
  }

  // 성장 수치 최대값 기준 (카그 기준)
  const maxGrow={hp:28,atk:5,def:3,spd:1};
  const growBars=['hp','atk','def','spd'].map(stat=>{
    const pct=Math.min(100,Math.round((c.grow[stat]||0)/maxGrow[stat]*100));
    const colors={hp:'var(--hp)',atk:'#ffaa55',def:'var(--blue2)',spd:'var(--green2)'};
    const labels={hp:'HP 성장',atk:'ATK 성장',def:'DEF 성장',spd:'SPD 성장'};
    return `<div class="codex-grow-bar-wrap">
      <div class="codex-grow-label"><span>${labels[stat]}</span><span style="color:var(--gold2)">+${c.grow[stat]}/레벨</span></div>
      <div class="codex-grow-bar"><div class="codex-grow-fill" style="width:${pct}%;background:${colors[stat]};"></div></div>
    </div>`;
  }).join('');

  const jobLabel={warrior:'⚒ 전사',knight:'⚔ 기사',rogue:'🗡 도적',mage:'🔮 마법사'};

  el.innerHTML=`
    <div class="codex-hero-banner">
      <div class="codex-portrait">${svg}</div>
      <div class="codex-hero-info">
        <div class="codex-hero-name">${c.name}</div>
        <div class="codex-hero-npc">${c.npc}</div>
        <div class="codex-hero-element" style="border-color:${c.element.color};color:${c.element.color};">
          ${c.element.icon} ${c.element.name} 속성 &nbsp;·&nbsp; ${jobLabel[c.job]||c.job}
        </div>
        <div class="codex-hero-keywords">"${c.keywords}"</div>
        <div class="codex-hero-story">${c.story}</div>
      </div>
    </div>

    <div class="codex-section-title">기본 스탯 (Lv.1)</div>
    <div class="codex-stat-grid">
      <div class="codex-stat-box"><div class="codex-stat-label">HP</div><div class="codex-stat-value" style="color:var(--hp)">${c.base.maxHp}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">MP</div><div class="codex-stat-value" style="color:var(--mp)">${c.base.maxMp}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">ATK</div><div class="codex-stat-value" style="color:#ffaa55">${c.base.atk}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">DEF</div><div class="codex-stat-value" style="color:var(--blue2)">${c.base.def}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">SPD</div><div class="codex-stat-value" style="color:var(--green2)">${c.base.spd}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">현재 Lv</div><div class="codex-stat-value" style="color:var(--gold2)">${c.base.level}</div></div>
    </div>

    <div class="codex-section-title">레벨업 성장</div>
    <div style="margin-bottom:16px;">${growBars}</div>

    <div class="codex-section-title">스킬 목록</div>
    ${c.skills.map(sk=>`
      <div class="codex-skill-card ${sk.special?'special':''}">
        <div class="codex-skill-icon">${sk.icon}</div>
        <div class="codex-skill-info">
          <div class="codex-skill-name">${sk.name} ${sk.special?'<span style="font-size:10px;color:var(--purple2);">[특수]</span>':''}</div>
          <div class="codex-skill-desc">${sk.desc}</div>
          <div class="codex-skill-meta">
            <span class="codex-skill-tag type-${sk.type}">${sk.type}</span>
            ${sk.mpCost>0?`<span class="codex-skill-mp">MP ${sk.mpCost}</span>`:'<span style="font-size:11px;color:var(--text3);">MP 0</span>'}
            ${sk.maxCd>0?`<span class="codex-skill-cd">쿨다운 ${sk.maxCd}턴</span>`:''}
          </div>
        </div>
      </div>`).join('')}

    <div class="codex-section-title">영입 정보</div>
    <div class="codex-recruit-box ${inParty?'':''}">
      <div style="font-size:13px;color:${inParty?'var(--green2)':'var(--gold2)'};">
        ${inParty?'★ 현재 파티 합류 중':'영입 가능'}
      </div>
      <div style="font-size:12px;color:var(--text3);margin-top:8px;">조건: ${c.recruit.condition}</div>
      ${c.recruit.cost>0?`<div style="font-size:12px;color:var(--gold);margin-top:4px;">비용: 🪙 ${c.recruit.cost} 골드</div>`:''}
    </div>`;
}

function showCodexMonster(mid){
  const base=ENEMIES[mid]; const lore=MONSTER_LORE[mid];
  if(!base||!lore) return;
  const el=document.getElementById('codex-detail'); if(!el) return;
  const known=!!G.discoveredMonsters[mid];
  if(!known){
    el.innerHTML=`<div class="codex-empty"><div class="codex-empty-icon">❓</div>
      <div class="codex-empty-text">아직 조우하지 않은 몬스터입니다.</div></div>`;
    return;
  }
  const svgArt=ENEMY_SVG[mid]||'';

  el.innerHTML=`
    <div class="codex-hero-banner">
      <div class="codex-portrait" style="display:flex;align-items:center;justify-content:center;">
        ${svgArt?`<div style="width:100%;height:100%;">${svgArt}</div>`:`<div style="font-size:4rem;">${base.emoji}</div>`}
      </div>
      <div class="codex-hero-info">
        <div class="codex-hero-name">${lore.fullName}</div>
        <div class="codex-hero-npc" style="margin-bottom:10px;">서식지: ${lore.habitat}</div>
        <div class="codex-hero-element" style="border-color:${lore.rankColor};color:${lore.rankColor};">
          ★ ${lore.rank}급 마물
        </div>
        <div class="codex-hero-story" style="margin-top:12px;">${lore.desc}</div>
      </div>
    </div>

    <div class="codex-section-title">전투 스탯</div>
    <div class="codex-stat-grid">
      <div class="codex-stat-box"><div class="codex-stat-label">HP</div><div class="codex-stat-value" style="color:var(--hp)">${base.hp}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">ATK</div><div class="codex-stat-value" style="color:#ffaa55">${base.atk}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">DEF</div><div class="codex-stat-value" style="color:var(--blue2)">${base.def}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">SPD</div><div class="codex-stat-value" style="color:var(--green2)">${base.spd}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">경험치</div><div class="codex-stat-value" style="color:var(--xp)">${base.xp}</div></div>
      <div class="codex-stat-box"><div class="codex-stat-label">골드</div><div class="codex-stat-value" style="color:var(--gold2)">${base.gold}</div></div>
    </div>

    <div class="codex-section-title">사용 스킬</div>
    ${[...new Set(base.skills)].map(sk=>{
      const skNames={
        basicAtk:'기본 공격',bite:'물기',slam:'강타',rush:'돌진',powerAtk:'강력 공격',
        boneThrow:'뼈 투척',poison:'독 공격',webShot:'거미줄',breathe:'브레스 (전체)',
        tailSwipe:'꼬리 강타',stomp:'짓밟기 (전체)',roar:'포효 (강화)',ironSkin:'철피 (방어)',
      };
      const skIcons={
        basicAtk:'⚔',bite:'🦷',slam:'💥',rush:'💨',powerAtk:'💢',
        boneThrow:'🦴',poison:'☠',webShot:'🕸',breathe:'🔥',
        tailSwipe:'💫',stomp:'🌋',roar:'📣',ironSkin:'🛡',
      };
      return `<div class="codex-skill-card">
        <div class="codex-skill-icon">${skIcons[sk]||'❓'}</div>
        <div class="codex-skill-info">
          <div class="codex-skill-name">${skNames[sk]||sk}</div>
        </div>
      </div>`;
    }).join('')}

    <div class="codex-section-title">공략 포인트</div>
    <div style="padding:14px 16px;background:linear-gradient(135deg,#1a2a10,#0e1e08);border-left:3px solid var(--green);font-size:13px;color:var(--text2);line-height:2.5;">
      💡 ${lore.weakness}
    </div>`;
}



updateGoldDisplay();
