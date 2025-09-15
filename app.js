let family = [];
let photos = {};

function openForm(relativeId = null, relationship = "root") {
  document.getElementById("form-container").classList.remove("hidden");
  document.getElementById("personForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").innerText = "Add Person";
  document.getElementById("relationship").value = relationship;

  const relativeSelect = document.getElementById("relativePerson");
  relativeSelect.innerHTML = '<option value="">-- None --</option>';
  family.forEach(p => {
    let opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === relativeId) opt.selected = true;
    relativeSelect.appendChild(opt);
  });

  toggleKulamFields();
  toggleDeathDate();
  previewPhoto();
}

function closeForm() {
  document.getElementById("form-container").classList.add("hidden");
}

function savePerson(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value || Date.now().toString();
  const name = document.getElementById("name").value;
  const gender = document.getElementById("gender").value;
  const status = document.getElementById("status").value;
  const birthDate = document.getElementById("birthDate").value;
  const deathDate = document.getElementById("deathDate").value;
  const fatherKulam = document.getElementById("fatherKulam").value;
  const husbandKulam = document.getElementById("husbandKulam").value;
  const place = document.getElementById("place").value;
  const relationship = document.getElementById("relationship").value;
  const relativePerson = document.getElementById("relativePerson").value;

  const photoFile = document.getElementById("photo").files[0];
  if (photoFile) {
    const reader = new FileReader();
    reader.onload = () => {
      photos[id] = reader.result;
      updateFamily();
    };
    reader.readAsDataURL(photoFile);
  }

  const person = { id, name, gender, status, birthDate, deathDate, fatherKulam, husbandKulam, place, relationship, relativePerson };

  const existing = family.findIndex(p => p.id === id);
  if (existing >= 0) {
    family[existing] = person;
  } else {
    family.push(person);
  }

  closeForm();
  updateFamily();
}

function updateFamily() {
  const container = document.getElementById("tree-container");
  container.innerHTML = "";
  const roots = family.filter(p => p.relationship === "root");
  roots.forEach(r => {
    container.appendChild(buildNode(r));
  });
  localStorage.setItem("familyTree", JSON.stringify(family));
  localStorage.setItem("photos", JSON.stringify(photos));
}

function buildNode(person) {
  const node = document.createElement("div");
  node.className = "node " + person.status;

  const img = document.createElement("img");
  img.src = photos[person.id] || "https://via.placeholder.com/80";
  node.appendChild(img);

  const name = document.createElement("div");
  name.innerText = person.name;
  node.appendChild(name);

  if (person.gender === "female") {
    if (person.husbandKulam) {
      node.appendChild(document.createTextNode(`Kulam: ${person.fatherKulam} / ${person.husbandKulam}`));
    } else {
      node.appendChild(document.createTextNode(`Kulam: ${person.fatherKulam}`));
    }
  } else {
    if (person.fatherKulam) node.appendChild(document.createTextNode(`Kulam: ${person.fatherKulam}`));
  }

  if (person.place) {
    node.appendChild(document.createElement("br"));
    node.appendChild(document.createTextNode(`Place: ${person.place}`));
  }

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.innerHTML = `
    <button onclick="openForm('${person.id}')">✏️ Edit</button>
    <button onclick="deletePerson('${person.id}')">🗑️ Delete</button>
    <button onclick="openForm('${person.id}','son')">➕ Add Child</button>
    <button onclick="openForm('${person.id}','spouse')">➕ Add Spouse</button>
  `;
  node.appendChild(actions);

  const children = family.filter(p => p.relativePerson === person.id && (p.relationship === "son" || p.relationship === "daughter"));
  if (children.length) {
    const childContainer = document.createElement("div");
    childContainer.className = "children";
    children.forEach(c => childContainer.appendChild(buildNode(c)));
    node.appendChild(childContainer);
  }

  return node;
}

function deletePerson(id) {
  family = family.filter(p => p.id !== id && p.relativePerson !== id);
  delete photos[id];
  updateFamily();
}

function toggleDeathDate() {
  const status = document.getElementById("status").value;
  document.getElementById("deathDateLabel").style.display = status === "dead" ? "block" : "none";
}

function toggleKulamFields() {
  const gender = document.getElementById("gender").value;
  document.getElementById("fatherKulamLabel").style.display = "block";
  document.getElementById("husbandKulamLabel").style.display = gender === "female" ? "block" : "none";
}

function previewPhoto(event) {
  const file = event ? event.target.files[0] : null;
  const preview = document.getElementById("photoPreview");
  const deleteBtn = document.getElementById("deletePhotoBtn");
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
      deleteBtn.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    preview.classList.add("hidden");
    deleteBtn.classList.add("hidden");
  }
}

function deletePhoto() {
  document.getElementById("photo").value = "";
  document.getElementById("photoPreview").classList.add("hidden");
  document.getElementById("deletePhotoBtn").classList.add("hidden");
}

// Export / Import
function exportTree() {
  const data = JSON.stringify({ family, photos });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "family_tree.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importTree(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      family = data.family || [];
      photos = data.photos || {};
      updateFamily();
    } catch (err) {
      alert("Invalid file");
    }
  };
  reader.readAsText(file);
}

window.onload = () => {
  const savedFamily = localStorage.getItem("familyTree");
  const savedPhotos = localStorage.getItem("photos");
  if (savedFamily) family = JSON.parse(savedFamily);
  if (savedPhotos) photos = JSON.parse(savedPhotos);
  updateFamily();
};