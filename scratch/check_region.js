async function run() {
  const url = 'https://xqxnezvhrmyndpsfmrbc.supabase.co/rest/v1/';
  const res = await fetch(url, {
    headers: {
      'apikey': 'sb_publishable_CruAlkyqfm5m5ESTirHCzg_EiygSydt',
      'Authorization': 'Bearer sb_publishable_CruAlkyqfm5m5ESTirHCzg_EiygSydt'
    }
  });
  console.log('Status:', res.status);
  console.log('Headers:');
  for (const [key, value] of res.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
}

run().catch(console.error);
