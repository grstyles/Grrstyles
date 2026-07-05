const { Client } = require('pg');
const net = require('net');

function socks5Connect(proxyHost, proxyPort, targetHost, targetPort, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: proxyHost, port: proxyPort });
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.write(Buffer.from([0x05, 0x01, 0x00]));
    });

    let state = 0;

    socket.on('data', (data) => {
      if (state === 0) {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          socket.destroy();
          reject(new Error('SOCKS5 auth failed'));
          return;
        }
        
        const hostBuffer = Buffer.from(targetHost, 'utf8');
        const req = Buffer.alloc(4 + 1 + hostBuffer.length + 2);
        req[0] = 0x05; req[1] = 0x01; req[2] = 0x00; req[3] = 0x03;
        req[4] = hostBuffer.length;
        hostBuffer.copy(req, 5);
        req.writeUInt16BE(targetPort, 5 + hostBuffer.length);
        
        state = 1;
        socket.write(req);
      } else if (state === 1) {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          socket.destroy();
          reject(new Error(`SOCKS5 CONNECT failed: ${data[1]}`));
          return;
        }
        
        socket.setTimeout(0);
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        socket.removeAllListeners('timeout');
        resolve(socket);
      }
    });

    socket.on('error', (err) => { socket.destroy(); reject(err); });
    socket.on('timeout', () => { socket.destroy(); reject(new Error('Timeout')); });
  });
}

const targetHost = 'db.xqxnezvhrmyndpsfmrbc.supabase.co';
const proxies = [
  { host: '47.90.167.27', port: 1000 },
  { host: '8.221.138.111', port: 3129 }
];

async function tryConnect(proxy, port, user) {
  console.log(`\nConnecting via proxy ${proxy.host}:${proxy.port} to port ${port} as ${user}...`);
  let stream;
  try {
    stream = await socks5Connect(proxy.host, proxy.port, targetHost, port);
  } catch (err) {
    console.log(`  SOCKS5 CONNECT failed: ${err.message}`);
    return false;
  }

  stream.connect = function(opts, cb) {
    if (typeof opts === 'function') opts();
    else if (typeof cb === 'function') cb();
    return this;
  };

  const client = new Client({
    host: targetHost,
    user: user,
    database: 'postgres',
    password: 'Vyshur@m14321',
    port: port,
    ssl: { rejectUnauthorized: false },
    stream: stream
  });

  try {
    await client.connect();
    console.log('  SUCCESS!');
    const res = await client.query('SELECT version();');
    console.log('  Version:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log('  Failed to query:', err.message || err);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  for (const proxy of proxies) {
    for (const port of [5432, 6543]) {
      const users = port === 6543 ? ['postgres.xqxnezvhrmyndpsfmrbc'] : ['postgres'];
      for (const user of users) {
        const ok = await tryConnect(proxy, port, user);
        if (ok) {
          console.log('\nFound working configuration!');
          process.exit(0);
        }
      }
    }
  }
  console.log('\nAll configurations failed.');
}

main().catch(console.error);
