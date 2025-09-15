// Family Tree App - merged final app.js
// Data model: trees = { "Tree Name": [ persons ] }
// person: { id, name, surname, gender, place, dob, dod, status, story, kulamFather, kulamHusband, married(boolean), spouseIds:[], spouseId, fatherId, motherId, childIds:[], image }

let trees = JSON.parse(localStorage.getItem("trees") || "{}");
let currentTree = Object.keys(trees)[0] || "Default Tree";
if (!trees[currentTree]) trees[currentTree] = [];

function saveTrees(){ localStorage.setItem("trees", JSON.stringify(trees)); }

// -------- Tree selector & management --------
function renderTreeSelector(){
  const sel = document.getElementById("treeSelect");
  sel.innerHTML = "";
  Object.keys(trees).forEach(name=>{
    const o = document.createElement("option"); o.value = name; o.textContent = name;
    if (name === currentTree) o.selected = true;
    sel.appendChild(o);
  });
}
function createTree(){
  const name = prompt("New tree name:");
  if (!name) return;
  if (trees[name]) { alert("Already exists"); return; }
  trees[name] = [];
  currentTree = name;
  saveTrees(); render();
}
function switchTree(){ currentTree = document.getElementById("treeSelect").value; render(); }
function deleteCurrentTree(){
  if (!confirm(`Delete tree "${currentTree}"?`)) return;
  delete trees[currentTree];
  const keys = Object.keys(trees);
  currentTree = keys[0] || "Default Tree";
  if (!trees[currentTree]) trees[currentTree] = [];
  saveTrees(); render();
}

// -------- Person Modal (Add/Edit) --------
let currentEditingId = null;

function openPersonModal(editId=null, basePersonId=null, relation=null){
  currentEditingId = editId;
  document.getElementById("personModal").style.display = "flex";
  document.getElementById("modalTitle").textContent = editId ? "Edit Person" : "Add Person";

  // reset form
  document.getElementById("personForm").reset();
  document.getElementById("imagePreviewWrap").innerHTML = "";

  populateParentSpouseDropdowns();

  // if called to add in relation context, pre-select relative
  if (basePersonId && relation) {
    // when adding child of basePerson, fill corresponding father/mother
    if (relation === "son" || relation === "daughter") {
      const base = trees[currentTree].find(p=>p.id==basePersonId);
      if (base){
        if (base.gender==="Male") document.getElementById("personFather").value = base.id;
        if (base.gender==="Female") document.getElementById("personMother").value = base.id;
      }
    }
  }

  if (editId){
    const p = trees[currentTree].find(x=>x.id==editId);
    if (!p) return;
    document.getElementById("personName").value = p.name || "";
    document.getElementById("personSurname").value = p.surname || "";
    document.getElementById("personGender").value = p.gender || "";
    document.getElementById("personPlace").value = p.place || "";
    document.getElementById("personKulamFather").value = p.kulamFather || "";
    document.getElementById("personKulamHusband").value = p.kulamHusband || "";
    document.getElementById("personMarried").checked = !!p.married;
    document.getElementById("personDOB").value = p.dob || "";
    document.getElementById("personStatus").value = p.status || "Alive";
    document.getElementById("personDOD").value = p.dod || "";
    document.getElementById("personStory").value = p.story || "";
    document.getElementById("personSpouse").value = p.spouseId || "";
    document.getElementById("personFather").value = p.fatherId || "";
    document.getElementById("personMother").value = p.motherId || "";
    if (p.image){
      document.getElementById("imagePreviewWrap").innerHTML = `<img src="${p.image}" style="width:100px;height:100px;border-radius:50%;border:4px solid ${p.status==='Alive'?'#00a000':'#e02020'}">`;
    }
  } else {
    onGenderChange();
    onStatusChange();
  }
}

function closePersonModal(){
  currentEditingId = null;
  document.getElementById("personModal").style.display = "none";
}

// populate spouse/father/mother selects
function populateParentSpouseDropdowns(){
  const people = trees[currentTree];
  const sp = document.getElementById("personSpouse");
  const f = document.getElementById("personFather");
  const m = document.getElementById("personMother");
  [sp,f,m].forEach(el => el.innerHTML = '<option value="">-- none --</option>');
  people.forEach(p=>{
    const label = p.name + (p.surname ? " " + p.surname : "") + " ("+p.gender+")";
    const optSp = document.createElement("option"); optSp.value = p.id; optSp.textContent = label; sp.appendChild(optSp);
    const optF = document.createElement("option"); optF.value = p.id; optF.textContent = label; f.appendChild(optF);
    const optM = document.createElement("option"); optM.value = p.id; optM.textContent = label; m.appendChild(optM);
  });
}

function onGenderChange(){
  const g = document.getElementById("personGender").value;
  const row = document.getElementById("husbandKulamRow");
  if (g === "Female") row.style.display = "block"; else { row.style.display = "none"; document.getElementById("personKulamHusband").value=""; document.getElementById("personMarried").checked=false;}
}
function onMarriedChange(){
  // married checkbox toggles husband kulam input enabled
  const married = document.getElementById("personMarried").checked;
  document.getElementById("personKulamHusband").disabled = !married;
}

function onStatusChange(){
  const status = document.getElementById("personStatus").value;
  document.getElementById("deathRow").style.display = status === "Dead" ? "block" : "none";
}

// image selection
function onImageSelected(e){
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("imagePreviewWrap").innerHTML = `<img src="${reader.result}" style="width:100px;height:100px;border-radius:50%;border:4px solid ${document.getElementById("personStatus").value==='Alive'?'#00a000':'#e02020'}">`;
    // store data in a temp property on modal
    document.getElementById("personModal").dataset.tempImage = reader.result;
  };
  reader.readAsDataURL(file);
}
function deleteProfilePic(){
  document.getElementById("imagePreviewWrap").innerHTML = "";
  delete document.getElementById("personModal").dataset.tempImage;
  if (currentEditingId){
    const p = trees[currentTree].find(x=>x.id==currentEditingId);
    if (p){ p.image = null; saveTrees(); render(); }
  }
}

// -------- Save person --------
function savePerson(){
  const id = currentEditingId || Date.now() + Math.floor(Math.random()*999);
  const name = document.getElementById("personName").value.trim();
  if (!name){ alert("Please enter name"); return; }
  const surname = document.getElementById("personSurname").value.trim();
  const gender = document.getElementById("personGender").value;
  const place = document.getElementById("personPlace").value.trim();
  const kulamFather = document.getElementById("personKulamFather").value.trim();
  const married = !!document.getElementById("personMarried").checked;
  let kulamHusband = document.getElementById("personKulamHusband").value.trim();
  const dob = document.getElementById("personDOB").value;
  const status = document.getElementById("personStatus").value;
  const dod = document.getElementById("personDOD").value;
  const spouseId = document.getElementById("personSpouse").value || null;
  const fatherId = document.getElementById("personFather").value || null;
  const motherId = document.getElementById("personMother").value || null;
  const story = document.getElementById("personStory").value || "";

  // Kulam rules
  if (gender === "Male") kulamHusband = "";
  if (gender === "Female" && !married) kulamHusband = "";

  // image
  const modal = document.getElementById("personModal");
  const imgData = modal.dataset.tempImage || null;
  // If editing and no new image, preserve existing image if present
  let existingImage = null;
  if (currentEditingId){
    const pOld = trees[currentTree].find(x=>x.id==currentEditingId);
    existingImage = pOld ? pOld.image : null;
  }
  const image = imgData || existingImage || null;

  const person = {
    id, name, surname, gender, place, dob, dod, status, story,
    kulamFather, kulamHusband, married, spouseIds: [], spouseId: spouseId || null,
    fatherId: fatherId || null, motherId: motherId || null, childIds: [], image
  };

  // Insert or update
  const existingIndex = trees[currentTree].findIndex(p=>p.id==id);
  if (existingIndex >= 0) {
    // keep childIds / spouseIds if present
    person.childIds = trees[currentTree][existingIndex].childIds || [];
    person.spouseIds = trees[currentTree][existingIndex].spouseIds || [];
    trees[currentTree][existingIndex] = person;
  } else {
    trees[currentTree].push(person);
  }

  // Update parents' child lists
  trees[currentTree].forEach(p=>{
    // father
    if (p.id == fatherId && !p.childIds.includes(id)) p.childIds.push(id);
    // mother
    if (p.id == motherId && !p.childIds.includes(id)) p.childIds.push(id);
  });

  // Update spouse mutual links
  if (spouseId){
    const spouse = trees[currentTree].find(p=>p.id==spouseId);
    if (spouse && !spouse.spouseIds.includes(id)) spouse.spouseIds.push(id);
    if (spouse && !person.spouseIds.includes(spouseId)) person.spouseIds.push(spouseId);
  }

  // clear modal temp data
  delete modal.dataset.tempImage;
  currentEditingId = null;
  saveTrees();
  closePersonModal();
  render();
}

// -------- List view rendering --------
function renderListView(){
  const div = document.getElementById("listView");
  div.innerHTML = "";
  if (!currentTree) return;
  trees[currentTree].forEach(p=>{
    const card = document.createElement("div"); card.className = "person";
    const alive = p.status !== "Dead";
    const border = alive ? "#00a000" : "#e02020";
    card.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:78px">
          ${p.image ? `<img src="${p.image}" style="width:72px;height:72px;border-radius:50%;border:4px solid ${border};">` : `<div style="width:72px;height:72px;border-radius:50%;background:#dfeaff;border:4px solid ${border};"></div>`}
        </div>
        <div style="flex:1">
          <div style="font-weight:600">${p.name} ${p.surname || ""}</div>
          <div style="color:var(--muted)">${p.place || ""} • ${p.dob || ""} ${p.dod? "— "+p.dod : ""}</div>
          <div style="margin-top:6px;color:var(--blue)">Kulam: ${p.kulamFather || ""} ${p.gender==="Female" && p.kulamHusband? " | Husband's: " + p.kulamHusband : ""}</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <button onclick="openPersonModal(${p.id})">Edit</button>
        <button onclick="deletePerson(${p.id})">Delete</button>
        <button onclick="uploadImageFor(${p.id})">Upload Photo</button>
        <button onclick="clearPhoto(${p.id})">Remove Photo</button>
        <button onclick="openRelationModal(${p.id})">+ Relation</button>
      </div>
    `;
    div.appendChild(card);
  });
}

// -------- upload/remove photo from list --------
function uploadImageFor(id){
  const input = document.createElement("input");
  input.type = "file"; input.accept = "image/*";
  input.onchange = e=>{
    const f = e.target.files[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = ()=> {
      const p = trees[currentTree].find(x=>x.id==id);
      if (p){ p.image = fr.result; saveTrees(); render(); }
    };
    fr.readAsDataURL(f);
  };
  input.click();
}
function clearPhoto(id){ const p = trees[currentTree].find(x=>x.id==id); if (p){ p.image=null; saveTrees(); render(); } }

// -------- Delete person --------
function deletePerson(id){
  if (!confirm("Delete this person?")) return;
  trees[currentTree] = trees[currentTree].filter(p=>p.id!=id);
  // remove references
  trees[currentTree].forEach(p=>{
    p.childIds = (p.childIds||[]).filter(cid=>cid!=id);
    p.spouseIds = (p.spouseIds||[]).filter(sid=>sid!=id);
    if (p.fatherId==id) p.fatherId=null;
    if (p.motherId==id) p.motherId=null;
    if (p.spouseId==id) p.spouseId=null;
  });
  saveTrees(); render();
}

// -------- Toggle list/tree --------
function toggleView(){
  const list = document.getElementById("listView");
  const tree = document.getElementById("treeView");
  if (list.style.display === "none"){
    list.style.display=""; tree.style.display="none";
  } else {
    list.style.display="none"; tree.style.display="";
    renderTreeView();
  }
}

// -------- Relation modal --------
let currentRelationPerson = null;
function openRelationModalRoot(){
  currentRelationPerson = null;
  populateRelationModal();
  document.getElementById("relationModal").style.display = "flex";
}
function openRelationModal(personId){
  currentRelationPerson = personId;
  populateRelationModal(personId);
  document.getElementById("relationModal").style.display = "flex";
}
function closeRelationModal(){ document.getElementById("relationModal").style.display="none"; }

function populateRelationModal(selectBase=null){
  const base = document.getElementById("relationBase");
  const existing = document.getElementById("existingPersonSelect");
  base.innerHTML = '<option value="">--Select base person--</option>';
  existing.innerHTML = '<option value="">--Select person--</option>';
  trees[currentTree].forEach(p=>{
    const o1 = document.createElement("option"); o1.value = p.id; o1.textContent = p.name + (p.surname? " "+p.surname : "");
    const o2 = o1.cloneNode(true);
    base.appendChild(o1); existing.appendChild(o2);
  });
  if (selectBase) base.value = selectBase;
}

function addRelationFromModal(){
  const baseId = document.getElementById("relationBase").value;
  const otherId = document.getElementById("existingPersonSelect").value;
  const rel = document.getElementById("relationType").value;
  const base = currentRelationPerson || baseId;
  if (!base || !otherId || !rel) return alert("Select base, person and relation");
  linkRelationship(parseInt(base), parseInt(otherId), rel);
  saveTrees(); closeRelationModal(); render();
}

// -------- Link relationship logic --------
function linkRelationship(id1,id2,relation){
  const p1 = trees[currentTree].find(x=>x.id==id1);
  const p2 = trees[currentTree].find(x=>x.id==id2);
  if (!p1 || !p2) return;
  switch(relation){
    case "father":
      p2.fatherId = p1.id; if (!p1.childIds.includes(p2.id)) p1.childIds.push(p2.id); break;
    case "mother":
      p2.motherId = p1.id; if (!p1.childIds.includes(p2.id)) p1.childIds.push(p2.id); break;
    case "son":
    case "daughter":
      if (!p1.childIds.includes(p2.id)) p1.childIds.push(p2.id);
      if (p1.gender==="Male") p2.fatherId = p1.id;
      if (p1.gender==="Female") p2.motherId = p1.id;
      break;
    case "spouse":
      if (!p1.spouseIds.includes(p2.id)) p1.spouseIds.push(p2.id);
      if (!p2.spouseIds.includes(p1.id)) p2.spouseIds.push(p1.id);
      p1.spouseId = p2.id; p2.spouseId = p1.id; break;
    case "half-sibling":
      let wh = prompt("Share which parent? (father/mother)").toLowerCase();
      if (wh==="father" && p1.fatherId) p2.fatherId = p1.fatherId;
      else if (wh==="mother" && p1.motherId) p2.motherId = p1.motherId;
      break;
  }
}

// -------- D3 tree rendering (couple nodes side-by-side) --------
function renderTreeView(){
  const container = document.getElementById("treeView");
  container.innerHTML = "";
  if (!currentTree) return;
  const people = trees[currentTree];
  if (!people || people.length===0) return;

  // Build root nodes (people without parents)
  const roots = people.filter(p => !p.fatherId && !p.motherId);
  const virtualRoot = { id: "root", children: roots.map(r=> buildSubtree(r, people)) };

  drawD3Tree(virtualRoot, container);
}

function buildSubtree(person, people){
  const spouseId = person.spouseId || (person.spouseIds && person.spouseIds[0]) || null;
  const members = [person];
  if (spouseId){
    const sp = people.find(x=>x.id==spouseId);
    if (sp) members.push(sp);
  }
  // children: those who have this person as a parent
  const kids = people.filter(ch => ch.fatherId==person.id || ch.motherId==person.id);
  const children = kids.map(k => buildSubtree(k, people));
  return { id: "pair_"+person.id, members, children };
}

function drawD3Tree(data, container){
  d3.select(container).selectAll("svg").remove();
  const width = Math.max(900, container.clientWidth || 1000);
  const height = Math.max(600, 600);

  const svg = d3.select(container).append("svg").attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform","translate(40,40)");

  const root = d3.hierarchy(data, d=> d.children);
  const tree = d3.tree().nodeSize([160, 140]);
  tree(root);

  // links
  g.selectAll(".link").data(root.links())
    .enter().append("path").attr("class","link")
    .attr("d", d=>{
      const sx = d.source.x, sy = d.source.y+30;
      const tx = d.target.x, ty = d.target.y-30;
      return `M${sx},${sy} C ${sx},${(sy+ty)/2} ${tx},${(sy+ty)/2} ${tx},${ty}`;
    });

  const node = g.selectAll(".node").data(root.descendants()).enter().append("g")
    .attr("class","node").attr("transform", d => `translate(${d.x},${d.y})`);

  node.each(function(d){
    const el = d3.select(this);
    const members = d.data.members || [];
    const spacing = 44;
    if (members.length===2){
      renderPersonCircle(el, members[0], -spacing);
      renderPersonCircle(el, members[1], spacing);
      renderNameBox(el, members[0], -spacing);
      renderNameBox(el, members[1], spacing);
    } else if (members.length===1){
      renderPersonCircle(el, members[0], 0);
      renderNameBox(el, members[0], 0);
    }
  });

  // overlay + buttons (HTML) to attach relation actions — we create an overlay div
  const overlayId = "__rel_overlay";
  let overlay = document.getElementById(overlayId);
  if (overlay) overlay.remove();
  overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.style.position = "absolute";
  overlay.style.left = container.getBoundingClientRect().left + "px";
  overlay.style.top = container.getBoundingClientRect().top + "px";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.pointerEvents = "none";
  document.body.appendChild(overlay);

  // place + buttons
  node.each(function(d){
    const members = d.data.members || [];
    const tr = this.getAttribute("transform");
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(tr);
    if (!m) return;
    const baseX = parseFloat(m[1]) + 40;
    const baseY = parseFloat(m[2]) + 40;
    members.forEach((person, idx)=>{
      const offset = (members.length===2) ? (idx===0 ? -44 : 44) : 0;
      const bx = baseX + offset;
      const by = baseY - 54;
      const btn = document.createElement("button");
      btn.textContent = "+";
      btn.style.position = "absolute";
      btn.style.left = (bx - 12) + "px";
      btn.style.top = (by - 12) + "px";
      btn.style.width = "26px"; btn.style.height = "26px";
      btn.style.borderRadius = "50%";
      btn.style.border = "2px solid var(--node-border)";
      btn.style.background = "#fff";
      btn.style.cursor = "pointer";
      btn.style.pointerEvents = "auto";
      btn.onclick = (ev)=>{ ev.stopPropagation(); openRelationModal(person.id); };
      overlay.appendChild(btn);
    });
  });
}

function renderPersonCircle(el, person, dx){
  const alive = person.status !== "Dead";
  const border = alive ? "#00a000" : "#e02020";
  const g = el.append("g").attr("transform", `translate(${dx},0)`);
  g.append("circle").attr("r",30).attr("fill","#eaf3ff").attr("stroke","#233e8b").attr("stroke-width",3);
  if (person.image){
    const clip = "clip_"+person.id;
    const defs = g.append("defs");
    const cp = defs.append("clipPath").attr("id", clip);
    cp.append("circle").attr("r",26);
    g.append("image").attr("xlink:href", person.image).attr("x",-26).attr("y",-26).attr("width",52).attr("height",52).attr("clip-path", `url(#${clip})`);
    g.append("circle").attr("r",30).attr("fill","none").attr("stroke",border).attr("stroke-width",4);
  } else {
    g.append("circle").attr("r",22).attr("fill","#cfe7ff");
    g.append("circle").attr("r",30).attr("fill","none").attr("stroke",border).attr("stroke-width",4);
  }
  g.style("cursor","pointer").on("click", ()=> openPersonModal(person.id));
}

function renderNameBox(el, person, dx){
  const g = el.append("g").attr("transform", `translate(${dx},40)`);
  const fullname = (person.name||"") + (person.surname ? " "+person.surname : "");
  const width = Math.max(80, Math.min(160, fullname.length*7 + 20));
  g.append("rect").attr("x",-width/2).attr("y",0).attr("width",width).attr("height",26).attr("rx",12).attr("ry",12).attr("class","name-box");
  g.append("text").attr("x",0).attr("y",16).attr("text-anchor","middle").text(fullname);
}

// -------- Render everything --------
function render(){
  renderTreeSelector();
  renderListView();
  // show list by default
  const list = document.getElementById("listView");
  const tree = document.getElementById("treeView");
  if (list.style.display === "none"){
    renderTreeView();
  } else {
    renderListView();
  }
}

// wrapper for tree render
function renderTreeView(){ renderTreeViewInternal(); }
function renderTreeViewInternal(){ renderTreeView(); }

// -------- Export / Import JSON (Replace or Merge) --------
function exportAllJSON(){
  const blob = new Blob([JSON.stringify(trees, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "all-family-trees.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

// Merge helper: map old ids -> new ids
function mergeImportedTrees(imported){
  // imported is object of treeName -> persons
  Object.keys(imported).forEach(treeName=>{
    const persons = imported[treeName];
    if (!trees[treeName]) trees[treeName] = [];
    const existing = trees[treeName];
    // mapping old->new
    const map = {};
    persons.forEach(p=>{
      const newId = Date.now() + Math.floor(Math.random()*10000);
      map[p.id] = newId;
      const copy = Object.assign({}, p);
      copy.id = newId;
      copy.childIds = []; copy.spouseIds = copy.spouseIds || [];
      existing.push(copy);
    });
    // second pass: fix parent/spouse/child ids to mapped ones
    existing.forEach(ep=>{
      if (ep.fatherId && map[ep.fatherId]) ep.fatherId = map[ep.fatherId];
      if (ep.motherId && map[ep.motherId]) ep.motherId = map[ep.motherId];
      if (ep.spouseId && map[ep.spouseId]) ep.spouseId = map[ep.spouseId];
      if (ep.childIds && ep.childIds.length){
        ep.childIds = ep.childIds.map(cid => map[cid] || cid);
      }
      if (ep.spouseIds && ep.spouseIds.length){
        ep.spouseIds = ep.spouseIds.map(sid => map[sid] || sid);
      }
    });
  });
}

function handleImport(e){
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || typeof imported !== 'object') throw new Error("Invalid JSON");
      const replace = confirm("Replace current saved trees with imported file? Click OK to Replace, Cancel to Merge.");
      if (replace) {
        trees = imported;
      } else {
        mergeImportedTrees(imported);
      }
      // set currentTree to first key
      currentTree = Object.keys(trees)[0] || "Default Tree";
      if (!trees[currentTree]) trees[currentTree] = [];
      saveTrees(); render(); alert("Import successful");
    } catch(err){
      alert("Import failed: invalid JSON");
    }
  };
  reader.readAsText(file);
}

// -------- Export PDF (simple listing) --------
function exportAllPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  Object.keys(trees).forEach(treeName=>{
    doc.setFontSize(14); doc.text(`Tree: ${treeName}`,10,y); y+=8;
    trees[treeName].forEach((p,i)=>{
      doc.setFontSize(10);
      let kulamDisplay = p.kulamFather || "";
      if (p.gender==="Female" && p.kulamHusband) kulamDisplay += " | Husband's: " + p.kulamHusband;
      doc.text(`${i+1}. ${p.name} ${p.surname||""} (${p.gender}) | ${p.place||""} | Kulam: ${kulamDisplay}`,10,y);
      y+=6; if (y>280){ doc.addPage(); y=10; }
    });
    y+=8;
  });
  doc.save("family-trees.pdf");
}

// -------- Initialize / bootstrap UI --------
function renderListView(){
  renderTreeSelector();
  const div = document.getElementById("listView");
  div.innerHTML = "";
  const people = trees[currentTree] || [];
  people.forEach(p=>{
    const card = document.createElement("div"); card.className = "person";
    const alive = p.status !== "Dead";
    const border = alive ? "#00a000" : "#e02020";
    card.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:78px">${p.image? `<img src="${p.image}" style="width:72px;height:72px;border-radius:50%;border:4px solid ${border}">` : `<div style="width:72px;height:72px;border-radius:50%;background:#dfeaff;border:4px solid ${border}"></div>`}</div>
        <div style="flex:1">
          <div style="font-weight:600">${p.name} ${p.surname||""}</div>
          <div style="color:var(--muted)">${p.place||""} • ${p.dob||""} ${p.dod? "— "+p.dod : ""}</div>
          <div style="margin-top:6px;color:var(--blue)">Kulam: ${p.kulamFather || ""} ${p.gender==="Female" && p.kulamHusband? " | Husband's: " + p.kulamHusband : ""}</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <button onclick="openPersonModal(${p.id})">Edit</button>
        <button onclick="deletePerson(${p.id})">Delete</button>
        <button onclick="uploadImageFor(${p.id})">Upload Photo</button>
        <button onclick="clearPhoto(${p.id})">Remove Photo</button>
        <button onclick="openRelationModal(${p.id})">+ Relation</button>
      </div>
    `;
    div.appendChild(card);
  });
  // ensure tree view is rendered as needed
  const tree = document.getElementById("treeView");
  if (tree.style.display !== "none") renderTreeView();
}

function render(){
  renderTreeSelector();
  if (!trees[currentTree]) trees[currentTree]=[];
  renderListView();
  renderTreeView(); // keep it updated
}

// initial render
render();