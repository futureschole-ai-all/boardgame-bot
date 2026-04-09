import { Client } from "@notionhq/client";

export interface Game {
  name: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number | null;
  url: string | null;
}

function parsePlayerCount(text: string): { min: number; max: number } {
  const range = text.match(/(\d+)\s*[~\-]\s*(\d+)/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };

  const single = text.match(/(\d+)/);
  if (single) {
    const n = parseInt(single[1]);
    return { min: n, max: n };
  }

  return { min: 0, max: 0 };
}

function getNotionClient() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return null;
  return { notion: new Client({ auth: token }), databaseId };
}

interface SchemaMap {
  title: string;
  richText: string;
  number: string;
  url: string;
}

let cachedSchema: SchemaMap | null = null;

async function getSchema(notion: Client, databaseId: string): Promise<SchemaMap> {
  if (cachedSchema) return cachedSchema;

  const db = await notion.databases.retrieve({ database_id: databaseId });
  const props = (db as any).properties;

  let title = "";
  let richText = "";
  let number = "";
  let url = "";

  for (const [name, prop] of Object.entries<any>(props)) {
    if (prop.type === "title") title = name;
    else if (prop.type === "rich_text" && !richText) richText = name;
    else if (prop.type === "number" && !number) number = name;
    else if (prop.type === "url" && !url) url = name;
  }

  cachedSchema = { title, richText, number, url };
  return cachedSchema;
}

export async function addGame(name: string, players: string, duration: number | null, url: string | null = null): Promise<void> {
  const ctx = getNotionClient();
  if (!ctx) throw new Error("Notion이 설정되지 않았습니다.");

  const schema = await getSchema(ctx.notion, ctx.databaseId);
  const properties: any = {
    [schema.title]: { title: [{ text: { content: name } }] },
    [schema.richText]: { rich_text: [{ text: { content: players } }] },
  };
  if (duration !== null && schema.number) {
    properties[schema.number] = { number: duration };
  }
  if (url && schema.url) {
    properties[schema.url] = { url };
  }

  await ctx.notion.pages.create({
    parent: { database_id: ctx.databaseId },
    properties,
  });
}

export async function fetchGames(): Promise<Game[]> {
  const ctx = getNotionClient();
  if (!ctx) return [];

  const schema = await getSchema(ctx.notion, ctx.databaseId);
  const response = await ctx.notion.databases.query({ database_id: ctx.databaseId });

  return response.results
    .filter((page): page is any => "properties" in page)
    .map((page) => {
      const props = page.properties;
      const playerText = props[schema.richText]?.rich_text?.[0]?.plain_text ?? "";
      const { min, max } = parsePlayerCount(playerText);
      return {
        name: props[schema.title]?.title?.[0]?.plain_text ?? "",
        minPlayers: min,
        maxPlayers: max,
        duration: schema.number ? (props[schema.number]?.number ?? null) : null,
        url: schema.url ? (props[schema.url]?.url ?? null) : null,
      };
    })
    .filter((g) => g.name);
}
