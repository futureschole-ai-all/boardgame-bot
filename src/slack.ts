import type { WebClient } from "@slack/web-api";

const channel = process.env.SLACK_CHANNEL!;

export async function sendPollMessage(client: WebClient): Promise<string> {
  const result = await client.chat.postMessage({
    channel,
    text: ":game_die: 다음 주 목요일 :game_die:보드게임 데이:game_die: 참석하시는 분은 :white_check_mark: 리액션 눌러주세요!",
  });
  return result.ts!;
}

export async function getLatestPollMessage(client: WebClient): Promise<string | null> {
  const result = await client.conversations.history({
    channel,
    limit: 20,
  });

  const pollMessage = result.messages?.find(
    (m) => m.bot_id && m.text?.includes("보드게임 모임 참석 여부")
  );
  return pollMessage?.ts ?? null;
}

export async function getReactionUsers(client: WebClient, timestamp: string): Promise<string[]> {
  const result = await client.reactions.get({ channel, timestamp });

  const checkReaction = (result as any).message?.reactions?.find(
    (r: any) => r.name === "white_check_mark"
  );
  return checkReaction?.users ?? [];
}

export async function getUserName(client: WebClient, userId: string): Promise<string> {
  const result = await client.users.info({ user: userId });
  return result.user?.real_name ?? result.user?.name ?? userId;
}

export async function sendMessage(client: WebClient, text: string): Promise<void> {
  await client.chat.postMessage({ channel, text });
}
