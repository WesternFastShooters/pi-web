import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  try {
    const body = await request.json() as { cwd?: unknown };
    const cwd = typeof body.cwd === "string" ? body.cwd.trim() : "";
    if (!cwd || !isAbsolute(cwd)) return NextResponse.json({ error: "cwd must be an absolute path" }, { status: 400 });
    if (!(await stat(cwd)).isDirectory()) return NextResponse.json({ error: "cwd must be a directory" }, { status: 400 });

    if (process.platform === "darwin") await execFileAsync("open", [cwd]);
    else if (process.platform === "win32") await execFileAsync("explorer.exe", [cwd]);
    else await execFileAsync("xdg-open", [cwd]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
