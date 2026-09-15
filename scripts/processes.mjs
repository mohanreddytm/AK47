import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';

// npm supplies its CLI path when these scripts run through npm run. Calling it
// with Node avoids npm.cmd and shell argument concatenation on Windows.
export function npmCommand(args) {
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
  ];
  const cli = candidates.find(file => file && fs.existsSync(file));
  if (cli) return [process.execPath, [cli, ...args]];
  if (process.platform !== 'win32') return ['npm', args];
  throw Error('Start from the AK47 folder using npm run setup, npm run dev or npm run demo.');
}

export function startNpm(args, options) {
  const [command, argv] = npmCommand(args);
  return spawn(command, argv, {
    ...options,
    shell: false,
    windowsHide: true,
    detached: process.platform !== 'win32',
  });
}

export function stopTree(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    // Only stop this launcher's own child and its descendants, not every Node
    // process. Killing npm alone can leave its API/React subprocess running.
    const result = spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore', windowsHide: true, timeout: 5000,
    });
    if (result.error) child.kill();
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
}
