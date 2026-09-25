// In-memory dataset of Sephardic family members used to demonstrate the app.
// Each member optionally references a parent via `parentId`, forming a tree.
export const members = [
  { id: 1, name: "Abraham Toledano", birthYear: 1780, birthPlace: "Tetuán, Marruecos", parentId: null },
  { id: 2, name: "Raquel Toledano", birthYear: 1810, birthPlace: "Tetuán, Marruecos", parentId: 1 },
  { id: 3, name: "Isaac Toledano", birthYear: 1812, birthPlace: "Tetuán, Marruecos", parentId: 1 },
  { id: 4, name: "Ester Benarroch", birthYear: 1838, birthPlace: "Tánger, Marruecos", parentId: 2 },
  { id: 5, name: "David Toledano", birthYear: 1841, birthPlace: "Gibraltar", parentId: 3 },
  { id: 6, name: "Sara Toledano", birthYear: 1866, birthPlace: "Buenos Aires, Argentina", parentId: 5 },
  { id: 7, name: "Jacob Toledano", birthYear: 1870, birthPlace: "Ciudad de México, México", parentId: 5 }
];

export function getAllMembers() {
  return members;
}

export function getMemberById(id) {
  return members.find((m) => m.id === id) ?? null;
}

// Build a nested tree from the flat member list. Members whose parent is not
// present (or is null) become roots.
export function buildTree(list = members) {
  const byId = new Map(list.map((m) => [m.id, { ...m, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    if (node.parentId != null && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
