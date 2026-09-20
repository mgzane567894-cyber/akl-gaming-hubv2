let editingGameId = null;
let allGames = []; 

const ADMIN_SECRET_KEY = "Aungmyosat12";

function verifyAdminPassword() {
    const inputPass = document.getElementById("adminPasswordInput").value;
    const errorMsg = document.getElementById("loginErrorMsg");

    if (inputPass === ADMIN_SECRET_KEY) {
        sessionStorage.setItem("isAdminLoggedIn", "true");
        document.getElementById("adminLoginModal").style.display = "none";
        document.getElementById("adminApp").style.display = "block";
        loadStatsAndGames();
    } else {
        errorMsg.style.display = "block";
    }
}

function adminLogout() {
    sessionStorage.removeItem("isAdminLoggedIn");
    location.reload();
}

document.addEventListener("DOMContentLoaded", function() {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    const loginModal = document.getElementById("adminLoginModal");
    const adminApp = document.getElementById("adminApp");

    if (isLoggedIn === "true") {
        if (loginModal) loginModal.style.display = "none";
        if (adminApp) adminApp.style.display = "block";
        loadStatsAndGames();
    } else {
        if (loginModal) loginModal.style.display = "flex";
        if (adminApp) adminApp.style.display = "none";
    }

    const searchInput = document.getElementById("gameSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = allGames.filter(game => 
                (game.name || "").toLowerCase().includes(keyword)
            );
            renderGamesList(filtered);
        });
    }
});

async function fetchLocalGames() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) throw new Error('Failed to load games.json');
        const data = await response.json();
        
        if (Array.isArray(data)) {
            return data;
        } else if (typeof data === 'object' && data !== null) {
            return Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        return [];
    } catch (e) {
        console.error("Error fetching local games:", e);
        return [];
    }
}

async function loadStatsAndGames() {
    await loadGames();
}

async function loadStats() {
    try {
        const featured = allGames.filter(game => game.featured === true || game.featured === "true");
        document.getElementById("totalGames").textContent = allGames.length;
        document.getElementById("featuredGames").textContent = featured.length;
    } catch (error) {
        console.error("Stats Error:", error);
    }
}

async function loadGames() {
    try {
        allGames = await fetchLocalGames();
        renderGamesList(allGames);
        await loadStats();
    } catch (error) {
        console.error("Error loading games:", error);
    }
}

function renderGamesList(gamesArray) {
    const container = document.getElementById("adminGamesList");
    if (!container) return;

    if (gamesArray.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#666;">📂 No items found.</div>`;
        return;
    }

    container.innerHTML = gamesArray.map(game => {
        const icon = game.icon || game.image || "🎮";
        const iconHTML = isImageURL(icon) 
            ? `<img src="${escapeHTML(icon)}" class="admin-game-icon-image" alt="${escapeHTML(game.name)}">` 
            : `<div class="admin-game-icon">${escapeHTML(icon)}</div>`;
        
        const rating = game.rating !== undefined && game.rating !== null ? Number(game.rating).toFixed(1) : "5.0";
        const hasObb = game.obb_link ? `<span style="font-size: 11px; background: #e0f7fa; color: #00838f; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">📦 OBB</span>` : "";
        const hasWifi = game.wifiDownloadUrl ? `<span style="font-size: 11px; background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">🛜 WiFi</span>` : "";
        
        const isSmall = game.isSmallGame === true || game.isSmallGame === "true";
        const isHot = game.isHot === true || game.isHot === "true";
        const isNew = game.isNew === true || game.isNew === "true";
        const isUpdate = game.isUpdate === true || game.isUpdate === "true";

        let badgesHTML = "";
        if (isHot) badgesHTML += `<span style="font-size: 10px; background: #ff5252; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">HOT</span>`;
        if (isNew) badgesHTML += `<span style="font-size: 10px; background: #2196f3; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">NEW</span>`;
        if (isUpdate) badgesHTML += `<span style="font-size: 10px; background: #ff9800; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">UPDATE</span>`;
        if (isSmall) badgesHTML += `<span style="font-size: 10px; background: #00bcd4; color: #000; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">SMALL</span>`;

        const gameId = game.id || game.name;

        return `
            <div class="admin-game-item">
                <div class="admin-game-info">
                    ${iconHTML}
                    <div class="admin-game-details">
                        <div class="admin-game-name" title="${escapeHTML(game.name || "Unnamed")}">${escapeHTML(game.name || "Unnamed")} ${hasWifi} ${hasObb} ${badgesHTML}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">★ ${rating} • ${escapeHTML(String(game.platform || "").toUpperCase())} • ${escapeHTML(game.type || "Original")}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button type="button" class="action-btn secondary" style="padding: 6px 10px; font-size: 12px; flex: 1;" onclick="editGame('${escapeHTML(String(gameId))}')">✏️ Edit</button>
                    <button type="button" class="action-btn danger" style="padding: 6px 10px; font-size: 12px; flex: 1;" onclick="deleteGame('${escapeHTML(String(gameId))}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

function showAddForm() {
    const form = document.getElementById("gameForm");
    form.style.display = "block";
    document.getElementById("formTitle").textContent = "➕ Add New Item";
    document.getElementById("gameFormInputs").reset();
    document.getElementById("editId").value = "";
    document.getElementById("gamePlatform").value = "";
    document.getElementById("gameType").value = "Original";
    document.getElementById("gameIsSmall").checked = false;
    document.getElementById("gameIsHot").checked = false;
    document.getElementById("gameIsNew").checked = false;
    document.getElementById("gameIsUpdate").checked = false;
    document.getElementById("gameFeatured").checked = false;
    editingGameId = null;
    form.scrollIntoView({ behavior: "smooth" });
}

function editGame(id) {
    try {
        const game = allGames.find(g => String(g.id || g.name) === String(id));
        if (!game) return alert("❌ Item not found!");

        editingGameId = game.id || game.name;
        document.getElementById("gameForm").style.display = "block";
        document.getElementById("formTitle").textContent = "✏️ Edit Item";
        document.getElementById("editId").value = editingGameId;

        document.getElementById("gameName").value = game.name || "";
        document.getElementById("gamePlatform").value = (game.platform || "").toLowerCase();
        document.getElementById("gameType").value = game.type || "Original";
        document.getElementById("gameVersion").value = game.version || "";
        document.getElementById("gameSize").value = game.size || "";
        document.getElementById("gameIcon").value = game.icon || game.image || "";
        document.getElementById("gameDescription").value = game.description || "";
        document.getElementById("gameFeatures").value = Array.isArray(game.features) ? game.features.join(", ") : (game.features || "");
        
        document.getElementById("gameDataDownloadUrl").value = game.dataDownloadUrl || game.downloadUrl || "";
        document.getElementById("gameWifiDownloadUrl").value = game.wifiDownloadUrl || "";
        document.getElementById("gameObbUrl").value = game.obb_link || "";
        document.getElementById("gamePlayStoreUrl").value = game.playStoreUrl || "";
        
        const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
        document.getElementById("screenshot1").value = screenshots[0] || "";
        document.getElementById("screenshot2").value = screenshots[1] || "";
        document.getElementById("screenshot3").value = screenshots[2] || "";
        document.getElementById("screenshot4").value = screenshots[3] || "";
        
        document.getElementById("gameFeatured").checked = game.featured === true || game.featured === "true";
        document.getElementById("gameIsSmall").checked = game.isSmallGame === true || game.isSmallGame === "true";
        document.getElementById("gameIsHot").checked = game.isHot === true || game.isHot === "true";
        document.getElementById("gameIsNew").checked = game.isNew === true || game.isNew === "true";
        document.getElementById("gameIsUpdate").checked = game.isUpdate === true || game.isUpdate === "true";

        document.getElementById("gameForm").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        console.error("Edit Error:", error);
    }
}

function cancelForm() {
    document.getElementById("gameForm").style.display = "none";
    document.getElementById("gameFormInputs").reset();
    editingGameId = null;
}

function saveGame(event) {
    event.preventDefault();

    const id = document.getElementById("editId").value.trim();
    const name = document.getElementById("gameName").value.trim();
    const platform = document.getElementById("gamePlatform").value.toLowerCase();
    const type = document.getElementById("gameType").value;
    const version = document.getElementById("gameVersion").value.trim() || "1.0.0";
    const size = document.getElementById("gameSize").value.trim() || "Unknown";
    const icon = document.getElementById("gameIcon").value.trim() || "🎮";
    const description = document.getElementById("gameDescription").value.trim() || "No description available.";
    
    const featuresInput = document.getElementById("gameFeatures").value;
    const features = featuresInput ? featuresInput.split(",").map(i => i.trim()).filter(Boolean) : [];
    
    const dataDownloadUrl = document.getElementById("gameDataDownloadUrl").value.trim();
    const wifiDownloadUrl = document.getElementById("gameWifiDownloadUrl").value.trim();
    const obb_link = document.getElementById("gameObbUrl").value.trim();
    const playStoreUrl = document.getElementById("gamePlayStoreUrl").value.trim();
    
    const screenshots = [
        document.getElementById("screenshot1")?.value.trim(),
        document.getElementById("screenshot2")?.value.trim(),
        document.getElementById("screenshot3")?.value.trim(),
        document.getElementById("screenshot4")?.value.trim()
    ].filter(Boolean);

    const featured = document.getElementById("gameFeatured")?.checked || false;
    const isSmallGame = document.getElementById("gameIsSmall")?.checked || false;
    const isHot = document.getElementById("gameIsHot")?.checked || false;
    const isNew = document.getElementById("gameIsNew")?.checked || false;
    const isUpdate = document.getElementById("gameIsUpdate")?.checked || false;

    if (!name || !platform || !dataDownloadUrl) {
        alert("❌ Please fill in required fields (Name, Platform/Type, Data Download URL).");
        return;
    }

    const gameData = {
        id: id || `item_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name,
        platform,
        type,
        version,
        size,
        icon,
        description,
        features,
        dataDownloadUrl,
        wifiDownloadUrl,
        downloadUrl: dataDownloadUrl,
        obb_link,
        playStoreUrl,
        screenshots,
        featured,
        isSmallGame,
        isHot,
        isNew,
        isUpdate,
        rating: 5.0,
        total_ratings: 0
    };

    if (id) {
        const index = allGames.findIndex(g => String(g.id || g.name) === String(id));
        if (index !== -1) {
            gameData.rating = allGames[index].rating || 5.0;
            allGames[index] = gameData;
        } else {
            allGames.unshift(gameData);
        }
        alert("✅ Updated successfully! အပြောင်းအလဲများကို သိမ်းရန် အပေါ်ဆုံးရှိ 'Download updated games.json' ခလုတ်ကို နှိပ်ပါ။");
    } else {
        allGames.unshift(gameData);
        alert("✅ Added successfully! အပြောင်းအလဲများကို သိမ်းရန် အပေါ်ဆုံးရှိ 'Download updated games.json' ခလုတ်ကို နှိပ်ပါ။");
    }

    cancelForm();
    renderGamesList(allGames);
    loadStats();
}

function deleteGame(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    allGames = allGames.filter(g => String(g.id || g.name) !== String(id));
    alert("🗑️ Deleted successfully! အပြောင်းအလဲများကို သိမ်းရန် အပေါ်ဆုံးရှိ 'Download updated games.json' ခလုတ်ကို နှိပ်ပါ။");
    
    renderGamesList(allGames);
    loadStats();
}

function exportGamesJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allGames, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "games.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("📥 games.json ဖိုင် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ! ၎င်းဖိုင်ကို Project ထဲသို့ အစားထိုးထည့်ပေးပါ။");
}

function uploadJSONBatch() {
    const fileInput = document.getElementById("jsonBatchFile");
    if (!fileInput || !fileInput.files.length) {
        alert("❌ ကျေးဇူးပြု၍ JSON ဖိုင်ကို အရင်ရွေးချယ်ပါ။");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const gamesArray = JSON.parse(e.target.result);
            if (!Array.isArray(gamesArray)) {
                alert("❌ ဖတ်ရှုရသော JSON ဖိုင်သည် Array ပုံစံ မဟုတ်ပါ။");
                return;
            }

            allGames = gamesArray;
            renderGamesList(allGames);
            loadStats();
            alert(`🎉 ဒေတာ ${gamesArray.length} ခုလုံး ဝင်ရောက်လာပါပြီ! အပြောင်းအလဲများကို သိမ်းရန် 'Download updated games.json' ကို နှိပ်ပါ။`);
            fileInput.value = "";
        } catch (error) {
            console.error("JSON Batch Upload Error:", error);
            alert("❌ Error ဖြစ်သွားပါသည်: " + error.message);
        }
    };

    reader.readAsText(file);
}

function isImageURL(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.verifyAdminPassword = verifyAdminPassword;
window.adminLogout = adminLogout;
window.showAddForm = showAddForm;
window.editGame = editGame;
window.cancelForm = cancelForm;
window.saveGame = saveGame;
window.deleteGame = deleteGame;
window.exportGamesJSON = exportGamesJSON;
window.uploadJSONBatch = uploadJSONBatch;
