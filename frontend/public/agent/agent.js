#!/usr/bin/env node
/**
 * Matrix Tunnel Agent (Node.js) — connects your local server to a public URL.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ─── Constants ─────────────────────────────────────────────────────────────
const VERSION = "1.1.0";
const CONFIG_PATH = path.join(os.homedir(), '.tunnelrc');
const MAX_RETRIES = 10;
const BACKOFF_BASE = 1000; // 1s
const BACKOFF_MAX = 30000; // 30s

// ─── Colors ────────────────────────────────────────────────────────────────
const GREEN = "\x1b[38;5;82m";
const RED = "\x1b[38;5;196m";
const YELLOW = "\x1b[38;5;214m";
const CYAN = "\x1b[38;5;39m";
const GRAY = "\x1b[38;5;244m";
const WHITE = "\x1b[38;5;255m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function colorStatus(status) {
    if (status >= 200 && status < 300) return GREEN + status + RESET;
    if (status >= 400 && status < 500) return YELLOW + status + RESET;
    return RED + status + RESET;
}

// ─── Config File Helpers ───────────────────────────────────────────────────
function loadConfig(alias) {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    try {
        const content = fs.readFileSync(CONFIG_PATH, 'utf8');
        const lines = content.split('\n');
        let currentSection = null;
        let config = {};

        for (const line of lines) {
            const sectionMatch = line.match(/^\[(.*)\]$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1];
                continue;
            }
            if (currentSection === alias) {
                const kvMatch = line.match(/^([^=]+)=(.*)$/);
                if (kvMatch) {
                    config[kvMatch[1].trim()] = kvMatch[2].trim();
                }
            }
        }
        return config;
    } catch (e) {
        return {};
    }
}

function saveConfig(alias, token, port) {
    let content = '';
    if (fs.existsSync(CONFIG_PATH)) {
        content = fs.readFileSync(CONFIG_PATH, 'utf8');
    }

    const sections = {};
    let currentSection = null;
    content.split('\n').forEach(line => {
        const sectionMatch = line.match(/^\[(.*)\]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1];
            sections[currentSection] = [];
        } else if (currentSection && line.trim()) {
            sections[currentSection].push(line);
        }
    });

    sections[alias] = [`token = ${token}`, `port = ${port}`];

    const newContent = Object.entries(sections)
        .map(([name, lines]) => `[${name}]\n${lines.join('\n')}`)
        .join('\n\n') + '\n';

    fs.writeFileSync(CONFIG_PATH, newContent);
    console.log(`  ${GREEN}✅ Config saved to ${CONFIG_PATH}${RESET}`);
}

// ─── Dependency Check ──────────────────────────────────────────────────────
function ensureDependencies() {
    const missing = [];
    try { require.resolve('ws'); } catch (e) { missing.push('ws'); }
    try { require.resolve('axios'); } catch (e) { missing.push('axios'); }
    try { require.resolve('minimist'); } catch (e) { missing.push('minimist'); }

    if (missing.length === 0) return;

    console.log(`\n${BOLD}${YELLOW}  ⚠ Missing required dependencies: ${missing.join(', ')}${RESET}`);
    console.log(`  ${GRAY}The agent needs these to establish a secure tunnel.${RESET}`);

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question(`\n  ${BOLD}Apply missing patches via npm? [Y/n]: ${RESET}`, (answer) => {
            readline.close();
            const choice = answer.trim().toLowerCase();
            if (choice === "" || choice === "y" || choice === "yes") {
                console.log(`  ${CYAN}# Downloading patches...${RESET}`);
                try {
                    execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
                    console.log(`  ${GREEN}✓ Patches applied successfully.${RESET}`);
                    resolve();
                } catch (err) {
                    console.log(`\n${BOLD}${RED}  ❌ Critical Failure: Could not install dependencies.${RESET}`);
                    console.log(`  ${GRAY}${err.message}${RESET}`);
                    process.exit(1);
                }
            } else {
                console.log(`\n  ${RED}❌ Agent cannot proceed without dependencies.${RESET}\n`);
                process.exit(1);
            }
        });
    });
}

(async () => {
    await ensureDependencies();

    const axios = require('axios');
    const WebSocket = require('ws');

    // ─── Arguments ─────────────────────────────────────────────────────────────
    const args = require('minimist')(process.argv.slice(2), {
        string: ['alias', 'token', 'host', 'server'],
        number: ['port'],
        boolean: ['save', 'verbose'],
        default: {
            host: 'localhost',
            server: 'ws://localhost:8000',
            verbose: false
        }
    });

    let { alias, token, port } = args;

    if (alias && !token) {
        const saved = loadConfig(alias);
        token = saved.token;
        if (!port) port = parseInt(saved.port || '3000');
    }

    port = port || args.port || 3000;

    if (!alias || !token) {
        console.log(`${RED}❌ --alias and --token are required.${RESET}`);
        process.exit(1);
    }

    if (args.save) {
        saveConfig(alias, token, port);
    }

    const { host, server, verbose } = args;
    const localUrl = `http://${host}:${port}`;
    const wsUrl = `${server.replace(/\/$/, '')}/ws/tunnel/${alias}/`;
    const publicUrl = server.replace('ws://', 'http://').replace('wss://', 'https://') + `/t/${alias}/`;

    // ─── Banner ────────────────────────────────────────────────────────────
    console.log(`\n${BOLD}${CYAN}  ┌────────────────────────────────────────────────────────────┐${RESET}`);
    console.log(`${BOLD}${CYAN}  │${RESET}  ${BOLD}MATRIX TUNNEL AGENT (NODE) v${VERSION}${RESET}                   ${BOLD}${CYAN}│${RESET}`);
    console.log(`${BOLD}${CYAN}  └────────────────────────────────────────────────────────────┘${RESET}\n`);

    console.log(`  ${BOLD}${GRAY}NODE ALIAS${RESET}   : ${BOLD}${WHITE}${alias}${RESET}`);
    console.log(`  ${BOLD}${GRAY}PUBLIC ENDPT${RESET} : ${CYAN}${publicUrl}${RESET}`);
    console.log(`  ${BOLD}${GRAY}LOCAL BRIDGE${RESET} : ${GRAY}${localUrl}${RESET}`);
    console.log(`\n  ${GRAY}# Initializing secure uplink...${RESET}`);

    function printConnected() {
        console.log(`  ${GREEN}✓ Connection Established. Node is live.${RESET}\n`);
        const header = `  ${GRAY}${'TIMESTAMP'.padEnd(12)} ${'METHOD'.padEnd(10)} ${'PATH'.padEnd(32)} ${'STATUS'.padEnd(12)} ${'LATENCY'.padEnd(10)}${RESET}`;
        const divider = `  ${GRAY}${'─'.repeat(10).padEnd(12)} ${'─'.repeat(8).padEnd(10)} ${'─'.repeat(30).padEnd(32)} ${'─'.repeat(10).padEnd(12)} ${'─'.repeat(8).padEnd(10)}${RESET}`;
        console.log(header);
        console.log(divider);
    }

    function shouldLog(path, isVerbose) {
        if (isVerbose) return true;
        const noisePrefixes = ["/_next/", "/static/", "/media/", "/favicon.ico", "/__nextjs_launcher"];
        const noiseExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".map", ".ico", ".js", ".json"];
        return !noisePrefixes.some(p => path.startsWith(p)) && !noiseExtensions.some(e => path.toLowerCase().endsWith(e));
    }

    function printRequestLog(method, path, status, latencyMs) {
        if (!shouldLog(path, verbose)) return;
        const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
        const pathDisplay = path.length > 30 ? path.substring(0, 29) + "…" : path;
        let methodCol = CYAN;
        if (['POST', 'PUT'].includes(method)) methodCol = YELLOW;
        else if (method === 'DELETE') methodCol = RED;
        console.log(`  ${GRAY}${ts.padEnd(12)}${RESET} ${methodCol}${BOLD}${method.padEnd(10)}${RESET} ${pathDisplay.padEnd(32)} ${colorStatus(status).padEnd(22)} ${GRAY}${Math.round(latencyMs).toString().padStart(6)}ms${RESET}`);
    }

    // ─── Logic ─────────────────────────────────────────────────────────────
    let retryCount = 0;

    const connect = () => {
        const ws = new WebSocket(wsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Agent-Version': VERSION
            },
            handshakeTimeout: 10000
        });

        ws.on('open', () => {
            retryCount = 0;
            printConnected();
        });

        ws.on('message', async (data) => {
            let msg;
            try { msg = JSON.parse(data); } catch (e) { return; }

            if (msg.type === 'disconnect') {
                console.log(`\n  ${RED}❌ ${msg.reason || 'Unknown reason.'}${RESET}\n\n`);
                process.exit(1);
            }

            if (msg.type === 'request') {
                const start = Date.now();
                const { request_id, method, path, headers, body } = msg;

                try {
                    const response = await axios({
                        method,
                        url: localUrl.replace(/\/$/, '') + path,
                        headers: Object.fromEntries(
                            Object.entries(headers).map(([k, v]) => {
                                if (k.startsWith('HTTP_')) return [k.substring(5).replace(/_/g, '-').toLowerCase(), v];
                                return [k.toLowerCase(), v];
                            }).filter(([k]) => !['host', 'content-length'].includes(k))
                        ),
                        data: body ? Buffer.from(body, 'base64') : undefined,
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        validateStatus: () => true,
                        responseType: 'arraybuffer'
                    });

                    const latencyMs = Date.now() - start;
                    printRequestLog(method, path, response.status, latencyMs);

                    ws.send(JSON.stringify({
                        type: 'response',
                        request_id,
                        status: response.status,
                        headers: response.headers,
                        body: Buffer.from(response.data).toString('base64')
                    }));
                } catch (err) {
                    const status = err.response ? err.response.status : 503;
                    const errorMsg = `LOCAL_EVICTION: Bridge to ${localUrl} failed. Is the service running?`;
                    printRequestLog(method, path, status, 0);

                    ws.send(JSON.stringify({
                        type: 'response',
                        request_id,
                        status,
                        headers: { 'content-type': 'text/plain' },
                        body: Buffer.from(errorMsg).toString('base64')
                    }));
                }
            }
        });

        ws.on('error', (err) => {
            if (retryCount === 0) console.log(`\n  ${YELLOW}⚠ Warning: Uplink error detected: ${err.message}${RESET}`);
        });

        ws.on('close', (code) => {
            if (code === 1000 || code === 1001) return; // Normal closure

            retryCount++;
            if (retryCount > MAX_RETRIES) {
                console.log(`\n  ${RED}❌ Could not reconnect after ${MAX_RETRIES} attempts. Terminating.${RESET}\n`);
                process.exit(1);
            }

            const wait = Math.min(BACKOFF_BASE * Math.pow(2, retryCount - 1), BACKOFF_MAX);
            console.log(`  ${YELLOW}↻ Retrying in ${Math.round(wait / 1000)}s... (attempt ${retryCount}/${MAX_RETRIES})${RESET}`);
            setTimeout(connect, wait);
        });
    };

    connect();

    process.on('SIGINT', () => {
        console.log(`\n\n  ${CYAN}⠿ Gracefully severing neural uplink...${RESET}\n`);
        process.exit(0);
    });
})();
