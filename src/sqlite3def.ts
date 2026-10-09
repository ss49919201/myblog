import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const version = "3.11.3";

function sqlite3defBin(): string {
  const dir = join(process.cwd(), ".tools", `sqlite3def-${version}-${process.platform}-${process.arch}`);
  const bin = join(dir, "sqlite3def");
  if (existsSync(bin)) return bin;
  const asset = assetName();
  const archive = join(tmpdir(), `${asset}.${process.pid}`);
  const url = `https://github.com/sqldef/sqldef/releases/download/v${version}/${asset}`;
  execFileSync("curl", ["-fsSL", "-o", archive, url], { stdio: ["ignore", "inherit", "inherit"] });
  const staging = `${dir}.staging-${process.pid}`;
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  if (asset.endsWith(".zip")) {
    execFileSync("unzip", ["-o", archive, "-d", staging], { stdio: ["ignore", "inherit", "inherit"] });
  } else {
    execFileSync("tar", ["-xzf", archive, "-C", staging], { stdio: ["ignore", "inherit", "inherit"] });
  }
  chmodSync(join(staging, "sqlite3def"), 0o755);
  rmSync(dir, { recursive: true, force: true });
  try {
    renameSync(staging, dir);
  } catch (error) {
    if (!existsSync(bin)) throw error;
  }
  return bin;
}

export function runSqlite3def(args: readonly string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(sqlite3defBin(), args, { encoding: "utf8" });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function assetName(): string {
  const os = process.platform === "linux" ? "linux" : process.platform === "darwin" ? "darwin" : undefined;
  const arch = process.arch === "x64" ? "amd64" : process.arch === "arm64" ? "arm64" : undefined;
  if (!os || !arch) {
    throw new Error(`sqlite3def の配布物がありません: ${process.platform} ${process.arch}`);
  }
  const ext = os === "linux" ? "tar.gz" : "zip";
  return `sqlite3def_${os}_${arch}.${ext}`;
}
