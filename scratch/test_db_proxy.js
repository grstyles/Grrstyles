const { Client } = require('pg');
const net = require('net');

// SOCKS5 CONNECT handshake helper
function socks5Connect(proxyHost, proxyPort, targetHost, targetPort, timeoutMs = 10000) {
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
          reject(new Error('SOCKS5 handshake failed (auth method rejected)'));
          return;
        }
        
        const hostBuffer = Buffer.from(targetHost, 'utf8');
        const req = Buffer.alloc(4 + 1 + hostBuffer.length + 2);
        req[0] = 0x05;
        req[1] = 0x01;
        req[2] = 0x00;
        req[3] = 0x03; // Domain name
        req[4] = hostBuffer.length;
        hostBuffer.copy(req, 5);
        req.writeUInt16BE(targetPort, 5 + hostBuffer.length);
        
        state = 1;
        socket.write(req);
      } else if (state === 1) {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          socket.destroy();
          reject(new Error(`SOCKS5 CONNECT failed with status: ${data[1]}`));
          return;
        }
        
        socket.setTimeout(0);
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        socket.removeAllListeners('timeout');
        resolve(socket);
      }
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function run() {
  const proxyHost = '8.221.138.111';
  const proxyPort = 3129;
  const targetHost = 'db.xqxnezvhrmyndpsfmrbc.supabase.co';
  const targetPort = 5432;

  console.log(`Connecting to database via proxy ${proxyHost}:${proxyPort}...`);
  const stream = await socks5Connect(proxyHost, proxyPort, targetHost, targetPort);
  console.log('SOCKS5 tunnel established. Handing over to pg client...');

  const client = new Client({
    host: targetHost,
    user: 'postgres',
    database: 'postgres',
    password: 'Vyshur@m14321',
    port: targetPort,
    ssl: { rejectUnauthorized: false },
    stream: stream
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables in database:', res.rows.map(r => r.table_name));
    await client.end();
  } catch (err) {
    console.error('Database query failed:', err.message || err);
    try { await client.end(); } catch (e) {}
  }
}

run().catch(console.error);
