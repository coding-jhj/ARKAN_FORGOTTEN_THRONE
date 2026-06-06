# ARKAN: Forgotten Throne — 개발 가이드

브라우저용 픽셀아트 턴제 RPG. 빌드 도구 없는 순수 정적 사이트(HTML/CSS/Vanilla JS), GitHub Pages 배포.

## 구조
```
index.html        엔트리. <link>로 css, <body> 끝에서 js를 순서대로 로드
css/styles.css    전체 스타일
js/sprites.js     적 스프라이트 맵(ENEMY_SVG)
js/data.js        게임 데이터(G, ITEMS, CHARS, ENEMIES, DUNGEONS, NPCS, ELEMENT_*, MAP_*)
js/game.js        게임 로직(화면 전환, 길드, 상점, 파티, 전투, 세이브, 도감)
js/background.js  절차적 픽셀 배경 캔버스 렌더러(DOMContentLoaded에서 initAll)
assets/sprites/   추출된 스프라이트(webp/jpg)
ARKAN-FORGOTTEN-THRONE.html  구 엔트리 → index.html 리다이렉트 스텁(외부 링크 호환)
```

## 아키텍처 규칙 (중요)
- **모듈 시스템 없음.** 모든 스크립트는 전역 스코프 공유(`G`, `CHARS`, `ENEMIES`, 함수 등). `import`/`export` 쓰지 말 것.
- **로드 순서 고정**: sprites → data → game → background. data는 game 함수에 의존하지 않음(순수 선언). game은 data 전역을 런타임에 사용. 순서 바꾸면 깨짐.
- **빌드/번들 없음**: 정적 서빙만. 파일을 브라우저로 직접 열거나 정적 서버로 서빙.

## 에셋 경로 규칙
- HTML 내 `<img src>`·인라인 style: 루트 기준 상대경로 `assets/sprites/x.webp`.
- **CSS 파일(css/styles.css) 안의 `url()`: `../assets/sprites/x.webp`** (CSS 파일 위치 기준이므로 `../` 필수). 새 배경 추가 시 주의.
- 절대경로(`/assets/...`) 금지 — Pages가 서브경로(`/ARKAN_FORGOTTEN_THRONE/`)로 서빙하므로 깨짐.

## 인코딩
- 파일은 **UTF-8 + CRLF**. 한글 다수 포함. 일괄 편집 시 GNU `sed -i` 금지(CR 제거됨) → Node `split("\n")`/`join("\n")` 또는 정규식 `replace`로 매치만 치환해 CRLF 보존.

## 검증
- 정적 서버 띄우고(예: `python -m http.server`) 브라우저로 `index.html` 확인.
- 헤드리스 점검: 부팅 시 콘솔/페이지 에러 0, `assets/` 요청 실패(requestfailed) 0, 표시 `<img>`의 `naturalWidth>0`. 전투 1턴 진행 시 적 HP가 유한값으로 감소해야 함.

## 배포
- GitHub Pages: `main`/root. 푸시 시 자동 배포. 라이브: https://coding-jhj.github.io/ARKAN_FORGOTTEN_THRONE/
