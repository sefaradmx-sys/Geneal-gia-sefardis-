import { childrenOf, getPerson, listPersons, parentsOf, spousesOf } from "./db.js";

export function ancestorNode(db, id, depth = 4) {
  const person = getPerson(db, id);
  if (!person) return null;
  if (depth <= 1) return { person, parents: [] };
  const found = parentsOf(db, id).slice(0, 2);
  const parents = found.map((parent) => ancestorNode(db, parent.id, depth - 1));
  while (parents.length < 2) {
    parents.push({ person: null, childId: id, parents: [] });
  }
  return { person, parents };
}

export function generationColumns(root) {
  const columns = [];
  let level = root ? [root] : [];
  for (let generation = 0; generation < 4 && level.length > 0; generation += 1) {
    columns.push(level);
    const next = [];
    for (const node of level) {
      if (node?.person && node.parents?.length) next.push(...node.parents);
    }
    level = next;
  }
  return columns;
}

export function descendantTree(db, id, depth = 6, seen = new Set()) {
  if (seen.has(id) || depth < 1) return null;
  seen.add(id);
  const person = getPerson(db, id);
  if (!person) return null;
  const children = childrenOf(db, id)
    .map((child) => descendantTree(db, child.id, depth - 1, seen))
    .filter(Boolean);
  return { person, spouses: spousesOf(db, id), children };
}

export function earliestAncestor(db, id) {
  let current = id;
  const seen = new Set();
  while (!seen.has(current)) {
    seen.add(current);
    const parents = parentsOf(db, current);
    if (parents.length === 0) return current;
    current = parents[0].id;
  }
  return id;
}

function ancestorScore(db, id, seen = new Set()) {
  if (seen.has(id)) return 0;
  seen.add(id);
  const parents = parentsOf(db, id);
  if (parents.length === 0) return 1;
  return 1 + Math.max(...parents.map((parent) => ancestorScore(db, parent.id, seen)));
}

export function defaultFocusId(db) {
  const people = listPersons(db);
  let bestId = people[0]?.id ?? null;
  let bestScore = -1;
  for (const person of people) {
    const score = ancestorScore(db, person.id);
    if (score > bestScore || (score === bestScore && person.id > bestId)) {
      bestId = person.id;
      bestScore = score;
    }
  }
  return bestId;
}
