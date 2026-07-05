async function run() {
  const ip = '2406:da1a:314:7101:cccf:b11a:1dab:61df';
  // Use ipapi.co or ip-api.com to locate the IP
  const res = await fetch(`https://ipapi.co/${ip}/json/`);
  const data = await res.json();
  console.log('IP Location details:', data);
}

run().catch(console.error);
