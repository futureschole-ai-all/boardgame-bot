import "dotenv/config";
import { App } from "@slack/bolt";
import cron from "node-cron";
import { fetchGames, addGame } from "./notion.js";
import { filterByPlayerCount, formatGameList, formatAllGames } from "./recommend.js";
import {
  sendPollMessage,
  getLatestPollMessage,
  getReactionUsers,
  getUserName,
  sendMessage,
} from "./slack.js";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// /game:list — 전체 목록
app.command("/game:list", async ({ command, ack, respond }) => {
  await ack();
  const games = await fetchGames();
  await respond({ text: formatAllGames(games), response_type: "in_channel" });
});

// /game:suggest N명 — 인원수 기반 추천
app.command("/game:suggest", async ({ command, ack, respond }) => {
  await ack();
  const match = command.text.trim().match(/^(\d+)/);
  if (!match) {
    await respond("*사용법:* `/game:suggest 4명`");
    return;
  }
  const count = parseInt(match[1], 10);
  const games = await fetchGames();
  const filtered = filterByPlayerCount(games, count);
  await respond({ text: formatGameList(filtered, count), response_type: "in_channel" });
});

// /game:add 게임명 인원수 소요시간 — Notion에 게임 추가
app.command("/game:add", async ({ command, ack, respond }) => {
  await ack();
  // "카탄 / 3~4명 / 60분 / https://..." 또는 공백 구분
  const parts = command.text.includes("/")
    ? command.text.split("/").map((s) => s.trim())
    : command.text.trim().split(/\s+/);

  const name = parts[0] ?? "";
  const playersRaw = parts[1] ?? "";
  const playersMatch = playersRaw.match(/\d+[~\-]\d+명?|\d+명?/);
  if (!name || !playersMatch) {
    await respond("*사용법:* `/game:add 카탄 / 3~4명 / 60분 / https://...`\n소요시간과 URL은 생략 가능합니다.");
    return;
  }

  const players = playersMatch[0];
  const durationRaw = parts[2] ?? "";
  const duration = durationRaw.match(/\d+/) ? parseInt(durationRaw) : null;
  const urlRaw = parts[3] ?? "";
  const url = urlRaw.match(/^https?:\/\//) ? urlRaw : null;

  try {
    const existing = await fetchGames();
    if (existing.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      await respond(`⚠️ *${name}*은(는) 이미 등록되어 있습니다.`);
      return;
    }
    await addGame(name, players, duration, url);
    const durationText = duration ? ` | ${duration}분` : "";
    const urlText = url ? ` | <${url}|링크>` : "";
    await respond(`✅ 게임 등록 완료! (*${name}* | ${players}${durationText}${urlText})`);
  } catch (e: any) {
    await respond({ blocks: [
      { type: "section", text: { type: "mrkdwn", text: `❌ 등록 실패: ${e.message}` } },
    ] as any });
  }
});

// 매주 목요일 오후 1시 (KST) - 투표 메시지 전송
cron.schedule("0 13 * * 4", async () => {
  console.log("[cron] Sending poll...");
  const ts = await sendPollMessage(app.client);
  console.log(`[cron] Poll sent: ${ts}`);
}, { timezone: "Asia/Seoul" });

// 매주 목요일 오전 10시 (KST) - 투표 집계 + 추천
cron.schedule("0 10 * * 4", async () => {
  console.log("[cron] Collecting votes...");
  const pollTs = await getLatestPollMessage(app.client);
  if (!pollTs) {
    await sendMessage(app.client, "⚠️ 투표 메시지를 찾을 수 없습니다.");
    return;
  }

  const userIds = await getReactionUsers(app.client, pollTs);
  if (userIds.length === 0) {
    await sendMessage(app.client, "😢 이번 주 보드게임 모임 참석자가 없습니다.");
    return;
  }

  const names = await Promise.all(userIds.map((id) => getUserName(app.client, id)));
  const games = await fetchGames();
  const filtered = filterByPlayerCount(games, names.length);

  const message = [
    `*📋 이번 주 보드게임 모임*`,
    ``,
    `*참석자 (${names.length}명)*`,
    names.map((n) => `• ${n}`).join("\n"),
    ``,
    formatGameList(filtered, names.length),
  ].join("\n");

  await sendMessage(app.client, message);
  console.log(`[cron] Collected ${names.length} votes.`);
}, { timezone: "Asia/Seoul" });

(async () => {
  await app.start();
  console.log("⚡️ Boardgame bot is running!");
})();
