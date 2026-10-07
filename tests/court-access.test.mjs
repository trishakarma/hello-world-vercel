import test from "node:test";
import assert from "node:assert/strict";

const origin = process.env.COURT_TEST_URL || "http://127.0.0.1:3000";
for (const route of ["vote", "generate"]) {
  test(`${route} requires an authenticated session`, async () => {
    const response = await fetch(`${origin}/api/${route}`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({
        captionId: "00000000-0000-0000-0000-000000000000",
        value: 1,
      }),
      redirect: "manual",
    });
    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /sign in/i);
  });
  test(`${route} rejects cross-site mutations`, async () => {
    const response = await fetch(`${origin}/api/${route}`, {
      method: "POST",
      headers: {
        origin: "https://unrelated.example",
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert.equal(response.status, 403);
  });
}
