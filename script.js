"use strict";

// ==========================================
// OOP CONCEPT 1: CLASS
// ==========================================

class Reminder {
    constructor(title, category, dueDate, description, completed = false) {
        this.id =
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : Date.now().toString() + Math.random().toString(36).slice(2);

        this.title = title;
        this.category = category;
        this.dueDate = dueDate;
        this.description = description;
        this.completed = completed;
    }

    // Get reminder status
    getStatus() {
        if (this.completed) {
            return "completed";
        }

        if (this.dueDate < getToday()) {
            return "overdue";
        }

        return "upcoming";
    }

    // Format due date
    getFormattedDate() {
        const [year, month, day] = this.dueDate.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    // Complete or undo reminder
    toggleComplete() {
        this.completed = !this.completed;
    }
}

// ==========================================
// GET TODAY'S LOCAL DATE
// ==========================================

function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ==========================================
// VALIDATE DATE
// ==========================================

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// ==========================================
// APP DATA
// ==========================================

let reminders = [];
let currentFilter = "all";

// ==========================================
// SAVE REMINDERS TO LOCAL STORAGE
// ==========================================

function saveReminders() {
    try {
        localStorage.setItem(
            "dueDateBuddyReminders",
            JSON.stringify(reminders)
        );

        return true;
    } catch (error) {
        console.error("Could not save reminders:", error);

        showMessage(
            "Unable to save reminders. Check your browser storage settings.",
            "error"
        );

        return false;
    }
}

// ==========================================
// LOAD SAVED REMINDERS
// ==========================================

function loadReminders() {
    try {
        const saved = localStorage.getItem("dueDateBuddyReminders");

        if (!saved) {
            reminders = [];
            return;
        }

        const data = JSON.parse(saved);

        if (!Array.isArray(data)) {
            reminders = [];
            return;
        }

        reminders = data
            .filter(item =>
                item &&
                typeof item.title === "string" &&
                item.title.trim() !== "" &&
                typeof item.dueDate === "string" &&
                isValidDate(item.dueDate)
            )
            .map(item => {
                const reminder = new Reminder(
                    item.title,
                    item.category || "Other",
                    item.dueDate,
                    item.description || "",
                    item.completed === true
                );

                reminder.id = String(item.id || reminder.id);

                return reminder;
            });
    } catch (error) {
        console.error("Could not load reminders:", error);
        reminders = [];

        showMessage(
            "Could not load saved reminders.",
            "error"
        );
    }
}

// ==========================================
// DISPLAY SUCCESS OR ERROR MESSAGES
// ==========================================

function showMessage(message, type) {
    const messageBox = document.getElementById("message");

    if (!messageBox) {
        console.warn("Missing HTML element with id='message'.", message);
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
}

// ==========================================
// ADD A NEW REMINDER
// ==========================================

function addReminder(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const category =
        document.getElementById("category").value || "Other";
    const dueDateInput = document.getElementById("dueDate");
    const dueDate = dueDateInput.value;
    const description =
        document.getElementById("description").value.trim();

    // Check required fields
    if (title === "" || dueDate === "") {
        showMessage(
            "Please enter a title and select a due date.",
            "error"
        );
        return;
    }

    // Validate calendar date
    if (!isValidDate(dueDate)) {
        showMessage(
            "Please select a valid calendar date.",
            "error"
        );
        return;
    }

    // Create a new Reminder object
    const reminder = new Reminder(
        title,
        category,
        dueDate,
        description
    );

    // Add reminder to the array
    reminders.unshift(reminder);

    // Save and display
    const saved = saveReminders();
    renderReminders();

    // Reset form
    document.getElementById("reminderForm").reset();

    // Prevent selecting past dates
    dueDateInput.min = getToday();

    if (saved) {
        showMessage(
            "Reminder added successfully!",
            "success"
        );
    }
}

// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {
    document.getElementById("totalCount").textContent =
        reminders.length;

    document.getElementById("upcomingCount").textContent =
        reminders.filter(
            reminder => reminder.getStatus() === "upcoming"
        ).length;

    document.getElementById("overdueCount").textContent =
        reminders.filter(
            reminder => reminder.getStatus() === "overdue"
        ).length;

    document.getElementById("completedCount").textContent =
        reminders.filter(
            reminder => reminder.completed
        ).length;
}

// ==========================================
// DISPLAY REMINDERS
// ==========================================

function renderReminders() {
    const list = document.getElementById("reminderList");

    if (!list) {
        console.error("Missing HTML element with id='reminderList'.");
        return;
    }

    const searchInput = document.getElementById("searchInput");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    // Filter reminders by search and status
    const filtered = reminders.filter(reminder => {
        const matchesSearch =
            reminder.title.toLowerCase().includes(searchText) ||
            reminder.category.toLowerCase().includes(searchText) ||
            reminder.description.toLowerCase().includes(searchText);

        const matchesFilter =
            currentFilter === "all" ||
            reminder.getStatus() === currentFilter;

        return matchesSearch && matchesFilter;
    });

    // Sort reminders by completion and due date
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        return a.dueDate.localeCompare(b.dueDate);
    });

    // Update statistics
    updateStatistics();

    // Clear existing reminder cards
    list.replaceChildren();

    // Show empty message
    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-message";

        const heading = document.createElement("h3");
        heading.textContent = "No reminders found 📭";

        const paragraph = document.createElement("p");
        paragraph.textContent =
            "Add a reminder or try another search.";

        empty.append(heading, paragraph);
        list.appendChild(empty);

        return;
    }

    // Create reminder cards
    filtered.forEach(reminder => {
        const status = reminder.getStatus();

        const card = document.createElement("article");
        card.className = `reminder-card ${status}`;

        // Reminder title
        const heading = document.createElement("h3");
        heading.textContent = reminder.title;

        // Category
        const category = document.createElement("p");
        category.textContent = `Category: ${reminder.category}`;

        // Due date
        const date = document.createElement("p");
        date.textContent =
            `📅 Due date: ${reminder.getFormattedDate()}`;

        // Description
        const description = document.createElement("p");
        description.textContent =
            reminder.description || "No description added.";

        // Status badge
        const badge = document.createElement("span");
        badge.className = `status ${status}`;

        const statusLabels = {
            upcoming: "Upcoming",
            overdue: "Overdue",
            completed: "Completed"
        };

        badge.textContent = statusLabels[status];

        // Action buttons container
        const actions = document.createElement("div");
        actions.className = "card-actions";

        // Complete or undo button
        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.className = "complete-btn";

        completeButton.textContent = reminder.completed
            ? "↩ Undo"
            : "✓ Complete";

        completeButton.addEventListener("click", () => {
            toggleReminder(reminder.id);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "🗑 Delete";

        deleteButton.addEventListener("click", () => {
            deleteReminder(reminder.id);
        });

        // Assemble the card
        actions.append(completeButton, deleteButton);

        card.append(
            heading,
            category,
            date,
            description,
            badge,
            actions
        );

        list.appendChild(card);
    });
}

// ==========================================
// COMPLETE OR UNDO A REMINDER
// ==========================================

function toggleReminder(id) {
    const reminder = reminders.find(
        item => item.id === id
    );

    if (!reminder) {
        return;
    }

    reminder.toggleComplete();

    saveReminders();
    renderReminders();
}

// ==========================================
// DELETE A REMINDER
// ==========================================

function deleteReminder(id) {
    const reminder = reminders.find(
        item => item.id === id
    );

    if (!reminder) {
        return;
    }

    const confirmed = confirm(
        `Delete "${reminder.title}"?`
    );

    if (!confirmed) {
        return;
    }

    reminders = reminders.filter(
        item => item.id !== id
    );

    saveReminders();
    renderReminders();

    showMessage(
        "Reminder deleted successfully.",
        "success"
    );
}

// ==========================================
// FILTER BUTTONS
// ==========================================

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter || "all";

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                btn === button
            );
        });

        renderReminders();
    });
});

// ==========================================
// SEARCH REMINDERS
// ==========================================

const searchInputElement =
    document.getElementById("searchInput");

if (searchInputElement) {
    searchInputElement.addEventListener(
        "input",
        renderReminders
    );
}

// ==========================================
// CONNECT THE FORM
// ==========================================

const reminderFormElement =
    document.getElementById("reminderForm");

if (reminderFormElement) {
    reminderFormElement.addEventListener(
        "submit",
        addReminder
    );
} else {
    console.error(
        "Missing HTML element with id='reminderForm'."
    );
}

// ==========================================
// START THE APPLICATION
// ==========================================

const dueDateElement =
    document.getElementById("dueDate");

if (dueDateElement) {
    dueDateElement.min = getToday();
}

loadReminders();
renderReminders();