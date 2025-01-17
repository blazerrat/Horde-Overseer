// Main Body Elements
const content = document.getElementById("content");

// Sidebar Elements
const uid = document.getElementById("uid");
const submitUID = document.getElementById("submitUid");
const sidebar = document.getElementById("sidebar");
const sidebarInfo = document.getElementById("sidebarInfo");
const signIn = document.getElementById("signIn");
//const leaderboard = document.getElementById("leaderboard");
const modelsStats = document.getElementById("modelsStats");

// Option Elements
const uidAlt = document.getElementById("uidAlt");
const submitUIDAlt = document.getElementById("submitUidAlt");
//const leaderboardOption = document.getElementById("leaderboardOption");
const modelsStatsOption = document.getElementById("modelsStatsOption");
const lightModeOption = document.getElementById("lightmode");
const sortWorkersOption = document.getElementById("sortWorkers");

let cachedWorkers = [];

let options = {
    userID: localStorage.getItem('userID') || -1,
    lightMode: (localStorage.getItem('lightMode') === 'true') || false,
    //leaderboardEnabled: (localStorage.getItem('leaderboardEnabled') === 'true') || true,
    modelsStatsEnabled: (localStorage.getItem('modelsStatsEnabled') === 'true') || true,
    sortWorkers: localStorage.getItem('sortWorkers') || 'none'
};

if (options.userID != -1) {
    signIn.style.display = "none";
    sidebarInfo.innerHTML = "<h1>Loading...</h1>";
    uidAlt.value = options.userID;
}

if (options.lightMode) {
    lightModeOption.checked = true;
    document.querySelector("link[href='./dark.css']").href = './light.css';
    document.querySelector(".close-modal>svg>path").setAttribute("fill", "rgb(111, 111, 111)");
}

/* if (options.leaderboardEnabled) {
    leaderboardOption.checked = true;
    leaderboard.style.display = "table";
} */

if (options.modelsStatsEnabled) {
    modelsStatsOption.checked = true;
    modelsStats.style.display = "table";
}

sortWorkersOption.value = options.sortWorkers;

function secondsToDhm(seconds) {
    seconds = Number(seconds);
    if (seconds === 0) return "0s";
    let d = Math.floor(seconds / 86400)
    var h = Math.floor(seconds % 86400 / 3600);
    var m = Math.floor(seconds % 86400 % 3600 / 60);

    var dDisplay = d > 0 ? d + "d " : "";
    var hDisplay = h > 0 ? h + "h " : "";
    var mDisplay = m > 0 ? m + "m " : "";
    return dDisplay + hDisplay + mDisplay;
}

submitUID.addEventListener("click", async () => {
    const response = await fetch("https://horde.koboldai.net/api/v2/users/" + uid.value);
    if (!response.ok) return;

    options.userID = uid.value;
    uidAlt.value = uid.value;
    localStorage.setItem("userID", options.userID);
    signIn.style.display = "none";
    updateSidebarInfo();
})

submitUIDAlt.addEventListener("click", async () => {
    const response = await fetch("https://horde.koboldai.net/api/v2/users/" + uidAlt.value);
    if (!response.ok) return;

    options.userID = uidAlt.value;
    localStorage.setItem("userID", options.userID);
    signIn.style.display = "none";
    updateSidebarInfo();
})

async function updateSidebarInfo() {
    if (options.userID === -1) return;

    let response = await fetch("https://horde.koboldai.net/api/v2/users/" + options.userID);
    if (!response.ok) return;
    let user = await response.json();

    let statsResponse = await fetch("https://horde.koboldai.net/api/v2/status/performance");
    if (!statsResponse.ok) return;
    let stats = await statsResponse.json();

    sidebarInfo.innerHTML = `
        <h1>Welcome back, ${user.username}</h1>
        <div>You have <b>${user.kudos}</b> kudos remaining.</div>
        <div>You have contributed <b>${user.records.contribution.tokens}</b> tokens and fulfilled <b>${user.records.fulfillment.text} </b>requests.</div>
        <br>
        <div>There are <b>${stats.queued_text_requests}</b> queued requests (<b>${stats.queued_tokens}</b> tokens) with <b>${stats.text_worker_count}</b> workers.</div>
        <div>In the past minute, there have been <b>${stats.past_minute_tokens}</b> tokens processed.</div>
    `;
}

// Can only call once per 30s
/* async function updateLeaderboard() {
    if (!options.leaderboardEnabled) return;
    let response = await fetch("https://horde.koboldai.net/api/v2/users");
    if (!response.ok) return;
    let users = await response.json();

    users.sort((a, b) => b.kudos - a.kudos);
    leaderboard.innerHTML = `
        <tr>
            <th>#</th>
            <th>User</th>
            <th>Kudos</th>
        </tr>
    `;
    for (let i = 0; i < 10; i++) {
        const user = users[i];
        leaderboard.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${user.username}</td>
                <td>${Math.floor(user.kudos)}</td>
            </tr>
        `;
    }
} */

// Can only call once per 30s
async function updateModelsStats() {
    if (!options.modelsStatsEnabled) return;
    let response = await fetch("https://horde.koboldai.net/api/v2/status/models?type=text");
    if (!response.ok) return;
    let models = await response.json();

    models.sort((a, b) => b.queued - a.queued);
    modelsStats.innerHTML = `
        <tr>
            <th>#</th>
            <th>Model</th>
            <th>Count</th>
            <th>ETA</th>
            <th>Jobs</th>
            <th>Queue</th>
            <th>T/s</th>
        </tr>
    `;
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        modelsStats.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${model.name}</td>
                <td>${model.count}</td>
                <td>${model.eta}</td>
                <td>${model.jobs}</td>
                <td>${model.queued}</td>
                <td>${model.performance}</td>
            </tr>
        `;
    }
}

// Does not work with functions, classes, undefined, Infinity, RegExps, Maps, Sets
function deepClone(object) {
    return JSON.parse(JSON.stringify(object));
}

async function updateWorkers(useCached = false) {
    let workers;
    if (useCached) {
        workers = deepClone(cachedWorkers);
    } else {
        const response = await fetch("https://horde.koboldai.net/api/v2/workers?type=text");
        if (!response.ok) return;
        workers = await response.json();
    }

    cachedWorkers = deepClone(workers);
    
    if (options.sortWorkers == "time") {
        workers.sort((a, b) => b.uptime - a.uptime);
    } else if (options.sortWorkers == "kudos") {
        workers.sort((a, b) => b.kudos_rewards - a.kudos_rewards);
    } else if (options.sortWorkers == "reqfilled") {
        workers.sort((a, b) => b.requests_fulfilled - a.requests_fulfilled);
    } else if (options.sortWorkers == "contextlength") {
        workers.sort((a, b) => b.max_context_length - a.max_context_length);
    } else if (options.sortWorkers == "maxlength") {
        workers.sort((a, b) => b.max_length - a.max_length);
    }

    content.innerHTML = "";
    for (let j = 0; j < workers.length; j++) {
        const worker = workers[j];
        const person = document.createElement("div");
        //const max_size = Math.round(Math.sqrt(worker.max_pixels));
        person.innerHTML = `
            ==================<br><br>
            <div style="font-size:20px;font-weight:800">${worker.name} - ${secondsToDhm(worker.uptime)}</div>
            <div style="font-size:12px; margin-bottom: 10px">ID: ${worker.id}</div>
            <div>Model: ${worker.models[0]}</div>
            <div>Max Length: ${worker.max_length}</div>
            <div>Max Context Length: ${worker.max_context_length}</div>
            <div>Requests Fulfilled: ${worker.requests_fulfilled} - ${worker.performance.split(" ")[0]} Tokens/s</div>
            <div>Kudos Gained: ${worker.kudos_rewards}</div>
            <ul style="margin: 0"><li>From Generating: ${worker.kudos_details.generated}</li><li>From Uptime: ${worker.kudos_details.uptime}</li></ul><br>
            ==================<br>
        `;
        content.appendChild(person);
    }
}


function openOptions() {
    document.querySelector("#options").style.display = "block";
}

function closeOptions() {
    document.querySelector("#options").style.display = "none";
}

lightModeOption.addEventListener("change", () => {
    options.lightMode = lightModeOption.checked;
    localStorage.setItem("lightMode", options.lightMode);
    
    if (options.lightMode) {
        document.querySelector("link[href='./dark.css']").href = './light.css';
        document.querySelector(".close-modal>svg>path").setAttribute("fill", "rgb(111, 111, 111)");
        return;
    }
    document.querySelector("link[href='./light.css']").href = './dark.css';
    document.querySelector(".close-modal>svg>path").setAttribute("fill", "#909090");
})

/* leaderboardOption.addEventListener("change", () => {
    options.leaderboardEnabled = leaderboardOption.checked;
    localStorage.setItem("leaderboardEnabled", options.leaderboardEnabled);
    
    if (options.leaderboardEnabled) {
        leaderboard.style.display = "table";
        return;
    }
    leaderboard.style.display = "none";
}) */

modelsStatsOption.addEventListener("change", () => {
    options.modelsStatsEnabled = modelsStatsOption.checked;
    localStorage.setItem("modelsStatsEnabled", options.modelsStatsEnabled);
    
    if (options.modelsStatsEnabled) {
        modelsStats.style.display = "table";
        return;
    }
    modelsStats.style.display = "none";
})

sortWorkersOption.addEventListener("change", () => {
    options.sortWorkers = sortWorkersOption.value;
    localStorage.setItem("sortWorkers", options.sortWorkers);

    updateWorkers(true);
})

/* function moveLeaderboard() {
    if (window.innerWidth < 650) {
        if (leaderboard.parentElement.id != 'content') {
            content.parentElement.prepend(leaderboard);
        }
        return;
    }
    if (leaderboard.parentElement.id != 'sidebar') {
        sidebar.appendChild(leaderboard);
    }
} */

function moveModelsStats() {
    if (window.innerWidth < 650) {
        if (modelsStats.parentElement.id != 'content') {
            content.parentElement.prepend(modelsStats);
        }
        return;
    }
    if (modelsStats.parentElement.id != 'sidebar') {
        sidebar.appendChild(modelsStats);
    }
}

//window.addEventListener('resize', moveLeaderboard);

//moveLeaderboard();
moveModelsStats();
updateSidebarInfo();
updateWorkers();
//updateLeaderboard();
updateModelsStats();
setInterval(updateWorkers, 1000 * 10);
setInterval(updateSidebarInfo, 1000 * 10);
//setInterval(updateLeaderboard, 1000 * 60);
setInterval(updateModelsStats, 1000 * 40);