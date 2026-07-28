const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

dns.resolve('xqxnezvhrmyndpsfmrbc.supabase.co', (err, addresses) => {
  console.log('xqxnezvhrmyndpsfmrbc.supabase.co addresses:', { err, addresses });
});

dns.resolve('db.xqxnezvhrmyndpsfmrbc.supabase.co', (err, addresses) => {
  console.log('db.xqxnezvhrmyndpsfmrbc.supabase.co addresses:', { err, addresses });
});

dns.resolve4('aws-0-ap-south-1.pooler.supabase.com', (err, addresses) => {
  console.log('aws-0-ap-south-1 pooler IPv4:', { err, addresses });
});
