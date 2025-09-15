let familyData = [];
let selectedPersonId = null;
let personIdCounter = 1;

function addPerson(parentId = null, relationship = null) {
    selectedPersonId = null;
    document.getElementById("personForm").reset();
    document.getElementById("personId").value = "";
    document.getElementById("relationship").value = relationship || "";
    document.getElementById("parentId").value = parentId || "";
    document.getElementById("imagePreview").src = "";
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("personModal").style.display = "block";
}

function editPerson(id) {
    const person = familyData.find(p => p.id === id);
    if (!person) return;
    selectedPersonId = id;

    document.getElementById("personId").value = person.id;
    document.getElementById("name").value = person.name;
    document.getElementById("gender").value = person.gender;
    document.getElementById("dob").value = person.dob || "";
    document.getElementById("dod").value = person.dod || "";
    document.getElementById("status").value = person.status || "alive";
    document.getElementById("kulamFather").value = person.kulamFather || "";
    document.getElementById("kulamHusband").value = person.kulamHusband || "";
    document.getElementById("place").value = person.place || "";

    if (person.image) {
        document.getElementById("imagePreview").src = person.image;
        document.getElementById("imagePreview").style.display = "block";
    }

    document.getElementById("personModal").style.display = "block";
}

function savePerson() {
    const id = document.getElementById("personId").value || personIdCounter++;
    const name = document.getElementById("name").value;
    const gender = document.getElementById("gender").value;
    const dob = document.getElementById("dob").value;
    const dod = document.getElementById("dod").value;
    const status = document.getElementById("status").value;
    const kulamFather = document.getElementById("kulamFather").value;
    const kulamHusband = document.getElementById("kulamHusband").value;
    const place = document.getElementById("place").value;
    const parentId = document.getElementById("parentId").value || null;
    const relationship = document.getElementById("relationship").value || null;

    const imagePreview = document.getElementById("imagePreview").src;
    const image = imagePreview.includes("base64") ? imagePreview : "";

    const personData = {
        id,
        name,
        gender,
        dob,
        dod,
        status,
        kulamFather,
        kulamHusband,
        place,
        image,
        parentId,
        relationship
    };

    if (selectedPersonId) {
        const index = familyData.findIndex(p => p.id == selectedPersonId);
        familyData[index] = personData;
    } else {
        familyData.push(personData);
    }

    closeModal();
    renderTree();
}

function closeModal() {
    document.getElementById("personForm").reset();
    document.getElementById("personModal").style.display = "none";
    selectedPersonId = null;
}

function deletePerson(id) {
    familyData = familyData.filter(p => p.id !== id);
    renderTree();
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const output = document.getElementById("imagePreview");
        output.src = reader.result;
        output.style.display = "block";
    };
    reader.readAsDataURL(event.target.files[0]);
}

function removeImage() {
    document.getElementById("imagePreview").src = "";
    document.getElementById("imagePreview").style.display = "none";
}

function renderTree() {
    const container = document.getElementById("familyTree");
    container.innerHTML = "";

    const roots = familyData.filter(p => !p.parentId);
    roots.forEach(root => {
        container.appendChild(createPersonNode(root));
    });
}

function createPersonNode(person) {
    const wrapper = document.createElement("div");
    wrapper.className = "person-wrapper";

    const node = document.createElement("div");
    node.className = "person-node";

    if (person.image) {
        const img = document.createElement("img");
        img.src = person.image;
        img.className = "profile-pic";
        img.style.border = `3px solid ${person.status === "alive" ? "green" : "red"}`;
        node.appendChild(img);
    }

    const details = document.createElement("div");
    details.innerHTML = `
        <strong>${person.name}</strong><br>
        ${person.gender}<br>
        ${person.kulamFather ? "Kulam (Father): " + person.kulamFather + "<br>" : ""}
        ${person.gender === "female" && person.kulamHusband ? "Kulam (Husband): " + person.kulamHusband + "<br>" : ""}
        ${person.place ? "Place: " + person.place + "<br>" : ""}
    `;
    node.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML = `
        <button onclick="addPerson('${person.id}', 'child')">+Child</button>
        <button onclick="editPerson('${person.id}')">Edit</button>
        <button onclick="deletePerson('${person.id}')">Delete</button>
    `;
    node.appendChild(actions);

    wrapper.appendChild(node);

    const children = familyData.filter(p => p.parentId == person.id);
    if (children.length > 0) {
        const childContainer = document.createElement("div");
        childContainer.className = "children";
        children.forEach(child => {
            childContainer.appendChild(createPersonNode(child));
        });
        wrapper.appendChild(childContainer);
    }

    return wrapper;
}

// iCloud export
function exportToICloud() {
    const data = JSON.stringify(familyData);
    const blob = new Blob([data], { type: "application/json" });
    const file = new File([blob], "familyTree.json", { type: "application/json" });
    if (window.iCloud) {
        window.iCloud.upload(file);
    } else {
        alert("iCloud integration not available in browser. Use mobile app.");
    }
}

// iCloud import
function importFromICloud(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        familyData = JSON.parse(event.target.result);
        renderTree();
    };
    reader.readAsText(file);
}