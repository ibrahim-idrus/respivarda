import assert from "node:assert/strict";
import test from "node:test";
import { validateAdminLogin } from "./admin-login-validation";

test("requires an email and password for admin sign-in", () => {
  assert.deepEqual(validateAdminLogin({ email: "", password: "" }), {
    email: "Enter your work email.",
    password: "Enter your password.",
  });
});

test("rejects an invalid work email", () => {
  assert.deepEqual(
    validateAdminLogin({ email: "admin", password: "secure-pass" }),
    { email: "Use a valid work email." },
  );
});

test("accepts non-empty email and password values", () => {
  assert.deepEqual(
    validateAdminLogin({
      email: "operator@respivarda.id",
      password: "secure-pass",
    }),
    {},
  );
});
