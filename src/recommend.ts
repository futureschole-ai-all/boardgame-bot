import type { Game } from "./notion.js";

export function filterByPlayerCount(games: Game[], count: number): Game[] {
  return games.filter((g) => g.minPlayers <= count && count <= g.maxPlayers);
}

function formatGame(g: Game, i: number): string {
  const duration = g.duration ? `, ${g.duration}분` : "";
  const name = g.url ? `<${g.url}|${g.name}>` : g.name;
  return `${i + 1}. *${name}* (${g.minPlayers}~${g.maxPlayers}명${duration})`;
}

export function formatGameList(games: Game[], count: number): string {
  if (games.length === 0) return `_${count}명이 플레이할 수 있는 보드게임이 없습니다._`;
  return `*🎯 ${count}명 추천 보드게임*\n\n${games.map(formatGame).join("\n")}\n\n_총 ${games.length}개 매칭_`;
}

export function formatAllGames(games: Game[]): string {
  if (games.length === 0) return "_등록된 보드게임이 없습니다. Notion에 추가해주세요._";
  return `*📋 등록된 보드게임 목록*\n\n${games.map(formatGame).join("\n")}\n\n_총 ${games.length}개 등록됨_`;
}
