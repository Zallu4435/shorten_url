#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

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
                    execSync(`npm install ${missing.join(' ')}`, { stdio: 'ignore' });
                    console.log(`  ${GREEN}✓ Patches applied successfully.${RESET}`);
                    resolve();
                } catch (err) {
                    console.log(`\n${BOLD}${RED}  ❌ Critical Failure: Could not install dependencies.${RESET}`);
                    console.log(`  ${GRAY}${err.message}${RESET}`);
                    console.log(`\n  ${BOLD}Please run manually:${RESET}`);
                    console.log(`  ${WHITE}npm install ${missing.join(' ')}${RESET}\n`);
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
            port: 3000,
            host: 'localhost',
            server: 'ws://localhost:8000',
            verbose: false
        }
    });

    if (!args.alias || !args.token) {
        console.log(`${RED}❌ --alias and --token are required.${RESET}`);
        console.log(`Example: node agent.js --alias my-app --token tk_...`);
        process.exit(1);
    }

    const { alias, token, port, host, server, verbose } = args;
    const localUrl = `http://${host}:${port}`;
    const wsUrl = `${server.replace(/\/$/, '')}/ws/tunnel/${alias}/`;
    const publicUrl = server.replace('ws://', 'http://').replace('wss://', 'https://') + `/t/${alias}/`;

    // ─── Banner ────────────────────────────────────────────────────────────
    console.log(`\n${BOLD}${CYAN}  ┌────────────────────────────────────────────────────────────┐${RESET}`);
    console.log(`${BOLD}${CYAN}  │${RESET}  {BOLD}MATRIX TUNNEL AGENT (NODE) v1.0.0{RESET}                   ${BOLD}${CYAN}│${RESET}`);
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

    function shouldLog(path, verbose) {
        if (verbose) return true;
        // Aggressive Noise filters
        const noisePrefixes = ["/_next/", "/static/", "/media/", "/favicon.ico", "/__nextjs_launcher"];
        const noiseExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".map", ".ico", ".js", ".json"];

        if (noisePrefixes.some(p => path.startsWith(p))) return false;
        if (noiseExtensions.some(e => path.toLowerCase().endsWith(e))) return false;
        return true;
    }

    function printRequestLog(method, path, status, latencyMs) {
        if (!shouldLog(path, verbose)) return;

        const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
        const pathDisplay = path.length > 30 ? path.substring(0, 29) + "…" : path;

        let methodCol = CYAN;
        if (['POST', 'PUT'].includes(method)) methodCol = YELLOW;
        else if (method === 'DELETE') methodCol = RED;

        const log = `  ${GRAY}${ts.padEnd(12)}${RESET} ${methodCol}${BOLD}${method.padEnd(10)}${RESET} ${pathDisplay.padEnd(32)} ${colorStatus(status).padEnd(22)} ${GRAY}${Math.round(latencyMs).toString().padStart(6)}ms${RESET}`;
        console.log(log);
    }

    // ─── Logic ─────────────────────────────────────────────────────────────
    const connect = () => {
        const ws = new WebSocket(wsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        ws.on('open', () => {
            printConnected();
        });

        ws.on('message', async (data) => {
            let msg;
            try { msg = JSON.parse(data); } catch (e) { return; }

            if (msg.type === 'disconnect') {
                console.log(`\n  ${RED}❌ ${msg.reason || 'Unknown reason.'}${RESET}`);
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
                                if (k === 'CONTENT_TYPE') return ['content-type', v];
                                return [k.toLowerCase(), v];
                            }).filter(([k]) => !['host'].includes(k))
                        ),
                        data: body ? Buffer.from(body, 'base64') : undefined,
                        maxRedirects: 5,
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
                    const errorMsg = err.response ? err.message : `Local server at ${localUrl} is not responding.`;
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
            console.log(`\n  ${YELLOW}⚠ Warning: Network error detected: ${err.message}${RESET}`);
        });

        ws.on('close', () => {
            console.log(`\n  ${YELLOW}⚠ Warning: Uplink interrupted. Retrying...${RESET}`);
            setTimeout(connect, 5000);
        });
    };

    connect();

    process.on('SIGINT', () => {
        console.log(`\n\n  ${CYAN}⠿ Gracefully severing neural uplink...${RESET}\n`);
        process.exit(0);
    });

})();

function padRight(str, len) {
    return str + ' '.repeat(Math.max(0, len - str.length));
}
