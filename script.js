const units = [
    { name: "総大将", type: "soudaisho", rows: 2 },
    { name: "第1軍", type: "army", rows: 2 },
    { name: "第2軍", type: "army", rows: 2 },
    { name: "第3軍", type: "army", rows: 2 },
    { name: "第4軍", type: "army", rows: 2 },
    { name: "軍師", type: "gunshi", rows: 1 },
    { name: "援軍", type: "army", rows: 2 }
];

const trainingItems = [
    { id: "gi", label: "技極" }, { id: "ura", label: "裏極" },
    { id: "lg", label: "LG" }, { id: "lg1", label: "LG1" },
    { id: "lg2", label: "LG2" }, { id: "lg3", label: "LG3" },
    { id: "ex", label: "EX6" }
];

let state = {
    player: { slots: {}, training: {}, syukuen: {} },
    enemy: { slots: {}, training: {} } // 敵軍からsyukuenを削除
};

let currentSlotId = "";
let currentTab = "country";
let belongsCategories = [];
let lastCategory = ""; // 戻るボタン用

document.addEventListener("DOMContentLoaded", function() {
    initApp();
    setupGlobalEvents();
});

function initApp() {
    if (window.bushosData) {
        const belongsSet = new Set();
        window.bushosData.forEach(b => {
            if (Array.isArray(b.belongs)) b.belongs.forEach(cat => belongsSet.add(cat));
        });
        belongsCategories = Array.from(belongsSet).sort();
    }
    renderGrid('player-grid', 'p');
    renderGrid('enemy-grid', 'e');
}

function setupGlobalEvents() {
    document.getElementById('main-calc-btn').addEventListener('click', () => alert("計算中..."));
    document.getElementById('close-modal-btn').addEventListener('click', () => $('#modal').hide());
    document.getElementById('busho-search').addEventListener('input', onSearchInput);
    document.getElementById('btn-tab-country').addEventListener('click', () => switchTab('country'));
    document.getElementById('btn-tab-belongs').addEventListener('click', () => switchTab('belongs'));
    document.getElementById('menu-overlay').addEventListener('click', closeMenu);
    document.getElementById('menu-change-btn').addEventListener('click', () => { closeMenu(); openBushoModal(); });
    document.getElementById('menu-delete-btn').addEventListener('click', deleteBusho);
}

function renderGrid(containerId, prefix) {
    const container = document.getElementById(containerId);
    units.forEach(unit => {
        const col = document.createElement('div');
        col.className = 'unit-column';
        col.innerHTML = `<div style="text-align:center;font-size:0.75rem;background:#333;color:#b59153;padding:3px;">${unit.name}</div>`;

        for (let i = 0; i < unit.rows; i++) {
            const sid = `${prefix}-${unit.name}-${i}`;
            const slot = document.createElement('div');
            slot.className = 'slot'; slot.id = sid;
            slot.innerHTML = '<span style="color:#333;font-size:2rem;">+</span>';
            slot.addEventListener('click', () => onSlotClick(sid));
            col.appendChild(slot);

            const trainDiv = document.createElement('div');
            trainDiv.className = 'training-settings';
            trainingItems.forEach(it => {
                const lb = document.createElement('label');
                lb.className = 'training-label';
                const ck = document.createElement('input');
                ck.type = 'checkbox';
                ck.addEventListener('change', (e) => updateT(prefix, sid, it.id, e.target.checked));
                lb.appendChild(ck);
                lb.append(it.label);
                trainDiv.appendChild(lb);
            });
            col.appendChild(trainDiv);
        }

        // 味方軍(p)かつ軍師以外のみ宿縁枠を表示
        if (prefix === 'p' && unit.type !== 'gunshi') {
            const extra = document.createElement('div');
            extra.className = 'extra-input-area';
            extra.id = `extra-${prefix}-${unit.name}`;
            col.appendChild(extra);
        }
        container.appendChild(col);
    });
}

function onSlotClick(sid) {
    currentSlotId = sid;
    const side = sid.startsWith('p') ? 'player' : 'enemy';
    if (state[side].slots[sid]) {
        $('#menu-name').text(state[side].slots[sid].name);
        $('#menu-overlay, #menu-modal').show();
    } else {
        openBushoModal();
    }
}

function openBushoModal() {
    $('#modal-search-area').show();
    $('#modal-title-text').text("武将選択");
    $('#modal').show();
    switchTab(currentTab);
}

function switchTab(tab) {
    currentTab = tab;
    $('.tab-btn').removeClass('active');
    $(`#btn-tab-${tab}`).addClass('active');
    renderCategoryList(tab);
}

function renderCategoryList(type) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    const items = (type === 'country') ? ["秦国", "趙国", "魏国", "楚国", "韓国", "斉国", "燕国", "山の民", "毐国"] : belongsCategories;
    items.forEach(it => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn'; btn.style = "width:100%;text-align:left;margin:2px 0;";
        btn.innerText = it;
        btn.onclick = () => renderBushoList(type, it);
        body.appendChild(btn);
    });
}

function renderBushoList(type, val) {
    lastCategory = val;
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    const back = document.createElement('button');
    back.style = "width:100%;padding:10px;margin-bottom:10px;background:#444;color:#fff;border:none;";
    back.innerText = `← 戻る (${val})`;
    back.onclick = () => renderCategoryList(type);
    body.appendChild(back);

    const filtered = window.bushosData.filter(b => {
        if (type === 'country') return b.country === val;
        return Array.isArray(b.belongs) && b.belongs.includes(val);
    });

    filtered.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn'; btn.style = "width:100%;text-align:left;margin:1px 0;";
        btn.innerText = b.name;
        btn.onclick = () => renderImageList(b, type);
        body.appendChild(btn);
    });
}

// 画像選択画面を表示（抜粋コードを統合・修正）
function renderImageList(busho, originType) {
    $('#modal-search-area').hide();
    $('#modal-title-text').text(`${busho.name} - 画像選択`);
    const body = document.getElementById('modal-body');
    body.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.style = "width:100%;padding:10px;background:#444;color:#fff;border:none;cursor:pointer;margin-bottom:10px;";
    backBtn.innerText = "← 武将選択に戻る";
    backBtn.onclick = () => {
        $('#modal-search-area').show();
        renderBushoList(originType, lastCategory);
    };
    body.appendChild(backBtn);

    const grid = document.createElement('div');
    grid.className = 'image-grid';
    
    const imageList = busho.imgs && busho.imgs.length > 0 ? busho.imgs : ["images/default.jpg"];
    
    imageList.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'image-item';
        img.onclick = () => selectBusho(busho, src);
        grid.appendChild(img);
    });
    body.appendChild(grid);
}

function selectBusho(b, selectedImg) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    state[side].slots[currentSlotId] = { name: b.name, img: selectedImg };
    
    const slot = document.getElementById(currentSlotId);
    slot.innerHTML = `<img src="${selectedImg}">`;
    
    const parts = currentSlotId.split('-');
    if (parts[0] === 'p' && parts[2] === "0") updateExtraInputs(parts[0], parts[1]);
    $('#modal').hide();
}

function updateExtraInputs(pre, uName) {
    const target = document.getElementById(`extra-${pre}-${uName}`);
    if (!target) return;
    target.innerHTML = '';
    [1, 2].forEach(i => {
        const group = document.createElement('div');
        group.className = 'syu-group';
        group.innerHTML = `<div class="syu-title">宿縁/宿運枠 ${i}</div>`;
        [['所持','c'],['R極','r'],['技極','g']].forEach(f => {
            const row = document.createElement('div');
            row.className = 'syu-row';
            row.append(f[0]);
            const inp = document.createElement('input');
            inp.type = 'number'; inp.min = '0'; inp.value = '0';
            inp.addEventListener('input', (e) => {
                if(e.target.value < 0) e.target.value = 0;
                updateS(pre, uName, i, f[1], e.target.value);
            });
            row.appendChild(inp);
            group.appendChild(row);
        });
        target.appendChild(group);
    });
}

function onSearchInput() {
    const q = document.getElementById('busho-search').value.trim();
    if (!q) { renderCategoryList(currentTab); return; }
    const body = document.getElementById('modal-body');
    body.innerHTML = "";
    window.bushosData.filter(b => b.name.includes(q)).forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn'; btn.style = "width:100%;text-align:left;";
        btn.innerText = `${b.name} (${b.country})`;
        btn.onclick = () => renderImageList(b, currentTab);
        body.appendChild(btn);
    });
}

function deleteBusho() {
    const parts = currentSlotId.split('-');
    const side = parts[0] === 'p' ? 'player' : 'enemy';
    delete state[side].slots[currentSlotId];
    document.getElementById(currentSlotId).innerHTML = '+';
    if(parts[0] === 'p' && parts[2] === "0") {
        const ex = document.getElementById(`extra-${parts[0]}-${parts[1]}`);
        if(ex) ex.innerHTML = "";
    }
    closeMenu();
}

function closeMenu() { $('#menu-overlay, #menu-modal').hide(); }
function updateS(pre, u, f, t, v) {
    if(!state.player.syukuen[u]) state.player.syukuen[u] = {1:{}, 2:{}};
    state.player.syukuen[u][f][t] = Math.max(0, parseFloat(v) || 0);
}
function updateT(pre, sid, tid, val) {
    const side = pre === 'p' ? 'player' : 'enemy';
    if (!state[side].training[sid]) state[side].training[sid] = {};
    state[side].training[sid][tid] = val;
}
