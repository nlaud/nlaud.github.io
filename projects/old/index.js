function copyEmail() {
  navigator.clipboard.writeText('nlaud@andrew.cmu.edu');
  let notif = document.getElementById('notif');
  notif.classList.add('show');
  setTimeout(() => {
    notif.classList.remove('show');
  }, 1500); // Visible for 1.5 seconds
}

// --- Projects data ---
const projects = [
  {
    img: "images/boidbg.png",
    title: "BoidBG",
    desc: "An implementation of Boid's Algorithm in JS, modified so boids with similar colors form.",
    href: "projects/boidbg",
  },
  {
    img: "images/yt-mixer.png",
    title: "YT-Mixer",
    desc: "A music streaming app that uses Youtube's API to play videos with few (or no) ads!",
    href: "projects/yt-mixer",
  },
  {
    img: "images/vibin-time.png",
    title: "Vibin' Time",
    desc: "Small prank with friends...",
    href: "projects/vibin-time",
  },{
    img: "images/tab-saver.png",
    title: "Tab Saver",
    desc: "An app to store tabs in groups to be reopened all at once later",
    href: "projects/tab-saver",
  }
];

// --- Card generator ---
function makeCard({img, title, desc, href}) {
  // Card container
  const card = document.createElement("div");
  card.className = "tilt-card";
  card.tabIndex = 0;
  card.onclick = () => window.open(href, "_blank", "noopener");

  // Image slot
  const imgSlot = document.createElement("div");
  imgSlot.className = "card-img-slot";
  const image = document.createElement("img");
  image.src = img;
  image.alt = title + " preview";
  imgSlot.appendChild(image);

  // Content
  const content = document.createElement("div");
  content.className = "card-content";
  content.innerHTML = `<h3>${title}</h3>
    <p>${desc}</p>`;
  card.appendChild(imgSlot);
  card.appendChild(content);
  return card;
}

// --- Render cards: ---
const grid = document.getElementById("projectsGrid");
projects.forEach(proj => grid.appendChild(makeCard(proj)));


//(Very Legit) Loading Animation
let elem = document.getElementById("loadingBar");
let value = 1;
function loadingBar() {
  if (value < 100) {
    value+= 2.25;
    elem.value = value;
    setTimeout(loadingBar, 1);
  }
}

loadingBar();