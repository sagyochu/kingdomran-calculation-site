/**
 * script.js - キン乱計算シミュレーター 修正・機能復旧版
 */

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
    enemy: { slots: {}, training: {}, syukuen: {} }
};

let currentSlotId = "";
let currentTab = "country";

$(document).ready(() => {
    renderGrid('player-grid', 'p');
    renderGrid('enemy-grid', 'e');
});

function renderGrid(containerId, prefix) {
    const container = document.getElementById(containerId);
    units.forEach(unit => {
        const col = document.createElement('div');
        col.className = 'unit-column';
        col.innerHTML = `<div style="text-align:center;font-size:0.8rem;background:#333;color:#b59153;padding:4px;">${unit.name}</div>`;

        for (let i = 0; i < unit.rows; i++) {
            const slotId = `${prefix}-${unit.name}-${i}`;
            const wrap = document.createElement('div');
            wrap.className = 'slot-wrapper';
            wrap.innerHTML = `
                <div class="slot" id="${slotId}" onclick="onSlotClick('${slotId}')"><span style="font-size:2rem;color:#444;">+</span></div>
                <div class="training-settings">
                    ${trainingItems.map(item => `
                        <label class="training-label">
                            <input type="checkbox" onchange="updateTraining('${prefix}','${slotId}','${item.id}',this.checked)"> ${item.label}
                        </label>
                    `).join('')}
                </div>
            `;
            col.appendChild(wrap);
        }

        if (unit.type !== 'gunshi') {
            const extra = document.createElement('div');
            extra.className = 'extra-input-area';
            extra.id = `extra-${prefix}-${unit.name}`;
            col.appendChild(extra);
        }

        const res = document.createElement('div');
        res.className = 'unit-result-area';
        res.id = `res-${prefix}-${unit.name}`;
        res.innerHTML = `<div class="res-toggle" onclick="toggleRes('${prefix}-${unit.name}')">▽ 部隊バフ</div><div class="res-body" id="body-${prefix}-${unit.name}"></div>`;
        col.appendChild(res);

        container.appendChild(col);
    });
}

function onSlotClick(slotId) {
    currentSlotId = slotId;
    const side = slotId.startsWith('p') ? 'player' : 'enemy';
    if (state[side].slots[slotId]) {
        $('#menu-name').text(state[side].slots[slotId].name);
        $('#menu-overlay, #menu-modal').show();
    } else {
        openPopup();
    }
}

function openPopup() {
    $('#modal').show();
    $('#busho-search').val('');
    switchTab(currentTab);
}

function closePopup() { $('#modal').hide(); }
function closeMenu() { $('#menu-overlay, #menu-modal').hide(); }

function switchTab(tab) {
    currentTab = tab;
    $('.tab-btn').removeClass('active');
    if (tab === 'country') {
        $('#btn-tab-country').addClass('active');
        renderCategoryList('country');
    } else {
        $('#btn-tab-belongs').addClass('active');
        renderCategoryList('belongs');
    }
}

function renderCategoryList(type) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    const categories = (type === 'country') 
        ? ["秦国", "趙国", "魏国", "楚国", "韓国", "斉国", "燕国", "山の民", "毐国"]
        : ["飛信隊", "玉鳳隊", "楽華隊", "王騎軍", "麃公軍", "桓騎軍", "王翦軍", "呂氏陣営", "山の民"];

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.style.width = '100%'; btn.style.textAlign = 'left'; btn.style.marginBottom = '5px';
        btn.innerText = cat;
        btn.onclick = () => renderBushoList(type, cat);
        body.appendChild(btn);
    });
}

function renderBushoList(type, value) {
    const body = document.getElementById('modal-body');
    body.innerHTML = `<button onclick="renderCategoryList('${type}')" style="width:100%;padding:10px;background:#555;color:#fff;margin-bottom:10px;border:none;cursor:pointer;">← 戻る (${value})</button>`;
    
    if (!window.bushosData) return;
    const list = window.bushosData.filter(b => b[type] === value);
    list.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.style.width = '100%'; btn.style.textAlign = 'left'; btn.style.marginBottom = '2px';
        btn.innerText = b.name;
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
    });
}

function onSearchInput() {
    const q = $('#busho-search').val().trim();
    if (!q) { renderCategoryList(currentTab); return; }
    const body = document.getElementById('modal-body');
    body.innerHTML = "";
    window.bushosData.filter(b => b.name.includes(q)).forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.style.width = '100%'; btn.style.textAlign = 'left'; btn.style.marginBottom = '2px';
        btn.innerText = `${b.name} (${b.country})`;
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
    });
}

function selectBusho(busho) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    const parts = currentSlotId.split('-');
    state[side].slots[currentSlotId] = busho;
    
    document.getElementById(currentSlotId).innerHTML = `<img src="${busho.imgs[0]}">`;
    if (parts[2] === "0") updateExtraInputs(parts[0], parts[1]);
    closePopup();
}

function updateExtraInputs(prefix, unitName) {
    const target = document.getElementById(`extra-${prefix}-${unitName}`);
    if (!target) return;
    
    // 宿縁1と宿縁2（または宿運）の2つの計算枠を作成
    let html = '';
    [1, 2].forEach(i => {
        html += `
            <div class="syu-group">
                <div class="syu-title">宿縁/宿運枠 ${i}</div>
                <div class="syu-row">所持<input type="number" min="0" value="0" oninput="v(this); updateS('${prefix}','${unitName}',${i},'count',this.value)"></div>
                <div class="syu-row">R極<input type="number" min="0" value="0" oninput="v(this); updateS('${prefix}','${unitName}',${i},'rank',this.value)"></div>
                <div class="syu-row">技極<input type="number" min="0" value="0" oninput="v(this); updateS('${prefix}','${unitName}',${i},'gi',this.value)"></div>
            </div>
        `;
    });
    target.innerHTML = html;
}

// 負の値ガード
function v(input) { if(input.value < 0) input.value = 0; }

function updateS(prefix, unitName, frameId, type, val) {
    const side = prefix === 'p' ? 'player' : 'enemy';
    if(!state[side].syukuen[unitName]) state[side].syukuen[unitName] = {1:{}, 2:{}};
    state[side].syukuen[unitName][frameId][type] = Math.max(0, parseFloat(val) || 0);
}

function updateTraining(prefix, slotId, itemId, val) {
    const side = prefix === 'p' ? 'player' : 'enemy';
    if (!state[side].training[slotId]) state[side].training[slotId] = {};
    state[side].training[slotId][itemId] = val;
}

function toggleRes(id) { $(`#body-${id}`).toggleClass('active'); }

function handleMenuSelection(action) {
    const parts = currentSlotId.split('-');
    const side = parts[0] === 'p' ? 'player' : 'enemy';
    closeMenu();
    if (action === 'change-busho') openPopup();
    if (action === 'delete-img') {
        delete state[side].slots[currentSlotId];
        document.getElementById(currentSlotId).innerHTML = `<span style="font-size:2rem;color:#444;">+</span>`;
        if(parts[2] === "0") document.getElementById(`extra-${parts[0]}-${parts[1]}`).innerHTML = "";
    }
}

function calculateAll() { alert("計算を実行しました。"); }
