
const fieldButtons = document.querySelectorAll(".field-builder button");
const formFields = document.getElementById("formFields");
const configurationPanel = document.getElementById("configurationPanel");
const previewForm = document.getElementById("previewForm");
const formName = document.getElementById("formName");
const saveFormButton = document.getElementById("saveForm");
const savedForms = document.getElementById("savedForms");
const savedResponses = document.getElementById("savedResponses");

let fields = JSON.parse(localStorage.getItem("formFields")) || [];
let forms = JSON.parse(localStorage.getItem("savedForms")) || [];
let allResponses = JSON.parse(localStorage.getItem("formResponses")) || [];

let fieldId = fields.length
    ? Math.max(...fields.map(field => field.id)) + 1
    : 1;

let selectedFieldId = null;
let editingFormId = null;
let draggedFieldId = null;

// LocalStorage Functions

function saveFields() {
    localStorage.setItem("formFields", JSON.stringify(fields));
}

function saveForms() {
    localStorage.setItem("savedForms", JSON.stringify(forms));
}

function saveResponses() {
    localStorage.setItem("formResponses", JSON.stringify(allResponses));
}

// Field Labels

function getFieldLabel(type) {
    const labels = {
        text: "Text Input",
        email: "Email Address",
        number: "Number",
        select: "Dropdown",
        radio: "Radio Buttons",
        checkbox: "Checkboxes",
        date: "Date"
    };

    return labels[type];
}

// Add New Fields

fieldButtons.forEach(button => {
    button.addEventListener("click", function () {
        const fieldType = this.dataset.type;

        const newField = {
            id: fieldId++,
            type: fieldType,
            label: getFieldLabel(fieldType),
            placeholder: "Enter " + getFieldLabel(fieldType),
            required: true,
            options: ["Option 1", "Option 2"]
        };

        fields.push(newField);

        saveFields();
        displayFields();
        showConfiguration(newField.id);

        console.log("Added Field:", newField);
        console.log("All Fields:", fields);
    });
});

// Display Fields

function displayFields() {
    formFields.innerHTML = "";

    fields.forEach(field => {
        const fieldContainer = document.createElement("div");
        fieldContainer.className = "dynamic-field";
        fieldContainer.dataset.fieldId = field.id;
        fieldContainer.draggable = true;

        fieldContainer.addEventListener("click", function (event) {
            if (event.target.classList.contains("drag-handle")) {
                return;
            }

            showConfiguration(field.id);
        });

        const dragHandle = document.createElement("button");
        dragHandle.type = "button";
        dragHandle.className = "drag-handle";
        dragHandle.textContent = "☰ Drag to reorder";
        dragHandle.draggable = true;

        const label = document.createElement("label");
        label.textContent = field.label + (field.required ? " *" : "");

        let input;

        if (field.type === "select") {
            input = document.createElement("select");

            const placeholderOption = document.createElement("option");
            placeholderOption.value = "";
            placeholderOption.textContent = "Select an option";
            placeholderOption.disabled = true;
            placeholderOption.selected = true;

            input.appendChild(placeholderOption);

            field.options.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                input.appendChild(optionElement);
            });

        } else if (field.type === "radio" || field.type === "checkbox") {
            input = document.createElement("div");

            field.options.forEach(option => {
                const choiceLabel = document.createElement("label");
                const choice = document.createElement("input");

                choice.type = field.type;
                choice.name = "field-" + field.id;
                choice.value = option;

                choiceLabel.appendChild(choice);
                choiceLabel.append(" " + option);

                input.appendChild(choiceLabel);
            });

        } else {
            input = document.createElement("input");
            input.type = field.type;
            input.placeholder = field.placeholder;

            if (field.type === "number") {
                input.min = "0";
            }
        }

        input.dataset.fieldId = field.id;

        if (field.type !== "checkbox" && field.type !== "radio") {
            input.required = field.required;
        }

        if (field.type === "radio") {
            const firstChoice = input.querySelector("input");

            if (firstChoice) {
                firstChoice.required = field.required;
            }
        }

        fieldContainer.appendChild(dragHandle);
        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);

        formFields.appendChild(fieldContainer);

        // Drag and Drop Events

        dragHandle.addEventListener("dragstart", function (event) {
            draggedFieldId = field.id;

            fieldContainer.classList.add("dragging");

            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(field.id));
        });

        dragHandle.addEventListener("dragend", function () {
            draggedFieldId = null;

            document.querySelectorAll(".dynamic-field").forEach(item => {
                item.classList.remove("dragging", "drag-over");
            });
        });

        fieldContainer.addEventListener("dragover", function (event) {
            event.preventDefault();

            if (Number(draggedFieldId) !== field.id) {
                fieldContainer.classList.add("drag-over");
            }
        });

        fieldContainer.addEventListener("dragleave", function () {
            fieldContainer.classList.remove("drag-over");
        });

        fieldContainer.addEventListener("drop", function (event) {
            event.preventDefault();

            fieldContainer.classList.remove("drag-over");

            const movingId = Number(
                event.dataTransfer.getData("text/plain")
            ) || draggedFieldId;

            if (!movingId || movingId === field.id) return;

            const movingIndex = fields.findIndex(
                item => item.id === movingId
            );

            const targetIndex = fields.findIndex(
                item => item.id === field.id
            );

            if (movingIndex === -1 || targetIndex === -1) return;

            const movedField = fields.splice(movingIndex, 1)[0];

            fields.splice(targetIndex, 0, movedField);

            saveFields();
            displayFields();

            console.log("Fields Reordered:", fields);
        });
    });

    document.querySelectorAll(".dynamic-field").forEach(item => {
        item.classList.toggle(
            "selected",
            Number(item.dataset.fieldId) === selectedFieldId
        );
    });
}

// Field Configuration

function showConfiguration(id) {
    selectedFieldId = id;

    const field = fields.find(item => item.id === id);

    if (!field) return;

    displayFields();

    configurationPanel.innerHTML = `
        <label>Field Label</label>
        <input type="text" id="fieldLabel" required>

        <label>Placeholder</label>
        <input type="text" id="fieldPlaceholder">

        <label class="required-setting">
            <input type="checkbox" id="fieldRequired">
            Required Field
        </label>

        ${
            ["select", "radio", "checkbox"].includes(field.type)
                ? `
                    <label>Options (one per line)</label>
                    <textarea id="fieldOptions"></textarea>
                `
                : ""
        }

        <button type="button" id="saveConfiguration">
            Save Changes
        </button>
    `;

    document.getElementById("fieldLabel").value = field.label;
    document.getElementById("fieldPlaceholder").value = field.placeholder;
    document.getElementById("fieldRequired").checked = field.required;

    const optionsInput = document.getElementById("fieldOptions");

    if (optionsInput) {
        optionsInput.value = field.options.join("\n");
    }

    document.getElementById("saveConfiguration")
        .addEventListener("click", updateConfiguration);
}

// Update Configuration

function updateConfiguration() {
    const field = fields.find(item => item.id === selectedFieldId);

    if (!field) return;

    const label = document.getElementById("fieldLabel").value.trim();

    if (label === "") {
        alert("Please enter a field label.");
        return;
    }

    field.label = label;
    field.placeholder = document.getElementById("fieldPlaceholder").value;
    field.required = document.getElementById("fieldRequired").checked;

    const optionsInput = document.getElementById("fieldOptions");

    if (optionsInput) {
        const options = optionsInput.value
            .split("\n")
            .map(option => option.trim())
            .filter(option => option !== "");

        if (options.length === 0) {
            alert("Please add at least one option.");
            return;
        }

        field.options = options;
    }

    saveFields();
    displayFields();
    showConfiguration(field.id);

    console.log("Updated Field:", field);
    console.log("All Fields:", fields);
}

// Save or Update Form

saveFormButton.addEventListener("click", function () {
    const name = formName.value.trim();

    if (name === "") {
        alert("Please enter a form name.");
        return;
    }

    if (fields.length === 0) {
        alert("Please add fields before saving the form.");
        return;
    }

    if (editingFormId !== null) {
        const form = forms.find(item => item.id === editingFormId);

        if (!form) return;

        form.name = name;
        form.fields = JSON.parse(JSON.stringify(fields));

        editingFormId = null;
        saveFormButton.textContent = "Save Form";

        console.log("Form Updated:", form);

    } else {
        const newForm = {
            id: Date.now(),
            name: name,
            fields: JSON.parse(JSON.stringify(fields))
        };

        forms.push(newForm);

        console.log("New Form Saved:", newForm);
    }

    saveForms();
    displaySavedForms();

    formName.value = "";
});

// Display Saved Forms

function displaySavedForms() {
    savedForms.innerHTML = "<h3>Saved Forms</h3>";

    if (forms.length === 0) {
        savedForms.innerHTML +=
            '<p class="empty-message">No saved forms yet.</p>';
        return;
    }

    forms.forEach(form => {
        const formCard = document.createElement("div");
        formCard.className = "saved-form";

        const title = document.createElement("h3");
        title.textContent = form.name;

        const fieldCount = document.createElement("p");
        fieldCount.textContent = "Total Fields: " + form.fields.length;

        const loadButton = document.createElement("button");
        loadButton.textContent = "Open";
        loadButton.addEventListener("click", function () {
            loadForm(form.id);
        });

        const editButton = document.createElement("button");
        editButton.className = "edit-form";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editForm(form.id);
        });

        const duplicateButton = document.createElement("button");
        duplicateButton.textContent = "Duplicate";
        duplicateButton.addEventListener("click", function () {
            duplicateForm(form.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-form";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            deleteForm(form.id);
        });

        formCard.appendChild(title);
        formCard.appendChild(fieldCount);
        formCard.appendChild(loadButton);
        formCard.appendChild(editButton);
        formCard.appendChild(duplicateButton);
        formCard.appendChild(deleteButton);

        savedForms.appendChild(formCard);
    });

    console.log("All Saved Forms:", forms);
}

// Open Saved Form

function loadForm(id) {
    const form = forms.find(item => item.id === id);

    if (!form) return;

    fields = JSON.parse(JSON.stringify(form.fields));

    fieldId = fields.length
        ? Math.max(...fields.map(field => field.id)) + 1
        : 1;

    editingFormId = null;
    formName.value = form.name;
    saveFormButton.textContent = "Save Form";

    selectedFieldId = null;

    saveFields();
    displayFields();

    configurationPanel.innerHTML =
        "<p>Select a field to configure its settings.</p>";

    console.log("Opened Form:", form);
}

// Edit Form

function editForm(id) {
    const form = forms.find(item => item.id === id);

    if (!form) return;

    loadForm(id);

    editingFormId = id;
    saveFormButton.textContent = "Update Form";

    console.log("Editing Form:", form);
}

// Duplicate Form

function duplicateForm(id) {
    const form = forms.find(item => item.id === id);

    if (!form) return;

    const duplicate = {
        id: Date.now(),
        name: form.name + " Copy",
        fields: JSON.parse(JSON.stringify(form.fields))
    };

    forms.push(duplicate);

    saveForms();
    displaySavedForms();

    console.log("Duplicated Form:", duplicate);
}

// Delete Form

function deleteForm(id) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this form?"
    );

    if (!confirmDelete) return;

    forms = forms.filter(item => item.id !== id);

    saveForms();
    displaySavedForms();

    if (editingFormId === id) {
        editingFormId = null;
        saveFormButton.textContent = "Save Form";
        formName.value = "";
    }

    console.log("Form Deleted:", id);
    console.log("Remaining Forms:", forms);
}

// Validate Form

function validateForm() {
    if (fields.length === 0) {
        alert("Please add at least one field before submitting.");
        return false;
    }

    for (const field of fields) {
        if (!field.required) continue;

        const fieldElement = formFields.querySelector(
            `[data-field-id="${field.id}"]`
        );

        if (!fieldElement) {
            alert("Please complete all required fields.");
            return false;
        }

        if (field.type === "radio" || field.type === "checkbox") {
            const selectedOptions = fieldElement.querySelectorAll(
                "input:checked"
            );

            if (selectedOptions.length === 0) {
                alert("Please complete " + field.label + ".");
                return false;
            }

        } else if (fieldElement.value.trim() === "") {
            alert("Please complete " + field.label + ".");
            fieldElement.focus();
            return false;
        }
    }

    return previewForm.reportValidity();
}

// Submit Form

previewForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateForm()) return;

    const responseData = {};

    fields.forEach(field => {
        const fieldElement = formFields.querySelector(
            `[data-field-id="${field.id}"]`
        );

        if (field.type === "checkbox") {
            responseData[field.label] = Array.from(
                fieldElement.querySelectorAll("input:checked")
            ).map(input => input.value);

        } else if (field.type === "radio") {
            const selected = fieldElement.querySelector("input:checked");

            responseData[field.label] = selected ? selected.value : "";

        } else {
            responseData[field.label] = fieldElement.value;
        }
    });

    const response = {
        id: Date.now(),
        formId: editingFormId,
        formName: formName.value.trim() || "Untitled Form",
        submittedAt: new Date().toLocaleString(),
        data: responseData
    };

    allResponses.push(response);

    saveResponses();
    displayResponses();

    console.log("Form Submitted Successfully:", response);
    console.log("All Saved Responses:", allResponses);

    alert("Form submitted successfully!");

    previewForm.reset();
});

// Display Saved Responses

function displayResponses() {
    savedResponses.innerHTML = "<h3>Submitted Responses</h3>";

    if (allResponses.length === 0) {
        savedResponses.innerHTML +=
            '<p class="empty-message">No responses submitted yet.</p>';
        return;
    }

    allResponses.forEach((response, index) => {
        const responseCard = document.createElement("div");
        responseCard.className = "response-card";

        const title = document.createElement("h3");
        title.textContent = response.formName;

        const number = document.createElement("p");
        number.textContent = "Response: " + (index + 1);

        const date = document.createElement("p");
        date.textContent = "Submitted: " + response.submittedAt;

        const content = document.createElement("pre");
        content.textContent = JSON.stringify(response.data, null, 2);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Response";

        deleteButton.addEventListener("click", function () {
            deleteResponse(response.id);
        });

        responseCard.appendChild(title);
        responseCard.appendChild(number);
        responseCard.appendChild(date);
        responseCard.appendChild(content);
        responseCard.appendChild(deleteButton);

        savedResponses.appendChild(responseCard);
    });

    console.log("All Displayed Responses:", allResponses);
}

// Delete Response

function deleteResponse(id) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this response?"
    );

    if (!confirmDelete) return;

    allResponses = allResponses.filter(
        response => response.id !== id
    );

    saveResponses();
    displayResponses();

    console.log("Response Deleted:", id);
    console.log("Remaining Responses:", allResponses);
}

// Initial Load

displayFields();
displaySavedForms();
displayResponses();

console.log("Loaded Saved Fields:", fields);
console.log("Loaded Saved Forms:", forms);
console.log("Loaded Saved Responses:", allResponses);

