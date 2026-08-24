import http from 'http';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

async function makeRequest(path: string, method = 'GET', body: any = null, token: string | null = null): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = body ? JSON.stringify(body) : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload).toString();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let responseText = '';
        res.on('data', (chunk) => (responseText += chunk));
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            data = responseText;
          }
          resolve({ status: res.statusCode || 500, data });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runConcurrencyTest() {
  console.log('🧪 Starting Concurrency Protection Race Condition Test...');
  console.log(`🎯 Target API URL: ${BASE_URL}\n`);

  // 1. Log in users
  const user1Res = await makeRequest('/auth/login', 'POST', {
    email: 'customer1@gmail.com',
    password: 'password123',
  });

  if (user1Res.status !== 200) {
    console.error('❌ Login failed. Ensure server is running and seeded (npm run dev & npm run seed).', user1Res.data);
    process.exit(1);
  }

  const token1 = user1Res.data.token;

  // 2. Fetch an event & show
  const eventsRes = await makeRequest('/events');
  if (!eventsRes.data || eventsRes.data.length === 0) {
    console.error('❌ No events found.');
    process.exit(1);
  }

  const event = eventsRes.data[0];
  const showId = event.shows[0]?.id;

  if (!showId) {
    console.error('❌ No show found for event.');
    process.exit(1);
  }

  // 3. Fetch seat map to find an AVAILABLE seat
  const seatMapRes = await makeRequest(`/seats/map/${showId}`);
  const availableSeat = seatMapRes.data.seats.find((s: any) => s.status === 'AVAILABLE');

  if (!availableSeat) {
    console.error('❌ No available seat found in show to test concurrency.');
    process.exit(1);
  }

  const targetSeatId = availableSeat.id;
  const targetSeatNumber = availableSeat.seatNumber;

  console.log(`🎯 Target Seat selected: ${targetSeatNumber} (ID: ${targetSeatId}) for Show ID: ${showId}`);
  console.log('⚡ Launching 10 SIMULTANEOUS parallel hold requests for the EXACT SAME seat...\n');

  // Launch 10 simultaneous requests
  const CONCURRENCY_COUNT = 10;
  const holdPromises = Array.from({ length: CONCURRENCY_COUNT }).map((_, index) => {
    return makeRequest(
      '/seats/hold',
      'POST',
      { showId, showSeatIds: [targetSeatId] },
      token1
    ).then((res) => ({ requestIndex: index + 1, ...res }));
  });

  const results = await Promise.all(holdPromises);

  let successCount = 0;
  let conflictCount = 0;
  let otherCount = 0;

  console.log('📊 Execution Results:');
  console.log('--------------------------------------------------');
  results.forEach((r) => {
    if (r.status === 200) {
      successCount++;
      console.log(`✅ Req #${r.requestIndex}: 200 OK -> ${r.data.message}`);
    } else if (r.status === 409) {
      conflictCount++;
      console.log(`🔒 Req #${r.requestIndex}: 409 Conflict -> ${r.data.error || r.data.message}`);
    } else {
      otherCount++;
      console.log(`⚠️ Req #${r.requestIndex}: ${r.status} Status -> ${JSON.stringify(r.data)}`);
    }
  });

  console.log('--------------------------------------------------');
  console.log(`Summary: Success = ${successCount}, Conflicts = ${conflictCount}, Others = ${otherCount}`);

  if (successCount === 1 && conflictCount === CONCURRENCY_COUNT - 1) {
    console.log('\n🎉 TEST PASSED! Concurrency protection verified: Exactly 1 request won, 9 requests safely blocked with 409 Conflict.');
  } else {
    console.error('\n❌ TEST FAILED! Race condition detected or unexpected responses.');
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
