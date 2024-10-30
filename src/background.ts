// background.ts

/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
  console.log("Contact Reminder Extension installed");
  // Set up initial contacts or storage structure if needed
  chrome.storage.local.set({ contacts: [] });

  // Periodically check and update badge
  chrome.alarms.create("checkContacts", { periodInMinutes: 1 });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkContacts") {
      updateBadge();
    }
  });
});

// Update the badge with the number of contacts to be contacted now
function updateBadge(): void {
  chrome.storage.local.get("contacts", (result: { contacts: Contact[] }) => {
    const contacts = result.contacts || [];
    const now = new Date();
    const dueContacts = contacts.filter(
      (contact) => new Date(contact.nextContactDate) <= now
    );

    if (dueContacts.length > 0) {
      chrome.action.setBadgeText({ text: dueContacts.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "green" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  });
}

// When the user logs a contact, update the storage and badge
chrome.runtime.onMessage.addListener(
  (
    message: LogContactMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: Function
  ) => {
    if (message.type === "logContact") {
      chrome.storage.local.get(
        "contacts",
        (result: { contacts: Contact[] }) => {
          const contacts = result.contacts || [];
          const updatedContacts = contacts.map((contact) => {
            if (contact.name === message.name) {
              contact.nextContactDate = new Date();
              contact.nextContactDate.setDate(
                contact.nextContactDate.getDate() + contact.frequency
              );
            }
            return contact;
          });
          chrome.storage.local.set({ contacts: updatedContacts }, () => {
            updateBadge();
            sendResponse({ success: true });
          });
          return true; // Keep the message channel open for sendResponse
        }
      );
    } else if (message.type === "getContacts") {
      chrome.storage.local.get(
        "contacts",
        (result: { contacts: Contact[] }) => {
          sendResponse({ contacts: result.contacts || [] });
        }
      );
      return true; // Keep the message channel open for sendResponse
    }
  }
);

interface Contact {
  name: string;
  frequency: number;
  nextContactDate: Date;
}

interface LogContactMessage {
  type: string;
  name: string;
  frequency: number;
}
