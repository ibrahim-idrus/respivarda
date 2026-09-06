import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  validateAdminCredentials,
  verifySessionToken,
} from "../../../lib/auth";

test("validates admin credentials correctly", () => {
  
  assert.equal(validateAdminCredentials("admin@respivarda.id", "admin123"), true);
  assert.equal(validateAdminCredentials("ADMIN@RESPIVARDA.ID", "admin123"), true);
  assert.equal(validateAdminCredentials("operator@respivarda.id", "admin123"), true);

  
  assert.equal(validateAdminCredentials("admin@respivarda.id", "wrongpass"), false);
  assert.equal(validateAdminCredentials("user@example.com", "admin123"), false);
});

test("signs and verifies admin session tokens correctly", () => {
  const email = "admin@respivarda.id";
  const token = createSessionToken(email);

  assert.ok(token && token.includes("."));

  const verified = verifySessionToken(token);
  assert.ok(verified);
  assert.equal(verified?.email, email);
  assert.ok(verified?.exp && verified.exp > Math.floor(Date.now() / 1000));
});

test("rejects tampered or malformed session tokens", () => {
  const token = createSessionToken("admin@respivarda.id");
  const [payload, signature] = token.split(".");
 
  const tamperedPayload = Buffer.from(JSON.stringify({ email: "hacker@bad.com" })).toString("base64url");
  assert.equal(verifySessionToken(`${tamperedPayload}.${signature}`), null);
 
  assert.equal(verifySessionToken(`${payload}.invalidSignature123`), null);

  assert.equal(verifySessionToken(""), null);
  assert.equal(verifySessionToken("not-a-token"), null);
  assert.equal(verifySessionToken(null), null);
});
