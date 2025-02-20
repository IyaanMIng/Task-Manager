import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDh6XZOGFQn-WXwY0ixQ1VAnBftCR4rkxA",
  authDomain: "login-in-task-manager.firebaseapp.com",
  projectId: "login-in-task-manager",
  storageBucket: "login-in-task-manager.appspot.com",
  messagingSenderId: "94458561886",
  appId: "1:94458561886:web:2e08f0fa12aaabee3bfbcf",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Show message to user
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) {
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.opacity = 0;
    }, 5000);
  }
}

// ------------------- AUTHENTICATION -------------------
document.addEventListener("DOMContentLoaded", () => {
  // Handle Sign Up
  document.getElementById("submitSignUp")?.addEventListener("click", (event) => {
    event.preventDefault();
    const email = document.getElementById("rEmail").value;
    const password = document.getElementById("rPassword").value;
    const firstName = document.getElementById("fName").value;
    const lastName = document.getElementById("lName").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = { email, firstName, lastName };
        showMessage("Account Created Successfully", "signUpMessage");

        const docRef = doc(db, "users", user.uid);
        setDoc(docRef, userData)
          .then(() => {
            window.location.href = "kanban.html"; // Redirect after successful sign-up
          })
          .catch((error) => {
            console.error("Error writing document:", error);
            showMessage("Error creating user data", "signUpMessage");
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === "auth/email-already-in-use") {
          showMessage("Email Address Already Exists!!!", "signUpMessage");
        } else {
          showMessage("Unable to create User", "signUpMessage");
        }
      });
  });

  // Handle Sign In
  document.getElementById("submitSignIn")?.addEventListener("click", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "kanban.html"; // Redirect to Kanban board
      })
      .catch(() => {
        showMessage("Invalid credentials or account not found", "signInMessage");
      });
  });

  // Handle Reset Password
  document.getElementById("submitResetPassword")?.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("Reset Password button clicked!"); // Debugging: Check if this logs in the console

    const email = document.getElementById("resetEmail").value;
    if (!email) {
      showMessage("Please enter your email address.", "resetPasswordMessage");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        showMessage("Password reset email sent. Check your inbox.", "resetPasswordMessage");
      })
      .catch((error) => {
        console.error("Reset Password Error:", error);
        showMessage("Failed to send reset email. Please try again.", "resetPasswordMessage");
      });
  });

  // Toggle Reset Password Form
  document.getElementById("forgotPasswordLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("signIn").style.display = "none"; // Hide Sign In form
    document.getElementById("resetPasswordForm").style.display = "block"; // Show Reset Password form
  });

  // Go back to Sign In form
  document.getElementById("backToSignIn")?.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("resetPasswordForm").style.display = "none"; // Hide Reset Password form
    document.getElementById("signIn").style.display = "block"; // Show Sign In form
  });
});

// ------------------- TASK MANAGEMENT -------------------
let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (window.location.pathname !== "/kanban.html") {
      window.location.href = "kanban.html";
    }
    currentUser = user;
    loadTasks(user.uid);
  } else {
    if (window.location.pathname !== "/index.html") {
      window.location.href = "index.html";
    }
  }
});

// Add task
document.getElementById("add-task")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const title = document.getElementById("task-title").value;
  const desc = document.getElementById("task-desc").value;
  const date = document.getElementById("task-date").value;

  if (!title || !desc || !date) {
    alert("Please fill all fields!");
    return;
  }

  await addDoc(collection(db, "tasks"), {
    userId: currentUser.uid,
    title,
    description: desc,
    date,
    status: "todo",
  });

  document.getElementById("task-title").value = "";
  document.getElementById("task-desc").value = "";
  document.getElementById("task-date").value = "";
});

// Drag-and-Drop Functions
function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text");
  const taskElement = document.getElementById(taskId);
  const newStatus = event.target.getAttribute("data-status");

  taskElement.remove();
  event.target.appendChild(taskElement);

  const docRef = doc(db, "tasks", taskId);
  updateDoc(docRef, { status: newStatus });
}

function attachDragAndDropListeners() {
  const columns = document.querySelectorAll(".task-list");
  columns.forEach((column) => {
    column.addEventListener("dragover", allowDrop);
    column.addEventListener("drop", drop);
  });
}

// Load tasks with drag-and-drop support
function loadTasks(userId) {
  const q = query(collection(db, "tasks"), where("userId", "==", userId));
  onSnapshot(q, (snapshot) => {
    const todoColumn = document.querySelector(".task-list[data-status='todo']");
    const inProgressColumn = document.querySelector(".task-list[data-status='in-progress']");
    const doneColumn = document.querySelector(".task-list[data-status='done']");

    todoColumn.innerHTML = "";
    inProgressColumn.innerHTML = "";
    doneColumn.innerHTML = "";

    snapshot.forEach((taskDoc) => {
      const task = taskDoc.data();
      const taskDiv = document.createElement("div");
      taskDiv.className = "task";
      taskDiv.id = taskDoc.id;
      taskDiv.draggable = true;
      taskDiv.ondragstart = drag;
      taskDiv.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p><strong>Due:</strong> ${new Date(task.date).toLocaleString()}</p>
        <select>
          <option value="todo" ${task.status === "todo" ? "selected" : ""}>To Do</option>
          <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
          <option value="done" ${task.status === "done" ? "selected" : ""}>Done</option>
        </select>
        <button class="delete-task">Delete</button>
      `;

      taskDiv.querySelector("select").addEventListener("change", async (e) => {
        const docRef = doc(db, "tasks", taskDoc.id);
        await updateDoc(docRef, { status: e.target.value });
      });

      const deleteButton = taskDiv.querySelector(".delete-task");
      deleteButton.addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this task?")) {
          const docRef = doc(db, "tasks", taskDoc.id);
          await deleteDoc(docRef);
          taskDiv.remove();
        }
      });

      if (task.status === "todo") todoColumn.appendChild(taskDiv);
      else if (task.status === "in-progress") inProgressColumn.appendChild(taskDiv);
      else if (task.status === "done") doneColumn.appendChild(taskDiv);
    });

    attachDragAndDropListeners();
    updateChart();
  });
}

// Progress Report Chart
let taskChart;

function updateChart() {
  const chartElement = document.getElementById("taskChart");
  if (!chartElement) return;

  const todoCount = document.querySelector(".task-list[data-status='todo']").children.length;
  const inProgressCount = document.querySelector(".task-list[data-status='in-progress']").children.length;
  const doneCount = document.querySelector(".task-list[data-status='done']").children.length;

  const chartData = {
    labels: ["To Do", "In Progress", "Done"],
    datasets: [{
      label: "Tasks",
      data: [todoCount, inProgressCount, doneCount],
      backgroundColor: ["#007bff", "#ffc107", "#28a745"],
    }],
  };

  const ctx = chartElement.getContext("2d");

  if (taskChart) {
    taskChart.destroy();
  }

  taskChart = new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Sign out
document.getElementById("signOutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html?signout=true"; // Redirect after sign-out
  });
});
