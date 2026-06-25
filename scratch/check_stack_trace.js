const { Client } = require('pg');
const net = require('net');

function socks5Connect(proxyHost, proxyPort, targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: proxyHost, port: proxyPort });
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
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        resolve(socket);
      }
    });
    socket.on('error', (err) => { socket.destroy(); reject(err); });
  });
}

async function run() {
  const proxyHost = '47.90.167.27';
  const proxyPort = 1000;
  const targetHost = 'db.xqxnezvhrmyndpsfmrbc.supabase.co';
  const targetPort = 5432;

  const stream = await socks5Connect(proxyHost, proxyPort, targetHost, targetPort);
  
  stream.connect = function(opts, cb) {
    if (typeof opts === 'function') opts();
    else if (typeof cb === 'function') cb();
    return this;
  };

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
    await client.end();
  } catch (err) {
    console.error('ERROR STACK TRACE:');
    console.error(err.stack || err);
  }
}

run().catch(console.error);
