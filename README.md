# boardgame-bot

보드게임 모임 관리를 위한 Slack 봇. Notion 데이터베이스와 연동하여 보드게임 목록을 관리하고, 매주 참석 투표 및 인원수 기반 게임 추천을 자동으로 수행합니다.

## 기능

### 슬래시 커맨드

| 커맨드 | 설명 | 예시 |
|--------|------|------|
| `/game:list` | 등록된 전체 보드게임 목록 조회 | `/game:list` |
| `/game:suggest` | 인원수에 맞는 보드게임 추천 | `/game:suggest 4명` |
| `/game:add` | 새 보드게임 등록 (Notion에 저장) | `/game:add 카탄 / 3~4명 / 60분 / https://...` |

- `/game:list`, `/game:suggest` 결과는 채널 전체에 표시
- `/game:add` 결과는 본인에게만 표시
- 중복 게임 등록 방지
- 소요시간, URL은 생략 가능

### 자동 스케줄 (cron)

| 시간 | 동작 |
|------|------|
| 매주 목요일 오후 1시 (KST) | 채널에 참석 투표 메시지 전송 |
| 매주 목요일 오전 10시 (KST) | 투표 집계 + 인원수 기반 게임 추천 |

### Notion 연동

- 보드게임 목록을 Notion 데이터베이스에서 관리
- 컬럼 타입 자동 감지 (title, rich_text, number, url)
- Notion에서 직접 편집하거나 슬래시 커맨드로 추가 가능

## 실행 방법

### 사전 준비

**Slack App 설정**

1. [Slack API](https://api.slack.com/apps)에서 앱 생성
2. Socket Mode 활성화 → App-Level Token 생성 (`xapp-...`)
3. Bot Token Scopes: `commands`, `chat:write`, `reactions:read`, `users:read`, `channels:history`
4. Slash Commands 등록: `/game:list`, `/game:suggest`, `/game:add`
5. 앱을 워크스페이스에 설치 후 채널에 초대

**Notion 설정**

1. [Notion Integrations](https://www.notion.so/profile/integrations)에서 Integration 생성
2. 보드게임 데이터베이스에 Integration 연결
3. 데이터베이스 컬럼: 게임명(title), 인원수(text), 소요시간(number), URL(url)

### 환경변수

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_CHANNEL=C07XXXXXXXX
NOTION_TOKEN=ntn_...
NOTION_DATABASE_ID=...
```

### 로컬 실행

```bash
npm install
npm start           # 봇 실행 (Socket Mode + cron 스케줄)
```

### 수동 실행

```bash
npm run poll        # 투표 메시지 즉시 발송
npm run result      # 투표 집계 즉시 실행
```

### 배포 (Railway)

```bash
git push            # Procfile 기반 자동 배포
```

환경변수는 Railway 대시보드에서 설정합니다.
