const assert = require("assert");
const { classifyQuery, fillToolUrl, toolsForQuery } = require("./query-search.js");

function node(name, url, folder) {
  const self = {
    data: { name: name, url: url, description: "" },
    ancestors() {
      return [
        self,
        { data: { name: folder + " Search" } },
        { data: { name: folder } },
        { data: { name: "OSINT Framework" } }
      ];
    }
  };
  return self;
}

const nodes = [
  node("Hunter (R)", "https://hunter.example/?q=<searchterm>", "Email Address"),
  node("Whois", "https://whois.example/", "Domain Name"),
  node("Sherlock (T)", "https://github.com/sherlock-project/sherlock", "Username"),
  node("Spokeo", "https://www.spokeo.com/search?q=<searchterm>", "People Search Engines")
];

assert.strictEqual(classifyQuery("maria@example.com"), "email");
assert.strictEqual(classifyQuery("8.8.8.8"), "ip");
assert.strictEqual(classifyQuery("ejemplo.com"), "domain");
assert.strictEqual(classifyQuery("+52 81 1234 5678"), "phone");
assert.strictEqual(classifyQuery("correo"), "email");
assert.strictEqual(classifyQuery("juan perez"), "person");
assert.strictEqual(classifyQuery("ada_lovelace"), "username");

assert.strictEqual(
  fillToolUrl("https://x.example/%3Cusername%3E", "ada"),
  "https://x.example/ada"
);

const email = toolsForQuery(nodes, "maria@example.com");
assert.strictEqual(email.tools.length, 1);
assert.strictEqual(email.tools[0].data.name, "Hunter (R)");
assert.ok(email.tools[0]._queryUrl.includes("maria%40example.com"));

const person = toolsForQuery(nodes, "juan perez");
assert.strictEqual(person.tools[0].data.name, "Spokeo");
assert.ok(person.hint.includes("persona"));

const namedOnly = toolsForQuery([], "whois");
assert.strictEqual(namedOnly.tools.length, 0);
assert.ok(namedOnly.hint.includes("no carg"));

console.log("query_search_ok");
