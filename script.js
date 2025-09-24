// Application State
let currentUser = null
let requests = []
let currentRequestId = 1

// Calendly Integration
const Calendly = window.Calendly // Declare Calendly variable

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Application initializing...")
  initializeApp()
})

function initializeApp() {
  // Check for stored authentication
  const storedAuth = localStorage.getItem("studyhelper_auth")
  if (storedAuth) {
    try {
      const authData = JSON.parse(storedAuth)
      if (authData.isAuthenticated && authData.user) {
        currentUser = authData.user
        showDashboard()
        return
      }
    } catch (error) {
      console.error("[v0] Error parsing stored auth:", error)
      localStorage.removeItem("studyhelper_auth")
    }
  }

  // Load demo data
  loadDemoData()

  // Show login screen
  setTimeout(() => {
    hideLoading()
    showLogin()
  }, 1000)

  // Initialize event listeners
  initializeEventListeners()
}

function loadDemoData() {
  // Load demo requests from localStorage or create default ones
  const storedRequests = localStorage.getItem("studyhelper_requests")
  if (storedRequests) {
    try {
      requests = JSON.parse(storedRequests)
      currentRequestId = Math.max(...requests.map((r) => r.id), 0) + 1
    } catch (error) {
      console.error("[v0] Error loading stored requests:", error)
      createDemoRequests()
    }
  } else {
    createDemoRequests()
  }
}

function createDemoRequests() {
  requests = [
    {
      id: 1,
      studentId: "student-1",
      studentName: "John Doe",
      studentEmail: "john@example.com",
      subject: "mathematics",
      topic: "Quadratic Equations",
      materialType: "quiz",
      difficulty: "intermediate",
      dueDate: "2024-01-15",
      requirements: "Focus on solving by factoring and completing the square methods.",
      status: "completed",
      createdAt: "2024-01-01T10:00:00Z",
      files: [
        {
          name: "Quadratic_Equations_Quiz.pdf",
          size: "245 KB",
          type: "application/pdf",
          url: "#",
        },
      ],
    },
    {
      id: 2,
      studentId: "student-1",
      studentName: "John Doe",
      studentEmail: "john@example.com",
      subject: "science",
      topic: "Cell Biology",
      materialType: "worksheet",
      difficulty: "beginner",
      dueDate: "2024-01-20",
      requirements: "Include diagrams of plant and animal cells with labeling exercises.",
      status: "in-progress",
      createdAt: "2024-01-05T14:30:00Z",
      files: [],
    },
    {
      id: 3,
      studentId: "student-2",
      studentName: "Jane Smith",
      studentEmail: "jane@example.com",
      subject: "english",
      topic: "Shakespeare Analysis",
      materialType: "study-guide",
      difficulty: "advanced",
      dueDate: "2024-01-25",
      requirements: "Focus on themes in Hamlet and character development analysis.",
      status: "pending",
      createdAt: "2024-01-08T09:15:00Z",
      files: [],
    },
  ]
  currentRequestId = 4
  saveRequests()
}

function initializeEventListeners() {
  // Login form
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Request form
  const requestForm = document.getElementById("request-form")
  if (requestForm) {
    requestForm.addEventListener("submit", handleRequestSubmit)
  }

  // File upload
  const fileInput = document.getElementById("file-input")
  const uploadArea = document.getElementById("upload-area")

  if (fileInput && uploadArea) {
    uploadArea.addEventListener("click", () => fileInput.click())
    uploadArea.addEventListener("dragover", handleDragOver)
    uploadArea.addEventListener("drop", handleFileDrop)
    fileInput.addEventListener("change", handleFileSelect)
  }

  // Set minimum date for due date input
  const dueDateInput = document.getElementById("due-date")
  if (dueDateInput) {
    const today = new Date().toISOString().split("T")[0]
    dueDateInput.min = today
  }
}

// Authentication Functions
function handleLogin(event) {
  event.preventDefault()
  console.log("[v0] Login form submitted")

  const formData = new FormData(event.target)
  const email = formData.get("email")
  const password = formData.get("password")

  console.log("[v0] Login attempt:", { email, passwordLength: password.length })

  // Simple authentication logic
  if (email === "owner@studyhelper.com" && password === "owner123") {
    currentUser = {
      id: "owner-1",
      email: email,
      name: "Dr. Smith",
      role: "owner",
    }
  } else if (email && password.length >= 6) {
    currentUser = {
      id: "student-1",
      email: email,
      name: email
        .split("@")[0]
        .replace(/[^a-zA-Z]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      role: "student",
    }
  } else {
    alert(
      "Invalid credentials. Use any email with 6+ character password for student access, or owner@studyhelper.com / owner123 for owner access.",
    )
    return
  }

  // Store authentication
  const authData = {
    user: currentUser,
    isAuthenticated: true,
  }
  localStorage.setItem("studyhelper_auth", JSON.stringify(authData))

  console.log("[v0] Login successful:", currentUser)
  showDashboard()
}

function logout() {
  console.log("[v0] Logging out")
  currentUser = null
  localStorage.removeItem("studyhelper_auth")
  showLogin()
}

function fillDemoStudent() {
  document.getElementById("email").value = "student@example.com"
  document.getElementById("password").value = "student123"
}

function fillDemoOwner() {
  document.getElementById("email").value = "owner@studyhelper.com"
  document.getElementById("password").value = "owner123"
}

// Screen Management
function hideLoading() {
  document.getElementById("loading").classList.add("hidden")
}

function showLogin() {
  hideAllScreens()
  document.getElementById("login-screen").classList.remove("hidden")
}

function showDashboard() {
  hideAllScreens()

  if (currentUser.role === "owner") {
    document.getElementById("owner-name").textContent = currentUser.name
    document.getElementById("owner-dashboard").classList.remove("hidden")
    loadOwnerDashboard()
  } else {
    document.getElementById("student-name").textContent = currentUser.name
    document.getElementById("student-dashboard").classList.remove("hidden")
    loadStudentDashboard()
    loadCalendlyWidget()
  }
}

function hideAllScreens() {
  const screens = document.querySelectorAll(".screen")
  screens.forEach((screen) => screen.classList.add("hidden"))
}

// Tab Management
function showTab(tabName) {
  // Update tab buttons
  const tabButtons = document.querySelectorAll(".tab-btn")
  tabButtons.forEach((btn) => btn.classList.remove("active"))
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active") // Use data attribute for tab buttons

  // Update tab content
  const tabContents = document.querySelectorAll(".tab-content")
  tabContents.forEach((content) => content.classList.remove("active"))
  document.getElementById(tabName + "-tab").classList.add("active")

  // Load Calendly widget if calendar tab is shown
  if (tabName === "calendar") {
    loadCalendlyWidget()
  }
}

// Student Dashboard Functions
function loadStudentDashboard() {
  const userRequests = requests.filter((req) => req.studentId === currentUser.id)

  // Update stats
  document.getElementById("total-requests").textContent = userRequests.length
  document.getElementById("pending-requests").textContent = userRequests.filter(
    (req) => req.status === "pending",
  ).length
  document.getElementById("completed-requests").textContent = userRequests.filter(
    (req) => req.status === "completed",
  ).length

  // Render requests list
  renderStudentRequests(userRequests)
}

function renderStudentRequests(userRequests) {
  const requestsList = document.getElementById("requests-list")

  if (userRequests.length === 0) {
    requestsList.innerHTML = `
            <div class="text-center" style="padding: 2rem; color: var(--text-muted);">
                <p>No requests yet. Create your first request using the "New Request" tab!</p>
            </div>
        `
    return
  }

  requestsList.innerHTML = userRequests
    .map(
      (request) => `
        <div class="request-card">
            <div class="request-header">
                <div>
                    <div class="request-title">${request.topic} - ${request.materialType}</div>
                    <div class="request-meta">Created ${formatDate(request.createdAt)} • Due ${formatDate(request.dueDate)}</div>
                </div>
                <span class="request-status status-${request.status}">${request.status.replace("-", " ")}</span>
            </div>
            
            <div class="request-details">
                <div class="request-detail">
                    <span class="request-detail-label">Subject</span>
                    <span class="request-detail-value">${capitalizeFirst(request.subject)}</span>
                </div>
                <div class="request-detail">
                    <span class="request-detail-label">Difficulty</span>
                    <span class="request-detail-value">${capitalizeFirst(request.difficulty)}</span>
                </div>
                <div class="request-detail">
                    <span class="request-detail-label">Type</span>
                    <span class="request-detail-value">${capitalizeFirst(request.materialType.replace("-", " "))}</span>
                </div>
            </div>
            
            ${
              request.requirements
                ? `
                <div class="request-requirements">
                    <p><strong>Requirements:</strong> ${request.requirements}</p>
                </div>
            `
                : ""
            }
            
            ${
              request.files && request.files.length > 0
                ? `
                <div class="request-files">
                    <h4 style="margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600;">Completed Materials:</h4>
                    <div class="file-list">
                        ${request.files
                          .map(
                            (file) => `
                            <div class="file-item">
                                <span class="file-icon">${getFileIcon(file.type)}</span>
                                <div class="file-info">
                                    <span class="file-name">${file.name}</span>
                                    <span class="file-size">${file.size}</span>
                                </div>
                                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="downloadFile('${file.url}', '${file.name}')">Download</button>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `,
    )
    .join("")
}

// Owner Dashboard Functions
function loadOwnerDashboard() {
  // Update stats
  document.getElementById("owner-total-requests").textContent = requests.length
  document.getElementById("owner-pending-requests").textContent = requests.filter(
    (req) => req.status === "pending",
  ).length
  document.getElementById("owner-in-progress-requests").textContent = requests.filter(
    (req) => req.status === "in-progress",
  ).length
  document.getElementById("owner-completed-requests").textContent = requests.filter(
    (req) => req.status === "completed",
  ).length

  // Render requests list
  renderOwnerRequests(requests)
}

function renderOwnerRequests(requestsToShow) {
  const requestsList = document.getElementById("owner-requests-list")

  if (requestsToShow.length === 0) {
    requestsList.innerHTML = `
            <div class="text-center" style="padding: 2rem; color: var(--text-muted);">
                <p>No requests found.</p>
            </div>
        `
    return
  }

  requestsList.innerHTML = requestsToShow
    .map(
      (request) => `
        <div class="owner-request-card">
            <div class="owner-request-header">
                <div class="student-info">
                    <span class="student-name">${request.studentName}</span>
                    <span class="student-email">${request.studentEmail}</span>
                </div>
                <div class="status-controls">
                    <select class="status-select" onchange="updateRequestStatus(${request.id}, this.value)">
                        <option value="pending" ${request.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="in-progress" ${request.status === "in-progress" ? "selected" : ""}>In Progress</option>
                        <option value="completed" ${request.status === "completed" ? "selected" : ""}>Completed</option>
                    </select>
                </div>
            </div>
            
            <div class="request-title" style="margin: 1rem 0 0.5rem 0; font-size: 1.125rem; font-weight: 600;">
                ${request.topic} - ${request.materialType}
            </div>
            
            <div class="request-details">
                <div class="request-detail">
                    <span class="request-detail-label">Subject</span>
                    <span class="request-detail-value">${capitalizeFirst(request.subject)}</span>
                </div>
                <div class="request-detail">
                    <span class="request-detail-label">Difficulty</span>
                    <span class="request-detail-value">${capitalizeFirst(request.difficulty)}</span>
                </div>
                <div class="request-detail">
                    <span class="request-detail-label">Due Date</span>
                    <span class="request-detail-value">${formatDate(request.dueDate)}</span>
                </div>
                <div class="request-detail">
                    <span class="request-detail-label">Created</span>
                    <span class="request-detail-value">${formatDate(request.createdAt)}</span>
                </div>
            </div>
            
            ${
              request.requirements
                ? `
                <div class="request-requirements">
                    <p><strong>Requirements:</strong> ${request.requirements}</p>
                </div>
            `
                : ""
            }
            
            <div class="request-actions">
                <button class="btn btn-primary" onclick="openUploadModal(${request.id})">Upload Files</button>
                ${
                  request.files && request.files.length > 0
                    ? `
                    <span style="color: var(--text-muted); font-size: 0.875rem;">${request.files.length} file(s) uploaded</span>
                `
                    : ""
                }
            </div>
            
            ${
              request.files && request.files.length > 0
                ? `
                <div class="request-files">
                    <h4 style="margin: 1rem 0 0.5rem 0; font-size: 0.875rem; font-weight: 600;">Uploaded Files:</h4>
                    <div class="file-list">
                        ${request.files
                          .map(
                            (file) => `
                            <div class="file-item">
                                <span class="file-icon">${getFileIcon(file.type)}</span>
                                <div class="file-info">
                                    <span class="file-name">${file.name}</span>
                                    <span class="file-size">${file.size}</span>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `,
    )
    .join("")
}

function filterRequests() {
  const filter = document.getElementById("status-filter").value
  let filteredRequests = requests

  if (filter !== "all") {
    filteredRequests = requests.filter((req) => req.status === filter)
  }

  renderOwnerRequests(filteredRequests)
}

function updateRequestStatus(requestId, newStatus) {
  const request = requests.find((req) => req.id === requestId)
  if (request) {
    request.status = newStatus
    saveRequests()
    loadOwnerDashboard()

    // Show success message
    showNotification(`Request status updated to ${newStatus.replace("-", " ")}`, "success")
  }
}

// Request Management
function handleRequestSubmit(event) {
  event.preventDefault()
  console.log("[v0] Request form submitted")

  const formData = new FormData(event.target)
  const newRequest = {
    id: currentRequestId++,
    studentId: currentUser.id,
    studentName: currentUser.name,
    studentEmail: currentUser.email,
    subject: formData.get("subject"),
    topic: formData.get("topic"),
    materialType: formData.get("materialType"),
    difficulty: formData.get("difficulty"),
    dueDate: formData.get("dueDate"),
    requirements: formData.get("requirements"),
    status: "pending",
    createdAt: new Date().toISOString(),
    files: [],
  }

  requests.push(newRequest)
  saveRequests()

  // Reset form
  event.target.reset()

  // Show success message and switch to requests tab
  showNotification("Request submitted successfully!", "success")
  showTab("requests")
  loadStudentDashboard()
}

function saveRequests() {
  localStorage.setItem("studyhelper_requests", JSON.stringify(requests))
}

// File Management
let currentUploadRequestId = null
let selectedFiles = []

function openUploadModal(requestId) {
  currentUploadRequestId = requestId
  selectedFiles = []
  document.getElementById("uploaded-files").innerHTML = ""
  document.getElementById("upload-modal").classList.remove("hidden")
}

function closeUploadModal() {
  document.getElementById("upload-modal").classList.add("hidden")
  currentUploadRequestId = null
  selectedFiles = []
}

function handleDragOver(event) {
  event.preventDefault()
  event.currentTarget.classList.add("dragover")
}

function handleFileDrop(event) {
  event.preventDefault()
  event.currentTarget.classList.remove("dragover")

  const files = Array.from(event.dataTransfer.files)
  handleFiles(files)
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  handleFiles(files)
}

function handleFiles(files) {
  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]

  const maxSize = 10 * 1024 * 1024 // 10MB

  files.forEach((file) => {
    if (!validTypes.includes(file.type)) {
      showNotification(`${file.name}: Unsupported file type`, "error")
      return
    }

    if (file.size > maxSize) {
      showNotification(`${file.name}: File too large (max 10MB)`, "error")
      return
    }

    selectedFiles.push(file)
  })

  renderSelectedFiles()
}

function renderSelectedFiles() {
  const container = document.getElementById("uploaded-files")

  if (selectedFiles.length === 0) {
    container.innerHTML = ""
    return
  }

  container.innerHTML = `
        <h4 style="margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600;">Selected Files:</h4>
        <div class="file-list">
            ${selectedFiles
              .map(
                (file, index) => `
                <div class="file-item">
                    <span class="file-icon">${getFileIcon(file.type)}</span>
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    </div>
                    <button class="btn btn-error" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="removeFile(${index})">Remove</button>
                </div>
            `,
              )
              .join("")}
        </div>
    `
}

function removeFile(index) {
  selectedFiles.splice(index, 1)
  renderSelectedFiles()
}

function uploadFiles() {
  if (selectedFiles.length === 0) {
    showNotification("Please select files to upload", "error")
    return
  }

  // Simulate upload progress
  const progressContainer = document.getElementById("upload-progress")
  const progressFill = document.getElementById("progress-fill")
  const uploadStatus = document.getElementById("upload-status")

  progressContainer.classList.remove("hidden")

  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 20
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)

      // Add files to request
      const request = requests.find((req) => req.id === currentUploadRequestId)
      if (request) {
        const newFiles = selectedFiles.map((file) => ({
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          url: URL.createObjectURL(file), // In a real app, this would be a server URL
        }))

        request.files = [...(request.files || []), ...newFiles]
        saveRequests()
      }

      uploadStatus.textContent = "Upload complete!"
      setTimeout(() => {
        closeUploadModal()
        loadOwnerDashboard()
        showNotification("Files uploaded successfully!", "success")
      }, 1000)
    }

    progressFill.style.width = `${progress}%`
    uploadStatus.textContent = `Uploading... ${Math.round(progress)}%`
  }, 200)
}

// Calendly Integration
function loadCalendlyWidget() {
  if (Calendly) {
    const embedElement = document.getElementById("calendly-embed")
    if (embedElement && !embedElement.hasChildNodes()) {
      try {
        Calendly.initInlineWidget({
          url: "https://calendly.com/your-calendly-username/30min",
          parentElement: embedElement,
          prefill: {
            name: currentUser.name,
            email: currentUser.email,
          },
          utm: {
            utmSource: "studyhelper",
            utmMedium: "website",
            utmCampaign: "student_booking",
          },
        })
      } catch (error) {
        console.error("[v0] Error loading Calendly widget:", error)
        showCalendlyFallback()
      }
    }
  } else {
    showCalendlyFallback()
  }
}

function openCalendlyPopup() {
  if (Calendly) {
    try {
      Calendly.initPopupWidget({
        url: "https://calendly.com/your-calendly-username/30min",
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        utm: {
          utmSource: "studyhelper",
          utmMedium: "website",
          utmCampaign: "student_booking",
        },
      })
    } catch (error) {
      console.error("[v0] Error opening Calendly popup:", error)
      window.open("https://calendly.com/your-calendly-username/30min", "_blank")
    }
  } else {
    window.open("https://calendly.com/your-calendly-username/30min", "_blank")
  }
}

function showCalendlyFallback() {
  const embedElement = document.getElementById("calendly-embed")
  if (embedElement) {
    embedElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 400px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface);">
                <div style="text-align: center;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">Calendar widget could not be loaded.</p>
                    <button class="btn btn-primary" onclick="openCalendlyPopup()">Open Booking Page</button>
                </div>
            </div>
        `
  }
}

// Utility Functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getFileIcon(mimeType) {
  const iconMap = {
    "application/pdf": "📄",
    "application/msword": "📝",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
    "application/vnd.ms-excel": "📊",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
    "application/vnd.ms-powerpoint": "📽️",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "📽️",
  }

  return iconMap[mimeType] || "📎"
}

function downloadFile(url, filename) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
    `

  // Set background color based on type
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  }

  notification.style.backgroundColor = colors[type] || colors.info
  notification.textContent = message

  // Add animation styles
  const style = document.createElement("style")
  style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `
  document.head.appendChild(style)

  document.body.appendChild(notification)

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Global error handler
window.addEventListener("error", (event) => {
  console.error("[v0] Global error:", event.error)
  showNotification("An error occurred. Please try again.", "error")
})

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("[v0] Unhandled promise rejection:", event.reason)
  showNotification("An error occurred. Please try again.", "error")
})
