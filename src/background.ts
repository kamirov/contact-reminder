"use strict";

interface Contact {
  name: string;
  frequency: number; // in days
  nextContactDate: Date;
}

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
function updateBadge() {
  chrome.storage.local.get("contacts", (result) => {
    const contacts = (result.contacts || []).map((contact: Contact) => ({
      ...contact,
      nextContactDate: new Date(contact.nextContactDate),
    }));
    const now = new Date();
    const dueContacts = contacts.filter(
      (contact: Contact) => new Date(contact.nextContactDate) <= now
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message", message);
  if (message.type === "logContact" || message.type === "delayContact") {
    chrome.storage.local.get("contacts", (result) => {
      const contacts = (result.contacts || []).map((contact: Contact) => ({
        ...contact,
        nextContactDate: new Date(contact.nextContactDate),
      }));
      const updatedContacts = contacts.map((contact: Contact) => {
        if (contact.name === message.name) {
          contact.nextContactDate = new Date();
          const offsetFactor = 0.8 + Math.random() * 0.4;
          const adjustedFrequency = Math.round(
            contact.frequency * offsetFactor
          );
          contact.nextContactDate.setDate(
            contact.nextContactDate.getDate() + adjustedFrequency
          );
        }
        return contact;
      });
      const serializedContacts = updatedContacts.map((contact: Contact) => ({
        ...contact,
        nextContactDate: contact.nextContactDate.toISOString(),
      }));
      chrome.storage.local.set({ contacts: serializedContacts }, () => {
        updateBadge();
        sendResponse({ success: true });
      });
      return true; // Keep the message channel open for sendResponse
    });
  } else if (message.type === "getContacts") {
    chrome.storage.local.get("contacts", (result) => {
      const contacts = (result.contacts || []).map((contact: Contact) => ({
        ...contact,
        nextContactDate: new Date(contact.nextContactDate),
      }));
      sendResponse({ contacts });
    });
    return true; // Keep the message channel open for sendResponse
  }
});
