let trees = JSON.parse(localStorage.getItem("trees") || "{}");
let currentTree = Object.keys(trees)[0] || "Default Tree";
if (!trees[currentTree]) trees[currentTree] = [];

function saveTrees() {
  localStorage.setItem("trees", JSON.stringify(trees));
}

function renderTreeSelector() {
  let select = document.getElementById("treeSelect");
  select.innerHTML = "";
  Object.keys(trees).forEach(name => {
    let opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === currentTree) opt.selected = true;
    select.appendChild(opt);
  });
}

function createTree() {
  let name = prompt("Enter new tree name:");
  if (!name) return;
  if (trees[name]) { alert("Tree already exists!"); return; }
  trees[name] = [];
  currentTree = name;
  saveTrees();
  render();
}

function switchTree() {
  currentTree = document.getElementById("treeSelect").value;
  render();
}

// Add or Edit Person Modal
function openPersonForm(person=null, parentId=null, relation=null) {
  let isEdit = !!person;
  let name = prompt("Enter Name:", isEdit ? person.name : "");
  if (!name) return;
  let gender = prompt("Enter Gender (Male/Female):", isEdit ? person.gender : "");
  if (!gender) return;
  let dob = prompt("Enter DOB (yyyy-mm-dd):", isEdit ? person.dob : "");
  let marriage = prompt("Enter Marriage Date (yyyy-mm-dd, optional):", isEdit ? person.marriage : "");
  let status = prompt("Status (Alive/Dead):", isEdit ? person.status : "Alive") || "Alive";
  let death = "";
  if (status.toLowerCase() === "dead") {
    death = prompt("Enter Death Date (yyyy-mm-dd):", isEdit ? person.death : "");
  }

  let fatherKulam = "";
  let husbandKulam = "";

  if (gender.toLowerCase() === "male") {
    if (parentId) {
      let parent = trees[currentTree].find(p => p.id === parentId);
      fatherKulam = parent?.kulamFather || "";
    }
  } else if (gender.toLowerCase() === "female") {
    if ((relation === "daughter" || relation === "half-sibling") && parentId) {
      let parent = trees[currentTree].find(p => p.id === parentId);
      fatherKulam = parent?.kulamFather || "";
    }
    if (marriage) {
      husbandKulam = prompt("Enter Husband's Kulam:", isEdit ? person.kulamHusband : "");
    }
  }

  if (isEdit) {
    // Update person
    Object.assign(person, { name, gender, dob, marriage, status, death, kulamFather, kulamHusband });
  } else {
    let newPerson = {
      id: Date.now(),
      name, gender, dob, marriage, status, death,
      kulamFather, kulamHusband,
      fatherId: null,
      motherId: null,
      spouseIds: [],
      childIds: []
    };
    trees[currentTree].push(newPerson);

    if (parentId && relation) {
      linkRelationship(parentId, newPerson.id, relation);
    }
  }

  saveTrees();
  render();
}

function linkRelationship(id1, id2, relation) {
  let p1 = trees[currentTree].find(p => p.id === id1);
  let p2 = trees[currentTree].find(p => p.id === id2);
  if (!p1 || !p2) return;

  switch(relation) {
    case "son":
    case "daughter":
      p1.childIds.push(p2.id);
      if (p1.gender === "Male") p2.fatherId = p1.id;
      if (p1.gender === "Female") p2.motherId = p1.id;
      break;
    case "spouse":
      if (!p1.spouseIds.includes(p2.id)) p1.spouseIds.push(p2.id);
      if (!p2.spouseIds.includes(p1.id)) p2.spouseIds.push(p1.id);
      break;
    case "father":
      p2.fatherId = p1.id;
      p1.childIds.push(p2.id);
      break;
    case "mother":
      p2.motherId = p1.id;
      p1.childIds.push(p2.id);
      break;
    case "half-sibling":
      let parentChoice = prompt("Share which parent? (father/mother):");
      if (parentChoice?.toLowerCase() === "father") p2.fatherId = p1.id;
      else if (parentChoice?.toLowerCase() === "mother") p2.motherId = p1.id;
      p1.childIds.push(p2.id);
      break;
  }
}

function addRelationDropdown(personId) {
  let select = document.getElementById(`relationSelect-${personId}`);
  let relation = select.value;
  if (!relation) return;
  openPersonForm(null, personId, relation);
  select.value = "";
}

function render() {
  renderTreeSelector();
  renderListView();
  renderTreeView();
}

// List View
function renderListView() {
  let div = document.getElementById("listView");
  div.innerHTML = "";
  trees[currentTree].forEach(p => {
    let el = document.createElement("div");
    el.className = "person";
    el.innerHTML = `
      <div class="name">${p.name} (${p.gender})</div>
      <div class="kulam">Kulam: ${p.kulamFather || ""} ${p.kulamHusband ? " | Husband's: " + p.kulamHusband : ""}</div>
      <div class="dob">DOB: ${p.dob || ""}</div>
      <div class="status ${p.status.toLowerCase()}"></div><br>
      <button onclick="openPersonForm(trees[currentTree].find(x => x.id===${p.id}))">Edit</button>
      <select id="relationSelectList-${p.id}">
        <option value="">Add Relation</option>
        <option value="son">Son</option>
        <option value="daughter">Daughter</option>
        <option value="spouse">Spouse</option>
        <option value="father">Father</option>
        <option value="mother">Mother</option>
        <option value="half-sibling">Half-Sibling</option>
      </select>
      <button onclick="addRelationDropdownList(${p.id})">Add</button>
      <button onclick="deletePerson(${p.id})">Delete</button>
    `;
    div.appendChild(el);
  });
}

function addRelationDropdownList(personId) {
  let select = document.getElementById(`relationSelectList-${personId}`);
  let relation = select.value;
  if (!relation) return;
  openPersonForm(null, personId, relation);
  select.value = "";
}

// Tree View
function renderTreeView() {
  let div = document.getElementById("treeView");
  div.innerHTML = "";

  // Root-level Add Person if empty
  if (trees[currentTree].length === 0) {
    let btn = document.createElement("button");
    btn.textContent = "+ Add Root Person";
    btn.onclick = () => openPersonForm();
    div.appendChild(btn);
    return;
  }

  // Find roots (no father or mother)
  let roots = trees[currentTree].filter(p => !p.fatherId && !p.motherId);
  roots.forEach(r => div.appendChild(buildTreeBranch(r)));
}

function buildTreeBranch(person) {
  let branch = document.createElement("div");
  branch.className = "tree-branch";

  // Build person box
  let spouses = person.spouseIds.map(sid => {
    let sp = trees[currentTree].find(x => x.id===sid);
    return sp ? sp.name : "";
  }).join(", ");

  branch.innerHTML = `
    <div class="person" onclick="openPersonForm(trees[currentTree].find(x=>x.id===${person.id}))">
      <div class="name">${person.name} (${person.gender})</div>
      <div class="kulam">Kulam: ${person.kulamFather || ""} ${person.kulamHusband ? " | Husband's: " + person.kulamHusband : ""}</div>
      <div class="status ${person.status.toLowerCase()}"></div>
      <div>${spouses ? "Spouse: " + spouses : ""}</div>
      <select id="relationSelect-${person.id}">
        <option value="">Add Relation</option>
        <option value="son">Son</option>
        <option value="daughter">Daughter</option>
        <option value="spouse">Spouse</option>
        <option value="father">Father</option>
        <option value="mother">Mother</option>
        <option value="half-sibling">Half-Sibling</option>
      </select>
      <button onclick="addRelationDropdown(${person.id})">Add</button>
    </div>
  `;

  // Children
  let children = trees[currentTree].filter(c => c.fatherId === person.id || c.motherId === person.id);
  if (children.length > 0) {
    let childrenDiv = document.createElement("div");
    childrenDiv.className = "tree-children";
    children.forEach(c => childrenDiv.appendChild(buildTreeBranch(c)));
    branch.appendChild(childrenDiv);
  }

  return branch;
}

// Delete Person
function deletePerson(id) {
  trees[currentTree] = trees[currentTree].filter(p => p.id !== id);
  // Remove references from parents/spouses
  trees[currentTree].forEach(p => {
    p.childIds = p.childIds.filter(cid => cid !== id);
    p.spouseIds = p.spouseIds.filter(sid => sid !== id);
    if (p.fatherId === id) p.fatherId = null;
    if (p.motherId === id) p.motherId = null;
  });
  saveTrees();
  render();
}

// Toggle List/Tree View
function toggleView() {
  let list = document.getElementById("listView");
  let tree = document.getElementById("treeView");
  if (list.style.display === "none") {
    list.style.display = "block";
    tree.style.display = "none";
  } else {
    list.style.display = "none";
    tree.style.display = "block";
  }
}

// Export
function exportAllJSON() {
  let blob = new Blob([JSON.stringify(trees, null, 2)], { type: "application/json" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "all-family-trees.json";
  a.click();
}

function exportAllPDF() {
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();
  let y = 10;
  Object.keys(trees).forEach(treeName => {
    doc.setFontSize(14);
    doc.text(`🌳 Tree: ${treeName}`, 10, y);
    y += 10;
    trees[treeName].forEach((p, i) => {
      doc.setFontSize(10);
      doc.text(`${i+1}. ${p.name} (${p.gender}) | Kulam: ${p.kulamFather || ""} ${p.kulamHusband || ""} | DOB: ${p.dob || ""} | Status: ${p.status}`, 10, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 10; }
    });
    y += 10;
  });
  doc.save("all-family-trees.pdf");
}

render();