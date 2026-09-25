import test from "node:test";
import assert from "node:assert/strict";
import { getAllMembers, getMemberById, buildTree } from "../src/members.js";

test("getAllMembers returns the full dataset", () => {
  const all = getAllMembers();
  assert.ok(Array.isArray(all));
  assert.ok(all.length >= 1);
});

test("getMemberById finds an existing member", () => {
  const member = getMemberById(1);
  assert.equal(member.name, "Abraham Toledano");
});

test("getMemberById returns null for a missing member", () => {
  assert.equal(getMemberById(9999), null);
});

test("buildTree nests children under their parent", () => {
  const roots = buildTree();
  assert.equal(roots.length, 1);
  const root = roots[0];
  assert.equal(root.id, 1);
  assert.equal(root.children.length, 2);

  const isaac = root.children.find((c) => c.id === 3);
  assert.ok(isaac);
  assert.equal(isaac.children.length, 1);
  assert.equal(isaac.children[0].name, "David Toledano");
});
