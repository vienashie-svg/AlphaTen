const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const showLogin = document.getElementById("showLogin");
const showSignup = document.getElementById("showSignup");
const message = document.getElementById("message");

if (showLogin && showSignup) {
  showLogin.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    showLogin.classList.add("active");
    showSignup.classList.remove("active");
  });

  showSignup.addEventListener("click", () => {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    showSignup.classList.add("active");
    showLogin.classList.remove("active");
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password })
    });

    const data = await res.json();
    message.textContent = data.message;
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "/dashboard";
    } else {
      message.textContent = data.message;
    }
  });
}

async function loadDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    if (window.location.pathname.includes("dashboard")) {
      window.location.href = "/";
    }
    return;
  }

  const res = await fetch("/api/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const user = await res.json();

  const fullName = document.getElementById("fullName");
  if (!fullName) return;

  document.getElementById("fullName").textContent = user.fullName;
  document.getElementById("email").textContent = user.email;
  document.getElementById("phone").textContent = user.userInformation.phone || "N/A";
  document.getElementById("address").textContent = user.userInformation.address || "N/A";

  document.getElementById("tourProgressValue").textContent = `${user.tourProgress}%`;
  document.querySelector(".circle").style.background =
    `conic-gradient(#2563eb 0% ${user.tourProgress}%, #e5e7eb ${user.tourProgress}% 100%)`;

  const savedCoursesList = document.getElementById("savedCoursesList");
  savedCoursesList.innerHTML = "";
  user.savedCourses.forEach(course => {
    const li = document.createElement("li");
    li.textContent = `${course.name} - ${course.mode} - PHP ${course.tuition}`;
    savedCoursesList.appendChild(li);
  });

  document.getElementById("applicationStatus").textContent = user.applicationStatus;

  document.getElementById("onlineTuition").textContent = user.pricingComparison.onlineTuition;
  document.getElementById("limitedFtfTuition").textContent = user.pricingComparison.limitedFtfTuition;

  const paymentSchemes = document.getElementById("paymentSchemes");
  paymentSchemes.innerHTML = "";
  user.pricingComparison.paymentSchemes.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.type}: PHP ${item.amount}`;
    paymentSchemes.appendChild(li);
  });

  const notificationsList = document.getElementById("notificationsList");
  notificationsList.innerHTML = "";
  user.notifications.forEach(notif => {
    const li = document.createElement("li");
    li.textContent = `${notif.read ? "[Read]" : "[Unread]"} ${notif.title} - ${notif.message}`;
    notificationsList.appendChild(li);
  });

  const systemStatus = user.systemStatus || 0;
  document.getElementById("systemStatusBar").style.width = `${systemStatus}%`;
  document.getElementById("systemStatusText").textContent = `${systemStatus}% complete`;

  const faqList = document.getElementById("faqList");
  faqList.innerHTML = "";
  user.helpCenter.faqs.forEach(faq => {
    const li = document.createElement("li");
    li.textContent = faq;
    faqList.appendChild(li);
  });
}

const settingsForm = document.getElementById("settingsForm");
if (settingsForm) {
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const email = document.getElementById("newEmail").value;
    const password = document.getElementById("newPassword").value;

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    document.getElementById("settingsMessage").textContent = data.message;
    loadDashboard();
  });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  });
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", async (e) => {
    const token = localStorage.getItem("token");
    const q = e.target.value.trim();
    const suggestionsBox = document.getElementById("suggestions");

    if (!q) {
      suggestionsBox.innerHTML = "";
      return;
    }

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const suggestions = await res.json();
    suggestionsBox.innerHTML = "";

    suggestions.forEach(course => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = `${course.name} - ${course.mode} - PHP ${course.tuition}`;

      div.addEventListener("click", async () => {
        await fetch("/api/save-course", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(course)
        });

        suggestionsBox.innerHTML = "";
        searchInput.value = "";
        loadDashboard();
      });

      suggestionsBox.appendChild(div);
    });
  });
}

const markAllReadBtn = document.getElementById("markAllReadBtn");
if (markAllReadBtn) {
  markAllReadBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/notifications/mark-all-read", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log(data.message);
    loadDashboard();
  });
}

loadDashboard();