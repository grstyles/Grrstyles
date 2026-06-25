const net = require('net');

// SOCKS5 CONNECT handshake helper
function socks5Connect(proxyHost, proxyPort, targetHost, targetPort, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: proxyHost, port: proxyPort });
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      // Step 1: Handshake greeting
      // Ver: 5, Num Methods: 1, Method 0 (No Auth)
      socket.write(Buffer.from([0x05, 0x01, 0x00]));
    });

    let state = 0; // 0 = waiting for handshake response, 1 = waiting for connect response

    socket.on('data', (data) => {
      if (state === 0) {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          socket.destroy();
          reject(new Error('SOCKS5 handshake failed (auth method rejected)'));
          return;
        }
        
        // Step 2: Send CONNECT request
        // Ver: 5, Cmd: 1 (CONNECT), RSV: 0, ATYP: 3 (Domain Name)
        const hostBuffer = Buffer.from(targetHost, 'utf8');
        const req = Buffer.alloc(4 + 1 + hostBuffer.length + 2);
        req[0] = 0x05;
        req[1] = 0x01;
        req[2] = 0x00;
        req[3] = 0x03; // Domain name type
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
        
        // Handshake and CONNECT completed successfully!
        socket.setTimeout(0); // clear timeout
        // Remove data listeners so client can take over
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

// Fetch proxy list and test
async function main() {
  const targetHost = 'db.xqxnezvhrmyndpsfmrbc.supabase.co';
  const targetPort = 5432;

  console.log('Fetching SOCKS5 proxy list...');
  try {
    const res = await fetch('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt');
    const text = await res.text();
    const proxies = text.split('\n').map(p => p.trim()).filter(Boolean);
    console.log(`Loaded ${proxies.length} proxies. Testing...`);

    // Test proxies concurrently in batches
    const batchSize = 50;
    for (let i = 0; i < proxies.length; i += batchSize) {
      const batch = proxies.slice(i, i + batchSize);
      console.log(`Testing batch ${i / batchSize + 1} (${batch.length} proxies)...`);

      const promises = batch.map(async (proxy) => {
        const [host, portStr] = proxy.split(':');
        const port = parseInt(portStr);
        try {
          const socket = await socks5Connect(host, port, targetHost, targetPort, 4000);
          console.log(`\n*** WORKING SOCKS5 PROXY FOUND: ${host}:${port} ***\n`);
          socket.destroy();
          return { host, port };
        } catch (e) {
          // ignore failures
          return null;
        }
      });

      const results = await Promise.all(promises);
      const working = results.filter(Boolean);
      if (working.length > 0) {
        console.log('Working proxies:', working);
        process.exit(0);
      }
    }
    console.log('No working proxies found in the list.');
  } catch (err) {
    console.error('Error fetching/testing proxies:', err);
  }
}

main().catch(console.error);
