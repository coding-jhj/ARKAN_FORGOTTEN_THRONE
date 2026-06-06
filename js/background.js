/* ARKAN: procedural pixel-art background renderer */
/* ════════════════════════════════
   픽셀 아트 배경 v4 — 32px 타일, 진짜 픽셀아트 배경
   마인크래프트/스타듀밸리급 뚜렷한 블록 텍스처
════════════════════════════════ */
(function(){
  const B=32;

  function ri(a,b){return Math.floor(a+Math.random()*(b-a));}
  function hexRgb(h){
    h=h.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  function cl(v){return Math.max(0,Math.min(255,Math.round(v)));}
  function rgb(r,g,b){return`rgb(${cl(r)},${cl(g)},${cl(b)})`;}

  // 의도적 픽셀아트 타일 — 노이즈 최소화, 선명한 경계 강조
  function tile(ctx,x,y,color,variant=0){
    const[r,g,b]=hexRgb(color);
    // 타일마다 변형을 랜덤이 아닌 좌표 기반 결정 (deterministic)
    const v=(variant%3===0)?8:(variant%3===1)?0:-8;
    ctx.fillStyle=rgb(r+v,g+v,b+v);
    ctx.fillRect(x,y,B,B);
    // 선명한 하이라이트 (왼쪽/위 2px)
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.fillRect(x,y,B,3);
    ctx.fillRect(x,y,3,B);
    // 선명한 그림자 (오른쪽/아래 2px)
    ctx.fillStyle='rgba(0,0,0,0.40)';
    ctx.fillRect(x,y+B-3,B,3);
    ctx.fillRect(x+B-3,y,3,B);
  }

  // 큰 블록 (2x2 타일) — 마인크래프트 느낌
  function bigBlock(ctx,x,y,color){
    const S=B*2;
    const[r,g,b]=hexRgb(color);
    ctx.fillStyle=rgb(r,g,b); ctx.fillRect(x,y,S,S);
    // 하이라이트
    ctx.fillStyle='rgba(255,255,255,0.22)';
    ctx.fillRect(x,y,S,4); ctx.fillRect(x,y,4,S);
    // 그림자
    ctx.fillStyle='rgba(0,0,0,0.45)';
    ctx.fillRect(x,y+S-4,S,4); ctx.fillRect(x+S-4,y,4,S);
    // 내부 텍스처 점
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.fillRect(x+8,y+8,4,4); ctx.fillRect(x+S-14,y+S-14,4,4);
  }

  // 돌 블록 텍스처 (균열/점 포함)
  function stoneBlock(ctx,x,y,color){
    const[r,g,b]=hexRgb(color);
    ctx.fillStyle=rgb(r,g,b); ctx.fillRect(x,y,B,B);
    ctx.fillStyle='rgba(0,0,0,0.30)';
    ctx.fillRect(x+5,y+3,2,8); ctx.fillRect(x+5,y+11,8,2);
    ctx.fillRect(x+18,y+12,2,6); ctx.fillRect(x+12,y+18,8,2);
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.fillRect(x,y,B,3); ctx.fillRect(x,y,3,B);
    ctx.fillStyle='rgba(0,0,0,0.50)';
    ctx.fillRect(x,y+B-3,B,3); ctx.fillRect(x+B-3,y,3,B);
  }

  // 나무 바닥 블록
  function woodBlock(ctx,x,y,color,horizontal=true){
    const[r,g,b]=hexRgb(color);
    ctx.fillStyle=rgb(r,g,b); ctx.fillRect(x,y,B,B);
    if(horizontal){
      for(let i=0;i<B;i+=8){
        ctx.fillStyle=`rgba(0,0,0,${0.10+((i/8)%2)*0.08})`;
        ctx.fillRect(x,y+i,B,3);
      }
    } else {
      for(let i=0;i<B;i+=8){
        ctx.fillStyle=`rgba(0,0,0,${0.10+((i/8)%2)*0.08})`;
        ctx.fillRect(x+i,y,3,B);
      }
    }
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.fillRect(x,y,B,3);
    ctx.fillStyle='rgba(0,0,0,0.45)';
    ctx.fillRect(x,y+B-3,B,3);
  }

  // 벽돌 블록 (오프셋 줄눈)
  function brickBlock(ctx,x,y,row,color){
    const[r,g,b]=hexRgb(color);
    const v=(row*17+Math.floor(x/B)*7)%5-2;
    ctx.fillStyle=rgb(r+v,g+Math.floor(v*0.4),b+Math.floor(v*0.3));
    ctx.fillRect(x,y,B,B);
    // 줄눈 (굵게)
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(x,y,B,3);               // 수평 줄눈
    const offset=(row%2)*Math.floor(B/2);
    if((x+offset)%B<3) ctx.fillRect(x,y,3,B);  // 수직 줄눈
    // 하이라이트
    ctx.fillStyle='rgba(255,255,255,0.10)';
    ctx.fillRect(x+3,y+3,B-6,4);
  }

  // 풀 블록 (위=초록, 아래=흙)
  function grassBlock(ctx,x,y,variant=0){
    // 흙
    const dv=variant%3===0?6:variant%3===1?0:-5;
    ctx.fillStyle=rgb(101+dv,65+dv,30+dv); ctx.fillRect(x,y,B,B);
    // 풀 상단
    const gv=variant%2===0?8:-4;
    ctx.fillStyle=rgb(56+gv,120+gv,32+gv); ctx.fillRect(x,y,B,10);
    // 풀 디테일
    ctx.fillStyle='rgba(80,180,40,0.5)'; ctx.fillRect(x+2,y+2,3,3);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x,y,B,3); ctx.fillRect(x,y,3,B);
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(x,y+B-3,B,3);
  }

  // 이끼 낀 돌
  function mossStone(ctx,x,y,variant=0){
    stoneBlock(ctx,x,y,'#3a4a3a');
    if(variant%4===0){ctx.fillStyle='rgba(60,140,60,0.35)';ctx.fillRect(x+2,y+2,10,8);}
    if(variant%4===2){ctx.fillStyle='rgba(40,120,40,0.25)';ctx.fillRect(x+14,y+16,10,6);}
  }

  // 용암 블록
  function lavaBlock(ctx,x,y,frame=0){
    ctx.fillStyle=rgb(180,40,0); ctx.fillRect(x,y,B,B);
    const pulse=Math.sin(frame*0.1+(x+y)*0.05)*20;
    ctx.fillStyle=`rgba(255,${100+pulse},0,0.7)`;
    ctx.fillRect(x+4,y+4,B-8,B-8);
    ctx.fillStyle='rgba(255,200,0,0.4)';
    ctx.fillRect(x+8,y+8,B-16,B-16);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(x,y+B-3,B,3);
  }

  // 물 블록 (파문)
  function waterBlock(ctx,x,y,frame=0){
    const wave=Math.sin(frame*0.08+(x+y)*0.15)*6;
    ctx.fillStyle=rgb(20,60+wave,140+wave); ctx.fillRect(x,y,B,B);
    ctx.fillStyle='rgba(100,180,255,0.3)'; ctx.fillRect(x,y+4,B,6);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(x,y,B,3);
  }

  // ── 화면별 드로우 함수 ──
  const DRAW = {

    'px-s-title':(ctx,W,H)=>{
      // 하늘 (매우 어둡게)
      for(let y=0;y<H;y+=8){
        const t=y/H;
        const sr=Math.round(3+t*8),sg=Math.round(2+t*4),sb=Math.round(12+t*14);
        for(let x=0;x<W;x+=8){
          const v=((Math.floor(x/8)*7+Math.floor(y/8)*11)%5)-2;
          ctx.fillStyle=`rgb(${sr+v},${sg+v},${sb+v})`;ctx.fillRect(x,y,8,8);
          ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(x,y,8,1);
          ctx.fillStyle='rgba(0,0,0,0.20)';ctx.fillRect(x,y+7,8,1);
        }
      }
      // 별
      [[20,5,2],[60,3,1],[105,8,2],[150,4,1],[192,6,2],[232,2,1],[275,9,2],[315,5,1],[355,7,2],[398,3,1],[440,8,2],[482,5,1],[522,7,2],[562,4,1],[14,18,1],[52,14,2],[94,20,1],[138,16,1],[178,22,2],[265,19,2],[308,15,1],[350,21,2],[392,16,1],[476,13,2],[518,19,1],[558,17,2],[28,32,2],[72,28,1],[118,34,2],[162,29,1],[208,35,1],[252,31,2],[298,33,1],[342,27,2],[386,34,1],[430,30,2],[474,36,1],[518,28,1],[562,33,2],[15,46,1],[58,42,2],[105,48,1],[152,43,2],[200,47,1],[248,44,2],[295,49,1],[342,45,1],[390,47,2],[438,43,1],[485,48,2],[532,44,1],[580,46,2]].forEach(([sx,sy,sz])=>{
        ctx.fillStyle=sz===2?'rgba(242,236,210,0.90)':'rgba(205,200,248,0.65)';ctx.fillRect(sx,sy,sz,sz);
        if(sz===2){ctx.fillStyle='rgba(242,236,210,0.14)';ctx.fillRect(sx-1,sy-1,4,4);}
      });
      // 달
      const mx=Math.min(490,W-20),my=10;
      ctx.fillStyle='#c4bea0';ctx.fillRect(mx+2,my,12,16);ctx.fillRect(mx,my+2,16,12);
      ctx.fillStyle='#d4ceb2';ctx.fillRect(mx+3,my+2,10,12);ctx.fillRect(mx+2,my+4,12,8);
      ctx.fillStyle='#e2dcc8';ctx.fillRect(mx+4,my+5,8,6);
      ctx.fillStyle='rgba(0,0,20,0.20)';ctx.fillRect(mx+11,my+2,5,14);
      ctx.fillStyle='rgba(155,145,95,0.35)';ctx.fillRect(mx+9,my+9,4,3);
      // 성 — 하늘보다 확실히 밝은 청회색
      const CW='#283050',CH='#364268',CS='#18223a';
      // 수평선 안개
      for(let x=0;x<W;x+=8){ctx.fillStyle='rgba(25,35,70,0.20)';ctx.fillRect(x,H*0.62,8,8);ctx.fillStyle='rgba(18,26,55,0.30)';ctx.fillRect(x,H*0.62+8,8,8);}
      // 성벽 기반
      ctx.fillStyle=CW;ctx.fillRect(0,H*0.73,W,H);
      for(let x=4;x<W;x+=20){ctx.fillStyle=CH;ctx.fillRect(x,H*0.73-8,10,8);}
      for(let x=0;x<W;x+=8)for(let y=Math.round(H*0.73);y<H;y+=8){ctx.fillStyle='rgba(0,0,0,0.26)';ctx.fillRect(x,y,8,1);}
      // 좌 소탑
      ctx.fillStyle=CW;ctx.fillRect(W*0.08,H*0.52,46,H*0.21);ctx.fillRect(W*0.075,H*0.47,54,H*0.06);
      for(let i=0;i<4;i++){ctx.fillStyle=CS;ctx.fillRect(W*0.075+i*14,H*0.43,8,H*0.05);}
      ctx.fillStyle='rgba(255,210,65,0.65)';ctx.fillRect(W*0.10,H*0.58,14,16);
      ctx.fillStyle='rgba(255,210,65,0.12)';ctx.fillRect(W*0.095,H*0.565,18,20);
      // 우 소탑
      ctx.fillStyle=CW;ctx.fillRect(W*0.84,H*0.52,46,H*0.21);ctx.fillRect(W*0.835,H*0.47,54,H*0.06);
      for(let i=0;i<4;i++){ctx.fillStyle=CS;ctx.fillRect(W*0.835+i*14,H*0.43,8,H*0.05);}
      ctx.fillStyle='rgba(255,210,65,0.65)';ctx.fillRect(W*0.862,H*0.58,14,16);
      ctx.fillStyle='rgba(255,210,65,0.12)';ctx.fillRect(W*0.857,H*0.565,18,20);
      // 중간 좌탑
      ctx.fillStyle=CW;ctx.fillRect(W*0.25,H*0.43,52,H*0.30);ctx.fillRect(W*0.24,H*0.37,64,H*0.07);
      for(let i=0;i<4;i++){ctx.fillStyle=CS;ctx.fillRect(W*0.24+i*16,H*0.33,10,H*0.05);}
      ctx.fillStyle='rgba(255,210,65,0.65)';ctx.fillRect(W*0.27,H*0.52,20,22);
      ctx.fillStyle='rgba(255,210,65,0.12)';ctx.fillRect(W*0.265,H*0.505,26,28);
      // 중간 우탑
      ctx.fillStyle=CW;ctx.fillRect(W*0.67,H*0.43,52,H*0.30);ctx.fillRect(W*0.66,H*0.37,64,H*0.07);
      for(let i=0;i<4;i++){ctx.fillStyle=CS;ctx.fillRect(W*0.66+i*16,H*0.33,10,H*0.05);}
      ctx.fillStyle='rgba(255,210,65,0.65)';ctx.fillRect(W*0.695,H*0.52,20,22);
      ctx.fillStyle='rgba(255,210,65,0.12)';ctx.fillRect(W*0.69,H*0.505,26,28);
      // 대탑 중앙
      ctx.fillStyle=CW;ctx.fillRect(W*0.42,H*0.30,W*0.16,H*0.43);
      ctx.fillRect(W*0.40,H*0.23,W*0.20,H*0.08);
      ctx.fillRect(W*0.42,H*0.15,W*0.16,H*0.09);
      ctx.fillRect(W*0.44,H*0.08,W*0.12,H*0.08);
      ctx.fillRect(W*0.455,H*0.02,W*0.09,H*0.07);
      for(let i=0;i<4;i++){ctx.fillStyle=CS;ctx.fillRect(W*0.455+i*(W*0.09/4),0,W*0.018,H*0.025);}
      [H*0.23,H*0.15,H*0.08].forEach(ly=>{ctx.fillStyle=CH;ctx.fillRect(W*0.40,ly+H*0.07,W*0.20,3);});
      ctx.fillStyle='rgba(255,210,65,0.70)';ctx.fillRect(W*0.45,H*0.36,W*0.045,H*0.07);ctx.fillRect(W*0.505,H*0.36,W*0.045,H*0.07);
      ctx.fillStyle='rgba(255,210,65,0.12)';ctx.fillRect(W*0.44,H*0.345,W*0.065,H*0.10);ctx.fillRect(W*0.495,H*0.345,W*0.065,H*0.10);
      ctx.fillStyle='rgba(255,210,65,0.60)';ctx.fillRect(W*0.475,H*0.18,W*0.05,H*0.055);
      ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(W*0.42,H*0.30,2,H*0.43);
      ctx.fillStyle='rgba(0,0,0,0.20)';ctx.fillRect(W*0.58,H*0.30,2,H*0.43);
      // 비녜트
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H*0.9);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.65)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-world':(ctx,W,H)=>{
      const pals=[[70,52,20],[60,44,13],[82,60,26],[56,42,11],[74,56,22],[78,58,24]];
      for(let y=0;y<H;y+=10)for(let x=0;x<W;x+=10){
        const pi=(Math.floor(x/10)*3+Math.floor(y/10)*5)%pals.length;
        const p=pals[pi],v=((Math.floor(x/10)*7+Math.floor(y/10)*11)%5)-2;
        ctx.fillStyle=`rgb(${p[0]+v},${p[1]+v},${p[2]+v})`;ctx.fillRect(x,y,10,10);
        ctx.fillStyle='rgba(0,0,0,0.30)';ctx.fillRect(x,y+9,10,1);
        ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(x,y,10,2);
        if((Math.floor(x/10)+Math.floor(y/10))%4===0){ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(x+2,y+2,6,6);}
      }
      ctx.fillStyle='rgba(28,16,3,0.48)';ctx.fillRect(0,0,W,6);ctx.fillRect(0,H-6,W,6);ctx.fillRect(0,0,6,H);ctx.fillRect(W-6,0,6,H);
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(18,10,0,0.52)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-town':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10){
        const row=Math.floor(y/10),off=(row%2)*10;
        for(let x=0-off;x<W+20;x+=20){
          const v=(Math.floor(x/20)*13+row*7)%6-3;
          ctx.fillStyle=`rgb(${98+v},${36+Math.round(v*0.4)},${20+Math.round(v*0.3)})`;ctx.fillRect(x,y,20,10);
          ctx.fillStyle='rgba(0,0,0,0.52)';ctx.fillRect(x,y,20,2);
          if((x+off)%20<2)ctx.fillRect(x,y,2,10);
          ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(x+2,y+2,16,4);
        }
      }
      const cg=ctx.createRadialGradient(W/2,H*0.6,0,W/2,H*0.6,W*0.55);
      cg.addColorStop(0,'rgba(255,150,70,0.10)');cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cg;ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.58)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-guild':(ctx,W,H)=>{
      const split=Math.floor(H*0.44);
      for(let y=0;y<split;y+=10){
        const row=Math.floor(y/10),off=(row%2)*10;
        for(let x=0-off;x<W+20;x+=20){
          const v=(Math.floor(x/20)*11+row*9)%5-2;
          ctx.fillStyle=`rgb(${50+v},${62+v},${48+v})`;ctx.fillRect(x,y,20,10);
          ctx.fillStyle='rgba(0,0,0,0.52)';ctx.fillRect(x,y,20,2);
          if((x+off)%20<2)ctx.fillRect(x,y,2,10);
          ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(x+2,y+2,16,4);
          if((Math.floor(x/20)*7+row*13)%11===0){ctx.fillStyle='rgba(44,108,44,0.32)';ctx.fillRect(x+3,y+4,12,5);}
        }
      }
      const wp=[[50,28,8],[42,22,6],[60,34,12],[38,20,5]];
      for(let y=split;y<H;y+=12){
        const row=Math.floor((y-split)/12),p=wp[row%4];
        ctx.fillStyle=`rgb(${p[0]},${p[1]},${p[2]})`;ctx.fillRect(0,y,W,12);
        ctx.fillStyle='rgba(0,0,0,0.28)';ctx.fillRect(0,y,W,2);
        ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(0,y+2,W,4);
        const off=(row%2)*60;for(let x=off;x<W;x+=120)ctx.fillRect(x,y,2,12);
      }
      [[W*0.08,split*0.75],[W*0.92,split*0.75]].forEach(([tx,ty])=>{
        const g=ctx.createRadialGradient(tx,ty,0,tx,ty,W*0.34);
        g.addColorStop(0,'rgba(255,165,30,0.24)');g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      });
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H*0.9);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.54)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-shop':(ctx,W,H)=>{
      const pals=[[88,48,16],[72,38,11],[100,56,20],[68,36,10],[80,44,14]];
      for(let y=0;y<H;y+=12){
        const row=Math.floor(y/12),p=pals[row%pals.length];
        ctx.fillStyle=`rgb(${p[0]},${p[1]},${p[2]})`;ctx.fillRect(0,y,W,12);
        ctx.fillStyle='rgba(0,0,0,0.30)';ctx.fillRect(0,y,W,2);
        ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(0,y+2,W,4);
        const off=(row%2)*70;for(let x=off;x<W;x+=140)ctx.fillRect(x,y,2,12);
        if(row%5===2){const kx=(row*53)%W;ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(kx,y+3,9,5);}
      }
      [[W*0.07,H*0.12],[W*0.93,H*0.12]].forEach(([tx,ty])=>{
        const g=ctx.createRadialGradient(tx,ty,0,tx,ty,Math.min(W,H)*0.5);
        g.addColorStop(0,'rgba(255,190,65,0.32)');g.addColorStop(0.5,'rgba(255,120,20,0.10)');g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      });
      const vg=ctx.createRadialGradient(W/2,H*0.3,0,W/2,H*0.3,H*0.9);
      vg.addColorStop(0,'rgba(255,165,55,0.08)');vg.addColorStop(1,'rgba(0,0,0,0.60)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-npc':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10)for(let x=0;x<W;x+=10){
        const v=((Math.floor(x/10)*7+Math.floor(y/10)*11)%5)-2;
        const chk=(Math.floor(x/10)+Math.floor(y/10))%2;
        ctx.fillStyle=`rgb(${18+chk*4+v},${14+chk*4+v},${42+chk*4+v})`;ctx.fillRect(x,y,10,10);
        ctx.fillStyle='rgba(0,0,0,0.38)';ctx.fillRect(x,y,10,1);
        ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(x,y+1,10,3);
      }
      [[W*0.25,H*0.5],[W*0.5,H*0.35],[W*0.75,H*0.55]].forEach(([rx,ry])=>{
        const rg=ctx.createRadialGradient(rx,ry,0,rx,ry,32);
        rg.addColorStop(0,'rgba(100,60,220,0.28)');rg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(110,70,230,0.26)';ctx.fillRect(rx-1,ry-20,2,40);ctx.fillRect(rx-20,ry-1,40,2);
      });
      const mg=ctx.createRadialGradient(W/2,H*0.38,0,W/2,H*0.38,W*0.44);
      mg.addColorStop(0,'rgba(75,45,195,0.22)');mg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=mg;ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.15,W/2,H/2,H*0.9);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,0,22,0.68)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-battle':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10){
        const row=Math.floor(y/10),off=(row%2)*10;
        for(let x=0-off;x<W+20;x+=20){
          const v=(Math.floor(x/20)*13+row*7)%6-3;
          ctx.fillStyle=`rgb(${70+v},${24+Math.round(v*0.4)},${16+Math.round(v*0.3)})`;ctx.fillRect(x,y,20,10);
          ctx.fillStyle='rgba(0,0,0,0.58)';ctx.fillRect(x,y,20,2);
          if((x+off)%20<2)ctx.fillRect(x,y,2,10);
          ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(x+2,y+2,16,4);
        }
      }
      for(let i=0;i<18;i++){ctx.fillStyle='rgba(34,88,34,0.24)';ctx.fillRect((i*67+13)%W,(i*43+9)%H,8,6);}
      for(let i=0;i<8;i++){
        const bx=(i*83+21)%(W-16),by=(i*61+15)%(H-12);
        ctx.fillStyle='rgba(125,10,10,0.30)';ctx.fillRect(bx,by,8,10);
        ctx.fillStyle='rgba(95,8,8,0.18)';ctx.fillRect(bx-2,by+2,14,8);
      }
      [[W*0.04,H*0.10],[W*0.96,H*0.10]].forEach(([tx,ty])=>{
        const g=ctx.createRadialGradient(tx,ty,0,tx,ty,W*0.3);
        g.addColorStop(0,'rgba(255,125,12,0.36)');g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      });
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(38,0,0,0.72)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-status':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10)for(let x=0;x<W;x+=10){
        const v=((Math.floor(x/10)*9+Math.floor(y/10)*11)%5)-2;
        const chk=(Math.floor(x/10)+Math.floor(y/10))%2;
        ctx.fillStyle=`rgb(${18+chk*4+v},${14+chk*4+v},${44+chk*4+v})`;ctx.fillRect(x,y,10,10);
        ctx.fillStyle='rgba(0,0,0,0.38)';ctx.fillRect(x,y,10,1);
      }
      for(let x=0;x<W;x+=40)for(let y=0;y<H;y+=40){
        ctx.fillStyle='rgba(96,68,196,0.16)';ctx.fillRect(x,y,40,1);ctx.fillRect(x,y,1,40);
        ctx.fillStyle='rgba(136,96,236,0.22)';ctx.fillRect(x-2,y-2,5,5);
      }
      const mg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,H*0.7);
      mg.addColorStop(0,'rgba(58,33,126,0.18)');mg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=mg;ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,22,0.55)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-result':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10)for(let x=0;x<W;x+=10){
        const v=((Math.floor(x/10)*7+Math.floor(y/10)*11)%5)-2;
        const t=y/H;
        ctx.fillStyle=`rgb(${Math.round(18+t*10+v)},${Math.round(9+t*5+v)},${Math.round(48+t*20+v)})`;ctx.fillRect(x,y,10,10);
        ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(x,y,10,1);
      }
      const gg=ctx.createLinearGradient(0,0,W*0.8,H*0.5);
      gg.addColorStop(0,'rgba(255,215,50,0.18)');gg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gg;ctx.fillRect(0,0,W,H);
      for(let i=0;i<70;i++){
        const sx=(i*137+31)%W,sy=(i*97+17)%H,big=i%6===0,sz=big?4:2;
        ctx.fillStyle=`rgba(255,220,80,${big?0.92:0.52})`;ctx.fillRect(sx,sy,sz,sz);
        if(big){ctx.fillStyle='rgba(255,220,80,0.14)';ctx.fillRect(sx-2,sy-2,8,8);}
      }
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.55)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-forge':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10){
        const row=Math.floor(y/10),off=(row%2)*10;
        for(let x=0-off;x<W+20;x+=20){
          const v=(Math.floor(x/20)*13+row*7)%4-2;
          ctx.fillStyle=`rgb(${40+v},${16+Math.round(v*0.3)},${5+Math.round(v*0.2)})`;ctx.fillRect(x,y,20,10);
          ctx.fillStyle='rgba(0,0,0,0.60)';ctx.fillRect(x,y,20,2);
          if((x+off)%20<2)ctx.fillRect(x,y,2,10);
        }
      }
      for(let i=0;i<14;i++){
        const lx=(i*67+8)%(W-30),ly=(i*43+12)%(H-10),lv=i%3;
        ctx.fillStyle=`rgba(255,${58+lv*38},0,0.62)`;ctx.fillRect(lx,ly+8,24,3);
        ctx.fillStyle=`rgba(255,${108+lv*38},0,0.32)`;ctx.fillRect(lx-2,ly+5,28,8);
        ctx.fillStyle='rgba(255,220,100,0.52)';ctx.fillRect(lx+8,ly+9,8,1);
      }
      const fg=ctx.createRadialGradient(W/2,H,0,W/2,H,H*0.95);
      fg.addColorStop(0,'rgba(255,118,0,0.55)');fg.addColorStop(0.4,'rgba(218,58,0,0.20)');fg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);
      [[W*0.05,H*0.18],[W*0.95,H*0.18]].forEach(([tx,ty])=>{
        const g=ctx.createRadialGradient(tx,ty,0,tx,ty,W*0.25);
        g.addColorStop(0,'rgba(255,98,0,0.28)');g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      });
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(18,4,0,0.68)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },

    'px-s-codex':(ctx,W,H)=>{
      for(let y=0;y<H;y+=10)for(let x=0;x<W;x+=10){
        const v=((Math.floor(x/10)*9+Math.floor(y/10)*11)%5)-2;
        const chk=(Math.floor(x/10)+Math.floor(y/10))%2;
        ctx.fillStyle=`rgb(${10+chk*4+v},${30+chk*4+v},${28+chk*4+v})`;ctx.fillRect(x,y,10,10);
        ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(x,y,10,1);
      }
      for(let x=0;x<W;x+=36)for(let y=0;y<H;y+=36){
        const rg=ctx.createRadialGradient(x,y,0,x,y,18);
        rg.addColorStop(0,'rgba(38,168,148,0.18)');rg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
        ctx.fillStyle='rgba(48,178,158,0.14)';ctx.fillRect(x-12,y-1,24,2);ctx.fillRect(x-1,y-12,2,24);
      }
      const mg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,H*0.75);
      mg.addColorStop(0,'rgba(18,78,68,0.20)');mg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=mg;ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,10,10,0.60)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    },
  };

  function drawBg(canvas, key){
    const fn=DRAW[key]; if(!fn) return;
    const W=canvas.offsetWidth||window.innerWidth;
    const H=canvas.offsetHeight||window.innerHeight;
    if(W<1||H<1)return;
    canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    fn(ctx,W,H);
  }

  // gotoScreen에서 접근할 수 있도록 전역 노출
  window._drawBg = drawBg;

  function initAll(){
    Object.keys(DRAW).forEach(key=>{
      const cv=document.getElementById(key);
      if(cv) drawBg(cv,key);
    });
  }

  window.addEventListener('resize',()=>{
    document.querySelectorAll('canvas.px-bg').forEach(cv=>drawBg(cv,cv.id));
  });

  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',initAll)
    :initAll();
})();
