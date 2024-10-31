document.addEventListener("DOMContentLoaded", () => {
  const viewTab = document.getElementById("viewTab") as HTMLButtonElement;
  const editTab = document.getElementById("editTab") as HTMLButtonElement;
  const viewScreen = document.getElementById("viewScreen") as HTMLDivElement;
  const editScreen = document.getElementById("editScreen") as HTMLDivElement;
  const contactList = document.getElementById(
    "contactList"
  ) as HTMLUListElement;
  const editContactList = document.getElementById(
    "editContactList"
  ) as HTMLUListElement;
  const addContactButton = document.getElementById(
    "addContactButton"
  ) as HTMLButtonElement;
  const newContactName = document.getElementById(
    "newContactName"
  ) as HTMLInputElement;
  const contactFrequency = document.getElementById(
    "contactFrequency"
  ) as HTMLInputElement;
  const exportButton = document.getElementById(
    "exportButton"
  ) as HTMLButtonElement;
  const importButton = document.getElementById(
    "importButton"
  ) as HTMLButtonElement;

  if (
    !viewTab ||
    !editTab ||
    !viewScreen ||
    !editScreen ||
    !contactList ||
    !editContactList ||
    !addContactButton ||
    !newContactName ||
    !contactFrequency
  ) {
    console.error("One or more elements are missing in the popup HTML");
    return;
  }

  interface Contact {
    name: string;
    frequency: number; // in days
    nextContactDate: Date;
  }

  let contacts: Contact[] = [];

  // Load contacts from storage when the popup opens
  chrome.storage.local.get("contacts", (result: { contacts: Contact[] }) => {
    contacts = (result.contacts || []).map((contact) => ({
      ...contact,
      nextContactDate: new Date(contact.nextContactDate),
    }));
    updateViewList();
    updateEditList();
  });

  // Toggle between view and edit screens
  viewTab.addEventListener("click", () => {
    viewTab.classList.add("active");
    editTab.classList.remove("active");
    viewScreen.classList.add("active");
    editScreen.classList.remove("active");
  });

  editTab.addEventListener("click", () => {
    editTab.classList.add("active");
    viewTab.classList.remove("active");
    editScreen.classList.add("active");
    viewScreen.classList.remove("active");
  });

  // Add a new contact
  addContactButton.addEventListener("click", () => {
    const name = newContactName.value.trim();
    const frequency = parseInt(contactFrequency.value, 10);

    if (name && !isNaN(frequency)) {
      const nextContactDate = new Date();
      nextContactDate.setDate(nextContactDate.getDate() + frequency);

      const newContact: Contact = {
        name,
        frequency,
        nextContactDate,
      };

      contacts.push(newContact);
      newContactName.value = "";
      contactFrequency.value = "";

      saveContacts();
      updateEditList();
      updateViewList();
    }
  });

  // Save contacts to chrome.storage
  function saveContacts(): void {
    const serializedContacts = contacts.map((contact) => ({
      ...contact,
      nextContactDate: contact.nextContactDate.toISOString(),
    }));
    chrome.storage.local.set({ contacts: serializedContacts }, () => {
      console.log("Contacts saved");
    });
  }

  // Update the view list
  function updateViewList() {
    function formatRelativeTime(date: Date): string {
      const now = new Date();
      const diffInMs = date.getTime() - now.getTime();
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays <= 0) return "today";
      if (diffInDays === 1) return "in 1 day";
      if (diffInDays < 7) return `in ${diffInDays} days`;
      if (diffInDays < 30) return `in ${Math.ceil(diffInDays / 7)} weeks`;
      if (diffInDays < 365) return `in ${Math.ceil(diffInDays / 30)} months`;
      return `in ${Math.ceil(diffInDays / 365)} years`;
    }
    contactList.innerHTML = "";

    contacts.forEach((contact, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${
        contact.name
      } - Next contact: ${formatRelativeTime(contact.nextContactDate)}`;

      if (new Date() >= contact.nextContactDate) {
        listItem.classList.add("due");
      }

      contactList.appendChild(listItem);

      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("button-container");
      listItem.appendChild(buttonContainer);

      const logButton = document.createElement("button");
      logButton.textContent = "Log";
      buttonContainer.appendChild(logButton);
      logButton.addEventListener("click", () => {
        contact.nextContactDate = new Date();
        contact.nextContactDate.setDate(
          contact.nextContactDate.getDate() + contact.frequency
        );
        saveContacts();
        updateViewList();
      });

      const delayButton = document.createElement("button");
      delayButton.textContent = "Later";
      buttonContainer.appendChild(delayButton);
      delayButton.addEventListener("click", () => {
        contact.nextContactDate.setDate(contact.nextContactDate.getDate() + 1);
        saveContacts();
        updateViewList();
      });
    });
  }

  // Update the edit list
  function updateEditList() {
    editContactList.innerHTML = "";

    contacts.forEach((contact, index) => {
      const listItem = document.createElement("li");
      editContactList.appendChild(listItem);

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = contact.name;
      listItem.appendChild(nameInput);
      nameInput.addEventListener("change", (e) => {
        contact.name = (e.target as HTMLInputElement).value;
        saveContacts();
      });

      const frequencyInput = document.createElement("input");
      frequencyInput.type = "number";
      frequencyInput.value = contact.frequency.toString();
      listItem.appendChild(frequencyInput);
      frequencyInput.addEventListener("change", (e) => {
        contact.frequency = parseInt((e.target as HTMLInputElement).value, 10);
        saveContacts();
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      listItem.appendChild(deleteButton);
      deleteButton.addEventListener("click", () => {
        contacts.splice(index, 1);
        saveContacts();
        updateEditList();
        updateViewList();
      });
    });
  }

  if (exportButton) {
    // Export contacts as JSON
    exportButton.addEventListener("click", () => {
      const dataStr = JSON.stringify(contacts, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      const currentDate = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `contacts_${currentDate}.json`;
      a.click();

      URL.revokeObjectURL(url);
    });
  }

  if (importButton) {
    // Import contacts from JSON
    importButton.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      fileInput.addEventListener("change", (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = e.target?.result;
            if (result) {
              const importedContacts: Contact[] = JSON.parse(
                result as string
              ).map((contact: any) => ({
                ...contact,
                nextContactDate: new Date(contact.nextContactDate),
              }));
              contacts = importedContacts;
              saveContacts();
              updateViewList();
              updateEditList();
            }
          } catch (error) {
            console.error("Error importing contacts: ", error);
          }
        };
        reader.readAsText(file);
      });
      fileInput.click();
    });
  }
});
