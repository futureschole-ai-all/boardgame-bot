import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { getLatestPollMessage, getReactionUsers, getUserName, sendMessage } from "../slack.js";
import { fetchGames } from "../notion.js";
import { filterByPlayerCount, formatGameList } from "../recommend.js";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

async function main() {
  const pollTs = await getLatestPollMessage(client);
  if (!pollTs) {
    console.log("No poll message found.");
    return;
  }

  const userIds = await getReactionUsers(client, pollTs);
  if (userIds.length === 0) {
    await sendMessage(client, "😢 이번 주 보드게임 모임 참석자가 없습니다.");
    return;
  }

  const names = await Promise.all(userIds.map((id) => getUserName(client, id)));
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

  await sendMessage(client, message);
  console.log(`Collected ${names.length} votes.`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
