import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { sendPollMessage } from "../slack.js";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
sendPollMessage(client).then((ts) => {
  console.log(`Poll sent: ${ts}`);
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
