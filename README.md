# ⚔ 아르칸: 잊혀진 왕좌 — Kingdom of Arkan RPG

### 🎮 [▶ 지금 바로 플레이하기](https://coding-jhj.github.io/ARKAN_FORGOTTEN_THRONE/)

[![Play](https://img.shields.io/badge/▶%20PLAY%20NOW-FF6B6B?style=for-the-badge)](https://coding-jhj.github.io/ARKAN_FORGOTTEN_THRONE/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-배포중-4CAF50?style=for-the-badge&logo=github)](https://coding-jhj.github.io/ARKAN_FORGOTTEN_THRONE/)
![HTML](https://img.shields.io/badge/HTML5-단일%20파일-E34F26?style=for-the-badge&logo=html5&logoColor=white)

> *왕좌는 잊혀졌고, 왕국은 어둠에 잠겼다.*  
> *여섯 명의 영웅이 다시 빛을 찾아 나선다.*

---

## 📖 스토리

아르칸 왕국의 왕좌가 사라진 지 100년.  
전설 속 유물 **"잊혀진 왕좌"** 를 되찾으려는 음모가 왕국 곳곳에서 꿈틀댄다.

대장장이, 시녀, 용병, 마법사... 서로 다른 이유로 모인 여섯 명의 영웅이  
마을에서 시작해 폐허와 어둠의 탑을 넘어 진실에 다가간다.

---

## 🧑‍🤝‍🧑 등장 캐릭터

| 캐릭터 | 직업 | 속성 | 고유 스킬 |
|--------|------|------|-----------|
| ⚒ **고른** | 대장장이 (전사) | 🔥 화염 | 분노의 일격 · 철벽 |
| 🗡 **엘라** | 왕궁 시녀 (도적) | 💨 바람 | 독 바늘 · 현혹 |
| 🍺 **머독** | 비밀 장부 (도적) | 🌑 암흑 | 뒤통수 · 정보 거래 |
| 🛡 **세라** | 전직 기사·용병 (기사) | ❄ 냉기 | 방패 격돌 · 성역 |
| 🔮 **피우** | 마법사 조수 (마법사) | ⚡ 번개 | 마법 미사일 · 과부하 |
| 🪓 **카그** | 족장 경호원 (전사) | 🌿 대지 | 대지 격분 · 위협 |

---

## 🗺 게임 화면

| 화면 | 설명 |
|------|------|
| 🗺 **월드맵** | 왕국 지도에서 마을·던전 이동 |
| 🏘 **마을** | 길드·상점·NPC·도감 진입 |
| ⚔ **길드** | 파티 편성 (최대 3인) |
| 🛒 **상점** | 무기·방어구·포션 구매 |
| 💬 **NPC** | 마을 장로와 대화·퀘스트 수락 |
| 🥊 **배틀** | 턴제 전투 (행동·스킬·아이템) |
| 📊 **스탯** | 캐릭터 능력치·장비 확인 |
| 📖 **인물도감** | 영웅·몬스터 도감 열람 |

---

## 🗼 던전

| 던전 | 설명 |
|------|------|
| ⚔ **폐허 던전** | 왕국 외곽의 버려진 성터. 초반 공략 지역. |
| 🗼 **어둠의 탑** | 봉인된 마력이 넘치는 고난이도 던전. |
| ❓ **???** | 아직 베일에 싸인 세 번째 지역. |

---

## ⚙ 전투 시스템

```
턴제 커맨드 배틀
├── 행동 탭  : 기본 공격 / 방어
├── 스킬 탭  : 캐릭터 고유 스킬 (MP 소모, 쿨다운)
└── 아이템 탭: 포션·에테르 사용
```

- 파티 3인 vs 적 2~3인 구성
- HP 0 → 전투 불능 / 전원 전투 불능 시 패배
- 승리 시 골드·경험치 획득 → 레벨업 → 스탯 성장

---

## 🛠 기술 스택

```
HTML5 / CSS3 / Vanilla JavaScript
├── Canvas API     — 마인크래프트 스타일 픽셀 블록 배경
├── Press Start 2P — 픽셀 폰트 (Google Fonts)
└── 단일 HTML 파일 — 외부 의존성 없음, 설치 불필요
```

---

## 🚀 로컬 실행

```bash
git clone https://github.com/coding-jhj/ARKAN_FORGOTTEN_THRONE.git
cd ARKAN_FORGOTTEN_THRONE
# index.html 을 브라우저로 열기
```

---

## 📁 파일 구조

```
ARKAN_FORGOTTEN_THRONE/
├── index.html   ← 게임 전체 (HTML + CSS + JS 올인원)
└── README.md
```

---

*© 2025 coding-jhj · Made with ❤ and Pixel Art*
