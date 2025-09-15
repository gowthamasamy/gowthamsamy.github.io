// -------------------- Initialization --------------------
let trees = JSON.parse(localStorage.getItem("trees") || "{}");
let currentTree = Object.keys(trees)[0] || null;
if (currentTree && !trees[currentTree]) trees[currentTree] = [];

// -------------------- Utility Functions --------------------
function saveTrees() {
  localStorage.setItem("trees", JSON.stringify(trees));
}

// -------------------- Tree Management --------------------
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

function deleteCurrentTree() {
  if (!currentTree) return;
  if (!confirm(`Delete entire tree "${currentTree}"?`)) return;
  delete trees[currentTree];
  let remainingTrees = Object.keys(trees);
  currentTree = remainingTrees[0] || null;
  saveTrees();
  render();
}

// -------------------- Person Modal --------------------
let currentEditingId = null;
function openPersonModal(editId = null) {
  if (!currentTree) return alert("Create/select a tree first.");
  document.getElementById("personModal").style.display = "block";
  currentEditingId = editId;
  document.getElementById("modalTitle").textContent = editId ? "Edit Person" : "Add Person";

  populateParentDropdowns();

  if (editId) {
    let p = trees[currentTree].find(x => x.id == editId);
    if (p) {
      document.getElementById("personName").value = p.name;
      document.getElementById("personGender").value = p.gender;
      document.getElementById("personDOB").value = p.dob;
      document.getElementById("personStatus").value = p.death ? "Dead" : "Alive";
      toggleDeathDate();
      document.getElementById("personDeath").value = p.death || "";
      document.getElementById("personMarriage").value = p.marriage || "";
      document.getElementById("personKulamFather").value = p.kulamFather || "";
      document.getElementById("personKulamHusband").value = p.kulamHusband || "";
      document.getElementById("personFather").value = p.fatherId || "";
      document.getElementById("personMother").value = p.motherId || "";
    }
  } else {
    document.getElementById("personForm").reset();
    toggleDeathDate();
  }
}

function closePersonModal() {
  document.getElementById("personModal").style.display = "none";
}

// Toggle death date input
function toggleDeathDate() {
  let status = document.getElementById("personStatus").value;
  let deathLabel = document.getElementById("deathLabel");
  let deathInput = document.getElementById("personDeath");
  if (status === "Dead") {
    deathLabel.style.display = "inline";
    deathInput.style.display = "inline";
  } else {
    deathLabel.style.display = "none";
    deathInput.style.display = "none";
    deathInput.value = "";
  }
}

// Populate parent dropdowns
function populateParentDropdowns() {
  let fatherSelect = document.getElementById("personFather");
  let motherSelect = document.getElementById("personMother");
  fatherSelect.innerHTML = '<option value="">--None--</option>';
  motherSelect.innerHTML = '<option value="">--None--</option>';
  trees[currentTree].forEach(p => {
    let optF = document.createElement("option");
    optF.value = p.id; optF.textContent = p.name + " (" + p.gender + ")"; fatherSelect.appendChild(optF);
    let optM = document.createElement("option");
    optM.value = p.id; optM.textContent = p.name + " (" + p.gender + ")"; motherSelect.appendChild(optM);
  });
}

// -------------------- Save Person --------------------
document.getElementById("personForm").addEventListener("submit", function (e) {
  e.preventDefault();
  savePerson();
});

function savePerson() {
  let id = currentEditingId || Date.now();
  let name = document.getElementById("personName").value;
  let gender = document.getElementById("personGender").value;
  let dob = document.getElementById("personDOB").value;
  let status = document.getElementById("personStatus").value;
  let death = status === "Dead" ? document.getElementById("personDeath").value : "";
  let marriage = document.getElementById("personMarriage").value;
  let kulamFather = document.getElementById("personKulamFather").value;
  let kulamHusband = document.getElementById("personKulamHusband").value;
  let fatherId = document.getElementById("personFather").value || null;
  let motherId = document.getElementById("personMother").value || null;

  let imgInput = document.getElementById("personImage");
  let reader = new FileReader();
  reader.onload = function (e) {
    let imgData = e.target.result;
    savePersonData(id, name, gender, dob, death, marriage, kulamFather, kulamHusband, fatherId, motherId, imgData);
  };
  if (imgInput.files.length > 0) {
    reader.readAsDataURL(imgInput.files[0]);
  } else {
    let existing = trees[currentTree].find(p => p.id == id);
    let imgData = existing ? existing.image : null;
    savePersonData(id, name, gender, dob, death, marriage, kulamFather, kulamHusband, fatherId, motherId, imgData);
  }
}

function savePersonData(id, name, gender, dob, death, marriage, kulamFather, kulamHusband, fatherId, motherId, imgData) {
  let existing = trees[currentTree].find(p => p.id == id);
  if (existing) {
    Object.assign(existing, { name, gender, dob, death, marriage, kulamFather, kulamHusband, fatherId, motherId, image: imgData });
  } else {
    trees[currentTree].push({ id, name, gender, dob, death, marriage, kulamFather, kulamHusband, fatherId, motherId, spouseIds: [], childIds: [], image: imgData });
  }

  // Update parent's childIds
  trees[currentTree].forEach(p => {
    if (p.id == fatherId || p.id == motherId) {
      if (!p.childIds.includes(id)) p.childIds.push(id);
    }
  });

  saveTrees(); closePersonModal(); render();
}

// -------------------- Render Views --------------------
function render() {
  renderTreeSelector();
  renderListView();
  renderTreeView();
}

function renderListView() {
  let div = document.getElementById("listView");
  div.innerHTML = "";
  if (!currentTree) return;
  trees[currentTree].forEach(p => {
    let statusClass = p.death ? "dead" : "alive";
    let el = document.createElement("div");
    el.className = "person";
    el.innerHTML = `
      ${p.image ? '<img src="' + p.image + '">' : ''}
      <div class="name">${p.name} (${p.gender})</div>
      <div class="kulam">Kulam: ${p.kulamFather || ""} ${p.kulamHusband ? " | Husband's: " + p.kulamHusband : ""}</div>
      <div class="dob">DOB: ${p.dob || ""}</div>
      <div class="status ${statusClass}"></div><br>
      <button onclick="openPersonModal(${p.id})">Edit</button>
      <button onclick="deletePerson(${p.id})">Delete</button>
      <button onclick="openRelationModal(${p.id})">+ Add Relation</button>
    `;
    div.appendChild(el);
  });
}

function renderTreeView() {
  let div = document.getElementById("treeView");
  div.innerHTML = "";
  if (!currentTree) return;
  let roots = trees[currentTree].filter(p => !p.fatherId && !p.motherId);
  roots.forEach(r => { div.appendChild(buildTreeBranch(r)); });
}

function buildTreeBranch(p) {
  let branch = document.createElement("div");
  branch.className = "tree-branch";
  let statusClass = p.death ? "dead" : "alive";
  branch.innerHTML = `
    ${p.image ? '<img src="' + p.image + '">' : ''}
    <div class="person">
      <div class="name">${p.name} (${p.gender})</div>
      <div class="kulam">Kulam: ${p.kulamFather || ""} ${p.kulamHusband ? " | Husband's: " + p.kulamHusband : ""}</div>
      <div class="status ${statusClass}"></div>
      <button onclick="openPersonModal(${p.id})">Edit</button>
      <button onclick="deletePerson(${p.id})">Delete</button>
      <button onclick="openRelationModal(${p.id})">+ Relation</button>
    </div>
  `;
  if (p.childIds.length > 0) {
    let childrenDiv = document.createElement("div");
    childrenDiv.className = "tree-children";
    p.childIds.forEach(cid => {
      let child = trees[currentTree].find(x => x.id == cid);
      if (child) childrenDiv.appendChild(buildTreeBranch(child));
    });
    branch.appendChild(childrenDiv);
  }
  return branch;
}

// -------------------- Delete Person --------------------
function deletePerson(id) {
  if (!currentTree) return;
  if (!confirm("Delete this person?")) return;
  trees[currentTree].forEach(p => {
    p.childIds = p.childIds.filter(cid => cid != id);
    p.spouseIds = p.spouseIds.filter(sid => sid != id);
    if (p.fatherId == id) p.fatherId = null;
    if (p.motherId == id) p.motherId = null;
  });
  trees[currentTree] = trees[currentTree].filter(p => p.id != id);
  saveTrees(); render();
}

// -------------------- Toggle View --------------------
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

// -------------------- Relationship Modal --------------------
let currentRelationPerson = null;
function openRelationModal(personId) {
  currentRelationPerson = personId;
  document.getElementById("relationModal").style.display = "block";
  populatePersonDropdown("existingPersonSelect");
}

function closeRelationModal() {
  document.getElementById("relationModal").style.display = "none";
}

// Populate existing person for relation dropdown
function populatePersonDropdown(selectId) {
  let select = document.getElementById(selectId);
  select.innerHTML = '<option value="">--Select Person--</option>';
  trees[currentTree].forEach(p => {
    let opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name + " (" + p.gender + ")";
    select.appendChild(opt);
  });
}

// Add relationship from dropdown
function addRelationFromDropdown() {
  let selectedId = document.getElementById("existingPersonSelect").value;
  let relation = document.getElementById("relationType").value;
  if (!selectedId || !relation) return alert("Select person and relation");

  let p1 = trees[currentTree].find(p => p.id == currentRelationPerson);
  let p2 = trees[currentTree].find(p => p.id == selectedId);
  if (!p1 || !p2) return;

  switch (relation) {
    case "son":
    case "daughter":
      p1.childIds.push(p2.id);
      if (p1.gender === "Male") p2.fatherId = p1.id;
      if (p1.gender === "Female") p2.motherId = p1.id;
      break;
    case "father":
      p2.fatherId = p1.id; if (!p1.childIds.includes(p2.id)) p1.childIds.push(p2.id); break;
    case "mother":
      p2.motherId = p1.id; if (!p1.childIds.includes(p2.id)) p1.childIds.push(p2.id); break;
    case "spouse":
      if (!p1.spouseIds.includes(p2.id)) p1.spouseIds.push(p2.id);
      if (!p2.spouseIds.includes(p1.id)) p2.spouseIds.push(p1.id); break;
    case "half-sibling":
      if (p1.fatherId && !p2.fatherId) p2.fatherId = p1.fatherId;
      else if (p1.motherId && !p2.motherId) p2.motherId = p1.motherId;
      break;
  }
  saveTrees(); closeRelationModal(); render();
}

// -------------------- Export --------------------
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
      doc.text(`${i + 1}. ${p.name} (${p.gender}) | Kulam: ${p.kulamFather || ""} ${p.kulamHusband || ""} | DOB: ${p.dob || ""}`, 10, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 10; }
    });
    y += 10;
  });
  doc.save("all-family-trees.pdf");
}

// -------------------- Initial Render --------------------
render();