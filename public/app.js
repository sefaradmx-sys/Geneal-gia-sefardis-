async function loadHealth() {
  const el = document.getElementById("status");
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    el.textContent = `Servicio "${data.service}": ${data.status.toUpperCase()}`;
    el.classList.add("ok");
  } catch (err) {
    el.textContent = "No se pudo contactar con el servicio";
    el.classList.add("error");
  }
}

function renderNode(node) {
  const li = document.createElement("li");
  li.className = "node";

  const label = document.createElement("span");
  label.className = "label";
  label.innerHTML = `${node.name} <span class="years">(${node.birthYear})</span>`;
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

async function loadTree() {
  const container = document.getElementById("tree");
  const roots = await (await fetch("/api/tree")).json();
  const ul = document.createElement("ul");
  for (const root of roots) {
    ul.appendChild(renderNode(root));
  }
  container.innerHTML = "";
  container.appendChild(ul);
}

async function loadMembers() {
  const list = document.getElementById("members");
  const members = await (await fetch("/api/members")).json();
  list.innerHTML = "";
  for (const m of members) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${m.name}</strong> <span class="years">(${m.birthYear})</span>
      <span class="place">${m.birthPlace}</span>`;
    list.appendChild(li);
  }
}

loadHealth();
loadTree();
loadMembers();
