// ===== APP ROOT =====
const app = document.getElementById("app");

// ===== DATA =====
let trips = JSON.parse(localStorage.getItem("trips")) || [];

// ===== DEMO TRIP =====
const demoTrip = {
    id: 1,
    destination: "Paris",
    start: "2026-04-20",
    end: "2026-04-25",
    image: "images/paris.jpg",
  
    activities: [
      { title: "Eiffel Tower Visit", date: "2026-04-21", time: "10:00-12:00" },
      { title: "Louvre Museum", date: "2026-04-22", time: "14:00-17:00" },
      { title: "Seine River Cruise", date: "2026-04-23", time: "19:00-21:00" }
    ],
  
    documents: [
      { name: "Passport", image: "images/passport.jpg" },
      { name: "Flight Ticket", image: "images/ticket.jpg" }
    ],
  
    packing: [
      { name: "Passport", done: true },
      { name: "Clothes", done: false },
      { name: "Charger", done: false }
    ]
  };
  
  // only add if not already there
  if (!trips.some(t => t.id === demoTrip.id)) {
    trips.unshift(demoTrip);
    saveTrips();
  }

// ===== PEXELS API =====
const UNSPLASH_ACCESS_KEY = "lLJOskVnnAlKIdV3cUGuSZ2qlJNinlyb9uicryOefo0";

// ===== ROUTES =====
const routes = {
    "#/": home,
    "#/trips": tripsPage,
    "#/create": createTrip,
    "#/trip": tripDetails,
    "#/activities": activitiesPage,
    "#/documents": documentsPage,
    "#/packing": packingPage,
    "#/edit": editTripPage
  };

// ===== NAVIGATION =====
function navigate(path) {
  window.location.hash = path;
  render();
}

// ===== RENDER =====
async function render() {
  const path = window.location.hash || "#/";
  const view = routes[path] || home;
  app.innerHTML = await view();
  
  document.querySelectorAll(".sidebar a").forEach(link => {
    if (window.location.hash === link.getAttribute("href")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

}

window.addEventListener("hashchange", render);

// ===== IMAGE FETCH =====
async function getImage(query) {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );
  
      const data = await response.json();
      return data.results?.[0]?.urls?.regular || "https://picsum.photos/400/300";
  
    } catch {
      return "https://picsum.photos/400/300";
    }
  }

// ===== DATE FORMAT =====
function formatDateRange(start, end) {
    if (!start || !end) return "";
  
    const s = new Date(start);
    const e = new Date(end);
  
    const startDay = s.getDate();
    const endDay = e.getDate();
  
    const startMonth = s.toLocaleString("en-GB", { month: "short" });
    const endMonth = e.toLocaleString("en-GB", { month: "short" });
  
    const startYear = s.getFullYear();
    const endYear = e.getFullYear();
  
    // SAME month + same year
    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay}–${endDay} ${endMonth} ${endYear}`;
    }
  
    // DIFFERENT month, same year
    if (startYear === endYear) {
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
    }
  
    // DIFFERENT year
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  }
  function getSortedAllTrips(trips) {
    return [...trips].sort((a, b) => 
      new Date(a.start) - new Date(b.start)
    );
  }

  function getUpcomingTrips(trips) {
    const today = new Date();
  
    return trips
      .filter(t => new Date(t.start) >= today)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }
  
  function getPastTrips(trips) {
    const today = new Date();
  
    return trips
      .filter(t => new Date(t.end) < today)
      .sort((a, b) => new Date(b.start) - new Date(a.start));
  }

  function getNextTrip(trips) {
    const today = new Date();
  
    const upcoming = trips.filter(t => new Date(t.start) >= today);
  
    if (!upcoming.length) return null;
  
    return upcoming.sort((a, b) => 
      new Date(a.start) - new Date(b.start)
    )[0];
  }

  function home() {
    const hasTrips = trips.length > 0;
    const upcoming = getUpcomingTrips(trips);
    const nextTrip = upcoming[0];
  
    let content = "";
  
    // ===== STATE 1: NO TRIPS (ONBOARDING) =====
    if (!hasTrips) {
      return `
        <div class="empty-state">
          <h1>Welcome 👋</h1>
          <p>Your travel planner in one place.</p>
  
          <div class="empty-box">
            <h2>No trips yet ✈️</h2>
            <p>Start by creating your first trip. You'll be able to:</p>
  
            <ul>
              <li>Plan activities</li>
              <li>Store documents</li>
              <li>Track packing</li>
            </ul>
  
            <button class="primary-btn" onclick="navigate('#/create')">
              + Create your first trip
            </button>
          </div>
        </div>
      `;
    }
  
    // ===== STATE 2: HAS TRIPS, NO UPCOMING =====
    if (upcoming.length === 0) {
        const past = getPastTrips(trips).slice(0, 3);
      
        return `
          <section class="empty-hero">
            <h1>Welcome back 👋</h1>
      
            <div class="empty-hero-box">
              <h2>No upcoming trips ✈️</h2>
              <p>Ready for your next adventure?</p>
      
              <button class="primary-btn" onclick="navigate('#/create')">
                + Plan a new trip
              </button>
            </div>
          </section>
      
          ${
            past.length > 0
              ? `
              <section>
                <h2>Your past trips</h2>
      
                <div class="grid">
                  ${past.map(trip => `
                    <div class="trip-card past" onclick="openTrip(${trip.id})">
                      <img src="${trip.image}">
                      <div class="overlay"></div>
      
                      <div class="trip-top">
                        <h2>${capitalize(trip.destination)}</h2>
                        <div class="trip-date">
                          ${formatDateRange(trip.start, trip.end)}
                        </div>
                      </div>
      
                      <div class="trip-arrow">→</div>
                    </div>
                  `).join("")}
                </div>
      
                ${
                  getPastTrips(trips).length > 3
                    ? `<button class="primary-btn" onclick="navigate('#/trips')">
                         View all trips
                       </button>`
                    : ""
                }
              </section>
            `
              : ""
          }
        `;
      }
  
    // ===== STATE 3: HAS UPCOMING TRIPS =====
    const daysLeft = getDaysLeft(nextTrip.start);
  
    content += `
      <section class="next-trip">
        <h1>Welcome back 👋</h1>
        <h2>Your next trip ✈️</h2>
  
        <div class="hero">
          <div class="hero-overlay">
            <div class="hero-content">
  
              <div class="badge">
                <img src="images/plane_icon.svg"/>
                <p>Starts in ${daysLeft} days</p>
              </div>
  
              <h1>${capitalize(nextTrip.destination)}</h1>
  
              <div class="next-date">
                <img src="images/calendar.svg"/>
                <p>${formatDateRange(nextTrip.start, nextTrip.end)}</p>
              </div>
  
              <button class="primary-btn" onclick="openTrip(${nextTrip.id})">
                View trip details →
              </button>
  
            </div>
          </div>
  
          <img src="${nextTrip.image}" class="hero-image" />
        </div>
      </section>
    `;
  
    // ===== UPCOMING TRIPS PREVIEW =====
    const previewTrips = upcoming.slice(0, 3);
  
    content += `
      <section>
        <h2>Your Upcoming Trips</h2>
  
        <div class="grid">
          ${previewTrips.map(trip => `
            <div class="trip-card" onclick="openTrip(${trip.id})">
              <img src="${trip.image}">
              <div class="overlay"></div>
  
              <div class="trip-top">
                <h2>${capitalize(trip.destination)}</h2>
                <div class="trip-date">
                  ${formatDateRange(trip.start, trip.end)}
                </div>
              </div>
  
              <div class="trip-arrow">→</div>
            </div>
          `).join("")}
        </div>
  
        ${
          upcoming.length > 3
            ? `<button class="primary-btn" onclick="navigate('#/trips')">
                 View all trips
               </button>`
            : ""
        }
      </section>
    `;
  
    return content;
  }

  let currentFilter = "all";

  function setFilter(filter) {
    currentFilter = filter;
    render();
  }
function tripsPage() {
    let content = `
      <section class="trips-page">
  
        <!-- HEADER -->
        <header class="trips-header">
          <div>
            <h1>My Trips</h1>
            <p class="subtext">Plan and manage your journeys</p>
          </div>
  
          <button class="primary-btn" onclick="navigate('#/create')">
            + New Trip
          </button>
        </header>
    `;
  
    // ===== EMPTY: NO TRIPS AT ALL =====
    if (trips.length === 0) {
      content += `
        <section class="empty-full">
          <h2>No trips yet ✈️</h2>
          <p>Start planning your first adventure</p>
  
          <button class="primary-btn" onclick="navigate('#/create')">
            + Create your first trip
          </button>
        </section>
      </section>
      `;
      return content;
    }
  
    // ===== FILTERS =====
    content += `
      <section class="filters">
        <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
          onclick="setFilter('all')">All</button>
  
        <button class="filter-btn ${currentFilter === 'upcoming' ? 'active' : ''}" 
          onclick="setFilter('upcoming')">Upcoming</button>
  
        <button class="filter-btn ${currentFilter === 'past' ? 'active' : ''}" 
          onclick="setFilter('past')">Past</button>
      </section>
    `;
  
    // ===== FILTER LOGIC =====
    let filteredTrips = [];
  
    if (currentFilter === "upcoming") {
      filteredTrips = getUpcomingTrips(trips);
    } else if (currentFilter === "past") {
      filteredTrips = getPastTrips(trips);
    } else {
      filteredTrips = getSortedAllTrips(trips);
    }
  
    // ===== COUNT =====
    content += `
      <p class="trip-count">
        ${filteredTrips.length} ${
          currentFilter === "past"
            ? "past trips"
            : currentFilter === "upcoming"
            ? "upcoming trips"
            : "trips"
        }
      </p>
    `;
  
    // ===== EMPTY FILTER STATE =====
    if (filteredTrips.length === 0) {
      content += `
        <p class="empty-inline">
          No ${
            currentFilter === "past" ? "past" : "upcoming"
          } trips
        </p>
      `;
    } else {
      // ===== GRID =====
      content += `<section class="grid">`;
  
      filteredTrips.forEach(trip => {
        const isPast = new Date(trip.end) < new Date();
  
        content += `
          <article class="trip-card ${isPast ? 'past' : 'upcoming'}" 
                   onclick="openTrip(${trip.id})">
  
            <img src="${trip.image}" />
  
            <div class="overlay"></div>
  
            <div class="trip-top">
              <h2>${capitalize(trip.destination)}</h2>
  
              <div class="trip-date">
                ${formatDateRange(trip.start, trip.end)}
              </div>
            </div>
  
            <div class="trip-arrow">→</div>
          </article>
        `;
      });
  
      content += `</section>`;
    }
  
    content += `</section>`;
  
    return content;
  }

// ===== CREATE TRIP =====
function createTrip() {
  return `
    <h1>Create Trip</h1>
    <form onsubmit="addTrip(event)">
      <input id="destination" placeholder="Destination" required>
      <input id="start" type="date">
      <input id="end" type="date">
      <button class="primary-btn">CREATE</button>
    </form>
  `;
}

async function addTrip(e) {
    e.preventDefault();
  
    const destination = document.getElementById("destination").value;
  
    const image = await getImage(destination);
  
    const newTrip = {
      id: Date.now(),
      destination: destination,
      start: document.getElementById("start").value,
      end: document.getElementById("end").value,
      image: image, 
      activities: [],
      documents: [],
      packing: []
    };
  
    trips.push(newTrip);
    saveTrips();
    navigate("#/trips");
  }

  async function updateTrip(e) {
    e.preventDefault();
  
    const trip = getCurrentTrip();
    const destination = document.getElementById("destination").value;
    const new_image = await getImage(destination);
  
    trip.destination = document.getElementById("destination").value;
    trip.image = new_image;
    trip.start = document.getElementById("start").value;
    trip.end = document.getElementById("end").value;
  
    saveTrips();
    navigate("#/trip");
  }

function deleteTrip(id, e) {
    e.stopPropagation();
  
    if (!confirm("Delete this trip?")) return;
  
    trips = trips.filter(trip => trip.id !== id);
    saveTrips();
    navigate("#/trips");
  }

// ===== OPEN TRIP =====
function openTrip(id) {
  localStorage.setItem("currentTrip", id);
  navigate("#/trip");
}

// ===== TRIP DETAILS (3 CARDS) =====
function tripDetails() {
    const trip = getCurrentTrip();
    if (!trip) return `<h1>Trip not found</h1>`;

    const { total, done, percent } = getPackingProgress(trip);
  
    return `

    <button class="secondary-btn" onclick="navigate('#/trips')">← Back</button>

    <div class="trip-hero">
      <div class="trip-header">
            <img src="${trip.image}" />
     </div>
     <div class="header-content">
            <h1>${capitalize(trip.destination)}</h1>
            <p class="trip-date">${formatDateRange(trip.start, trip.end)}</p>
            <button class="primary-btn" onclick="navigate('#/edit')">
               Edit Trip
            </button>
     </div>
     <div class="header-top">
                <button class="danger-btn" onclick="deleteTrip(${trip.id}, event)">✕</button>
            </div>
    </div>
    <div class="details-grid">
  
        <!-- Activities -->
        <div class="details-card" onclick="navigate('#/activities')">
          <div class="card-header">
            <div class="icon-box icon-activity">
                <img src="images/place.svg"/>
            </div>
            <div class="title-container">
               <h2>Activities</h2>
               <p>Plan your activities and places to visit.</p>
            </div>
            <span>›</span>
          </div>
  
          <div class="card-preview">
            ${trip.activities
                .slice(0,3)
                .map(a => `
                  <p>
                    ${a.title}
                    <span>
                      ${a.date ? `${formatDay(a.date)} ${formatMonth(a.date)}` : ""}
                    </span>
                  </p>
                `)
                .join("") || "<p>No activities yet</p>"}
          </div>
          ${trip.activities.length > 0 
            ? `<a class="category-link" onclick="navigate('#/activities')">View all activities ›</a>`
            : `<a class="category-link" onclick="navigate('#/activities')">+ Add activity</a>`
          }
        </div>
  
        <!-- Documents -->
        <div class="details-card" onclick="navigate('#/documents')">
          <div class="card-header">
            <div class="icon-box icon-documents">
                <img src="images/passport.svg"/>
            </div>
            <div class="title-container">
               <h2>Documents</h2>
               <p>Store your important travel documents.</p>
            </div>
            <span>›</span>
          </div>
  
          <div class="card-preview">
            ${trip.documents.slice(0,3).map(d => `
                <div class="doc-preview-item">
                    <img src="images/doc_icon.svg" class="doc-icon" />
                    <p>${d.name}</p>
                 </div>
             `).join("") || "<p>No documents yet</p>"}
          </div>
          ${trip.documents.length > 0 
            ? `<a class="category-link" onclick="navigate('#/documents')">View all documents ›</a>`
            : `<a class="category-link" onclick="navigate('#/documents')">+ Add document</a>`
          }
        </div>
  
        <!-- Packing -->
        <div class="details-card" onclick="navigate('#/packing')">
          <div class="card-header">
            <div class="icon-box icon-packing">
                <img src="images/list.svg"/>
            </div>
            <div class="title-container">
               <h2>Packing List</h2>
               <p>Keep track of what you need to pack.</p>
            </div>
            <span>›</span>
          </div>
  
          <div class="card-preview">
            <p>${done} / ${total} items packed</p>
            <div class="packing-progress">
                <div class="packing-bar" style="width: ${percent}%"></div>
            </div>
          </div>
          ${trip.packing.length > 0 
            ? `<a class="category-link" onclick="navigate('#/packing')">View packing list ›</a>`
            : `<a class="category-link" onclick="navigate('#/packing')">+ Add packing item</a>`
          }
        </div>
     </div>
    `;
  }

  function editTripPage() {
    const trip = getCurrentTrip();
    if (!trip) return `<h1>Trip not found</h1>`;
  
    return `
      <h1>Edit Trip</h1>
  
      <form onsubmit="updateTrip(event)">
        <input id="destination" value="${trip.destination}" required>
        <input id="start" type="date" value="${trip.start}">
        <input id="end" type="date" value="${trip.end}">
  
        <button class="primary-btn">Save Changes</button>
      </form>
  
      <br>
      <button onclick="navigate('#/trip')">← Back</button>
    `;
  }

// ===== ACTIVITIES PAGE =====
function activitiesPage() {
    const trip = getCurrentTrip();
  
    return `
      <button class="secondary-btn" onclick="navigate('#/trip')">← Back</button>
  
      <div class="category-intro">
        <h1>Activities</h1>
        <p>Plan your activities and places to visit</p>
      </div>
  
      <div class="activity-form">
        <input id="activity-title" placeholder="Activity name" />
        <input id="activity-date" type="date" />
        <input id="activity-time" placeholder="10:00-12:00" />
        <button class="primary-btn" onclick="addActivity()">+ Add</button>
      </div>
  
      <div class="activities-list">
        ${
          trip.activities.length === 0
            ? `<p>No activities yet</p>`
            : trip.activities.map((a, i) => `
              
              <div class="activity-item">
                
                <div class="activity-date">
                  <span>${formatDay(a.date)}</span>
                  <small>${formatMonth(a.date)}</small>
                </div>
  
                <div class="activity-info">
                  <h3>${a.title}</h3>
                  <p>${a.time || ""}</p>
                </div>
  
                <div class="delete-action">
                  <button onclick="deleteActivity(${i})">✕</button>
                </div>
  
              </div>
  
            `).join("")
        }
      </div>
    `;
  }

// ===== DOCUMENTS PAGE =====
function documentsPage() {
    const trip = getCurrentTrip();
  
    return `
      <button class="secondary-btn" onclick="navigate('#/trip')">← Back</button>
      <div class="category-intro">
        <h1>Documents</h1>
        <p>Store your important travel documents</p>
      </div>
      <div class="upload-container">
         <img class="upload-icon" src="images/upload_icon.svg">
      </div>
  
      <!-- Simple form (works for user-created trips) -->
      <div class="doc-form">
        <input id="document-input" placeholder="Document name" />
        <button class="primary-btn" onclick="addDocument()">+ Add</button>
      </div>
  
      <!-- Documents list -->
      <div class="doc-list">
        ${
          trip.documents.length === 0
            ? `<p>No documents yet</p>`
            : trip.documents.map((d, i) => {
  
                const name = typeof d === "string" ? d : d.name;
                const image = typeof d === "string" ? null : d.image;
  
                return `
                  <div class="doc-item">
  
                    ${
                      image
                        ? `<img src="${image}" class="doc-image" onclick="window.open('${image}', '_blank')" />`
                        : `<div class="doc-placeholder">📄</div>`
                    }
  
                    <div class="doc-info">
                      <h3>${name}</h3>
                    </div>
  
                    <div class="delete-action">
                        <button onclick="deleteDocument(${i})">✕</button>
                    </div>
  
                  </div>
                `;
            }).join("")
        }
      </div>
    `;
  }

// ===== PACKING PAGE =====
function packingPage() {
    const trip = getCurrentTrip();
  
    return `
      <button class="secondary-btn" onclick="navigate('#/trip')">← Back</button>
  
      <div class="category-intro">
        <h1>Packing List</h1>
        <p>Keep track of what you need to pack</p>
      </div>
  
      <div class="packing-form">
        <input id="packing-input" placeholder="Add item" />
        <button class="primary-btn" onclick="addPacking()">+ Add</button>
      </div>
  
      <div class="packing-list">
        ${
          trip.packing.length === 0
            ? `<p>No items yet</p>`
            : trip.packing.map((p, i) => `
              
              <div class="packing-item">
                
                <input 
                  type="checkbox" 
                  ${p.done ? "checked" : ""}
                  onchange="togglePacking(${i})"
                />
  
                <span class="${p.done ? "done" : ""}">
                  ${p.name}
                </span>

                <div class="delete-action">
                    <button onclick="deletePacking(${i})">✕</button>
                </div>
  
              </div>
  
            `).join("")
        }
      </div>
    `;
  }

// ===== ADD FUNCTIONS =====
function addActivity() {
    const title = document.getElementById("activity-title").value;
    const date = document.getElementById("activity-date").value;
    const time = document.getElementById("activity-time").value;
  
    if (!title) return;
  
    const trip = getCurrentTrip();
  
    trip.activities.push({
      title,
      date,
      time
    });
  
    // clear inputs
    document.getElementById("activity-title").value = "";
    document.getElementById("activity-date").value = "";
    document.getElementById("activity-time").value = "";
  
    saveTrips();
    render();
  }

  function formatDay(date) {
    if (!date) return "--";
    return new Date(date).getDate();
  }
  
  function formatMonth(date) {
    if (!date) return "--";
    return new Date(date).toLocaleString("en-GB", { month: "short" });
  }

  function addDocument() {
    const input = document.getElementById("document-input");
    if (!input.value) return;
  
    const trip = getCurrentTrip();
  
    trip.documents.push({
      name: input.value
    });
  
    input.value = "";
    saveTrips();
    render();
  }

  function getDaysLeft(date) {
    const oneDay = 24 * 60 * 60 * 1000;
  
    const today = new Date();
    const tripDate = new Date(date);
  
    const diff = tripDate - today;
  
    return Math.ceil(diff / oneDay);
  }


function addPacking() {
    const input = document.getElementById("packing-input");
    if (!input.value) return;
  
    const trip = getCurrentTrip();
  
    trip.packing.push({
      name: input.value,
      done: false
    });
  
    input.value = "";
    saveTrips();
    render();
  }

  function togglePacking(i) {
    const trip = getCurrentTrip();
    trip.packing[i].done = !trip.packing[i].done;
  
    saveTrips();
    render();
  }

  function getPackingProgress(trip) {
    const total = trip.packing.length;
    const done = trip.packing.filter(p => p.done).length;
  
    const percent = total === 0 ? 0 : (done / total) * 100;
  
    return { total, done, percent };
  }

// ===== DELETE FUNCTIONS =====
function deleteActivity(i) {
  const trip = getCurrentTrip();
  trip.activities.splice(i, 1);
  saveTrips();
  render();
}

function deleteDocument(i) {
  const trip = getCurrentTrip();
  trip.documents.splice(i, 1);
  saveTrips();
  render();
}

function deletePacking(i) {
  const trip = getCurrentTrip();
  trip.packing.splice(i, 1);
  saveTrips();
  render();
}

// ===== HELPERS =====
function getCurrentTrip() {
  const id = localStorage.getItem("currentTrip");
  return trips.find(t => t.id == id);
}

function saveTrips() {
  localStorage.setItem("trips", JSON.stringify(trips));
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ===== INIT =====
render();