const { Client } = require('pg');
const net = require('net');

// Parse raw IPv6 into a 16-byte buffer
function parseIPv6(ip) {
  const parts = ip.split(':');
  const buffer = Buffer.alloc(16);
  let offset = 0;
  for (let part of parts) {
    const padded = part.padStart(4, '0');
    buffer.writeUInt16BE(parseInt(padded, 16), offset);
    offset += 2;
  }
  return buffer;
}

// SOCKS5 CONNECT handshake helper using raw IPv6 address and strict connection timeout
function socks5ConnectIPv6(proxyHost, proxyPort, targetIp, targetPort, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Connection Timeout'));
    }, timeoutMs);

    socket.connect(proxyPort, proxyHost);

    socket.on('connect', () => {
      socket.write(Buffer.from([0x05, 0x01, 0x00]));
    });

    let state = 0;

    socket.on('data', (data) => {
      if (state === 0) {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          clearTimeout(timer);
          socket.destroy();
          reject(new Error('SOCKS5 auth failed'));
          return;
        }
        
        // CONNECT request: Ver: 5, Cmd: 1, RSV: 0, ATYP: 4 (IPv6)
        const ipBuf = parseIPv6(targetIp);
        const req = Buffer.alloc(4 + 16 + 2);
        req[0] = 0x05;
        req[1] = 0x01;
        req[2] = 0x00;
        req[3] = 0x04; // IPv6 address type
        ipBuf.copy(req, 4);
        req.writeUInt16BE(targetPort, 20);
        
        state = 1;
        socket.write(req);
      } else if (state === 1) {
        clearTimeout(timer);
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          socket.destroy();
          reject(new Error(`SOCKS5 CONNECT failed: ${data[1]}`));
          return;
        }
        
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        resolve(socket);
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      socket.destroy();
      reject(err);
    });
  });
}

async function testDatabaseQuery(proxyHost, proxyPort) {
  const targetHost = 'db.xqxnezvhrmyndpsfmrbc.supabase.co';
  const targetPort = 5432;
  const targetIp = '2406:da1a:314:7101:cccf:b11a:1dab:61df';

  let stream;
  try {
    stream = await socks5ConnectIPv6(proxyHost, proxyPort, targetIp, targetPort, 1500);
  } catch (e) {
    return false;
  }

  // Override connect
  stream.connect = function(opts, cb) {
    if (typeof opts === 'function') opts();
    else if (typeof cb === 'function') cb();
    return this;
  };

  const client = new Client({
    host: targetIp, // Bypass local DNS lookup
    user: 'postgres',
    database: 'postgres',
    password: 'Vyshur@m14321',
    port: targetPort,
    ssl: { rejectUnauthorized: false },
    stream: stream
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 as val');
    await client.end();
    return res.rows[0].val === 1;
  } catch (err) {
    try { await client.end(); } catch (e) {}
    return false;
  }
}

// Wrap testDatabaseQuery in a strict timeout to prevent hangs
function testDatabaseQueryWithTimeout(proxyHost, proxyPort, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeoutMs);

    testDatabaseQuery(proxyHost, proxyPort).then((val) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(val);
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(false);
      }
    });
  });
}

async function main() {
  console.log('Fetching proxy list...');
  try {
    const res = await fetch('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt');
    const text = await res.text();
    const proxies = text.split('\n').map(p => p.trim()).filter(Boolean);
    console.log(`Loaded ${proxies.length} proxies. Testing database queries...`);

    const batchSize = 100;
    for (let i = 0; i < proxies.length; i += batchSize) {
      const batch = proxies.slice(i, i + batchSize);
      console.log(`Testing batch ${i / batchSize + 1} (${batch.length} proxies)...`);

      const promises = batch.map(async (proxy) => {
        const [host, portStr] = proxy.split(':');
        const port = parseInt(portStr);
        const ok = await testDatabaseQueryWithTimeout(host, port, 4000);
        if (ok) {
          console.log(`\n*** FULLY WORKING PROXY FOUND: ${host}:${port} ***\n`);
          return { host, port };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const working = results.filter(Boolean);
      if (working.length > 0) {
        console.log('Found working proxies:', working);
        process.exit(0);
      }
    }
    console.log('No working database proxies found.');
  } catch (err) {
    console.error('Error:', err);
  }
}

main().catch(console.error);
