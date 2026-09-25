function buildTree(list) {
  const byId = new Map(list.map((member) => [member.id, { ...member, children: [] }]));
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

function renderNode(node) {
  const li = document.createElement("li");
  li.className = "node";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = `${node.name} (${node.birthYear})`;
  li.appendChild(label);

  if (node.children && node.children.length > 0) {
    const ul = document.createElement("ul");
    for (const child of node.children) {
      ul.appendChild(renderNode(child));
    }
    li.appendChild(ul);
  }
  return li;
}

function renderTree(roots) {
  const container = document.getElementById("tree");
  const ul = document.createElement("ul");
  for (const root of roots) {
    ul.appendChild(renderNode(root));
  }
  container.replaceChildren(ul);
}

function renderMembers(members) {
  const list = document.getElementById("members");
  list.replaceChildren();
  for (const member of members) {
    const li = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = member.name;
    const years = document.createElement("span");
    years.className = "years";
    years.textContent = ` (${member.birthYear})`;
    const place = document.createElement("span");
    place.className = "place";
    place.textContent = member.birthPlace;
    li.append(name, years, place);
    list.appendChild(li);
  }
}

async function loadSite() {
  const status = document.getElementById("status");
  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const members = await response.json();
    renderTree(buildTree(members));
    renderMembers(members);
    status.textContent = `${members.length} miembros publicados`;
    status.classList.add("ok");
  } catch (err) {
    document.getElementById("tree").textContent = "No se pudo cargar el árbol.";
    status.textContent = "No se pudo cargar la página";
    status.classList.add("error");
  }
}

loadSite();
