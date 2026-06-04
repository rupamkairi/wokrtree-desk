import { BrowserWindow, Updater } from "electrobun/bun";

import { createDesktopRpc } from "../platform/electrobun/rpc";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log(
        "Vite dev server not running. Run 'bun run hmr' for HMR support.",
      );
    }
  }

  return "views://mainview/index.html";
}

const url = await getMainViewUrl();
const rpc = createDesktopRpc();

new BrowserWindow({
  title: "Worktree Desk",
  url,
  rpc,
  frame: {
    width: 1280,
    height: 840,
    x: 120,
    y: 80,
  },
});

console.log("Worktree Desk started");
