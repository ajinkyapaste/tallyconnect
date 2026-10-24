/** Quick probe: what can the demo USER account do on admin endpoints? */
const BASE = process.env.API_URL || "http://localhost:4000";

async function call(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const login = await call("POST", "/auth/login", {
  username: "demo-ui@test.local", password: "Demo@1234", loginType: "USER",
});
const token = login.data?.token;
console.log("login:", login.status, "role=", login.data?.user?.role, "adminId=", login.data?.user?.adminId);
console.log("GET /users          ->", (await call("GET", "/users", undefined, token)).status);
console.log("GET /company        ->", JSON.stringify(await call("GET", "/company", undefined, token)));
console.log("GET /company/selected->", (await call("GET", "/company/selected", undefined, token)).status);
console.log("GET /company/active ->", JSON.stringify(await call("GET", "/company/active", undefined, token)));
console.log("POST /company/set-active ->", JSON.stringify(await call("POST", "/company/set-active", { company_guid: "DEMO-COMPANY-001" }, token)));
console.log("POST /company/select     ->", JSON.stringify(await call("POST", "/company/select", { company_guid: "DEMO-COMPANY-001" }, token)));
