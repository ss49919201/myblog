import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { pushContent } from "./d1.ts";
import { sqliteRead, syncDefault } from "./node-db.ts";
import { readPublicFile } from "./public-file.ts";
import { siteConfig } from "./site.ts";

const root = process.cwd();
const command = process.argv[2];
const commands = ["dev", "sync", "push", "push-local", "deploy"] as const;

if (!isCommand(command)) {
  process.stderr.write("usage: node src/cli.ts dev|sync|push|push-local|deploy\n");
  process.exit(2);
}

try {
  if (command === "dev") {
    const db = syncDefault(root);
    const app = createApp({
      sql: sqliteRead(db),
      site: siteConfig(process.env.SITE),
      now: () => new Date(),
      asset: (pathname) => readPublicFile(root, pathname),
    });
    serve({ fetch: app.fetch, port: 8787 }, (info) => {
      process.stdout.write(`http://localhost:${info.port}\n`);
    });
  } else if (command === "sync") {
    syncDefault(root).close();
  } else if (command === "push") {
    const target = process.argv.includes("--local") ? "local" : "remote";
    pushContent(root, target);
  } else if (command === "push-local") {
    pushContent(root, "local");
  } else if (command === "deploy") {
    syncDefault(root).close();
    pushContent(root, "remote");
    execFileSync(join(root, "node_modules", ".bin", "wrangler"), ["deploy"], {
      cwd: root,
      stdio: "inherit",
    });
  } else {
    const unreachable: never = command;
    throw new Error(unreachable);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

function isCommand(value: string | undefined): value is (typeof commands)[number] {
  return commands.some((command) => command === value);
}
