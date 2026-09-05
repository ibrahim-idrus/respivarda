import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminLogin from "./AdminLogin";

test("renders the admin sign-in surface with the guest access boundary", () => {
  const html = renderToStaticMarkup(createElement(AdminLogin));

  assert.match(html, /Admin access/);
  assert.match(html, /Sign in to Operations/);
  assert.match(html, /Telegram subscribers/);
  assert.match(html, /Guest access stays open/);
  assert.match(html, /href=\"\/\"/);
});
