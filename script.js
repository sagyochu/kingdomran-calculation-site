/**
 * script.js - キン乱計算シミュレーター 修正完結版
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

// 状態管理
let state = {
    player: { slots: {}, training: {}, syukuen: {} },
    enemy: { slots: {}, training: {}, syukuen: {} }
};

let currentSlotId = ""; 

// 初期化：グリッド生成
$(document).ready(() => {
    renderGrid('player-grid', 'p');
    renderGrid('enemy-grid', 'e');
});

function renderGrid(containerId, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    units.forEach(unit => {
        const col = document.createElement('div');
        col.className = 'unit-column';
        
        const label = document.createElement('div');
        label.className = `column-label`;
        label.style.textAlign = 'center';
        label.style.fontSize = '0.8rem';
        label.style.padding = '4px';
        label.style.background = '#333';
        label.style.color = '#b59153';
        label.innerText = unit.name;
        col.appendChild(label);

        // 武将スロット (大将: i=0, 副将: i=1)
        for (let i = 0; i < unit.rows; i++) {
            const slotId = `${prefix}-${unit.name}-${i}`;
            const slotWrapper = document.createElement('div');
            slotWrapper.className = 'slot-wrapper';

            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.id = slotId;
            slot.style.width = '140px';
            slot.style.height = '140px';
            slot.style.background = '#222';
            slot.style.border = '1px solid #444';
            slot.style.margin = '0 auto';
            slot.style.display = 'flex';
            slot.style.alignItems = 'center';
            slot.style.justifyContent = 'center';
            slot.style.cursor = 'pointer';
            slot.style.overflow = 'hidden';
            slot.onclick = () => onSlotClick(slotId);
            slot.innerHTML = `<span style="font-size:2rem; color:#444;">+</span>`;
            
            slotWrapper.appendChild(slot);
            
            // 育成チェックボックス
            const tDiv = document.createElement('div');
            tDiv.className = 'training-settings';
            trainingItems.forEach(item => {
                const l = document.createElement('label');
                l.className = 'training-label';
                l.innerHTML = `<input type="checkbox" onchange="updateTraining('${prefix}', '${slotId}', '${item.id}', this.checked)"> ${item.label}`;
                tDiv.appendChild(l);
            });
            slotWrapper.appendChild(tDiv);
            col.appendChild(slotWrapper);
        }

        // 宿縁入力 (軍師以外)
        if (unit.type !== 'gunshi') {
            const extraInput = document.createElement('div');
            extraInput.className = 'extra-input-area';
            extraInput.id = `extra-${prefix}-${unit.name}`;
            col.appendChild(extraInput);
        }

        // 結果表示エリア
        const resArea = document.createElement('div');
        resArea.className = 'unit-result-area';
        resArea.id = `res-${prefix}-${unit.name}`;
        resArea.innerHTML = `
            <div class="res-toggle" onclick="toggleRes('${prefix}-${unit.name}')">▽ 部隊バフ表示</div>
            <div class="res-body" id="body-${prefix}-${unit.name}"></div>
        `;
        col.appendChild(resArea);

        container.appendChild(col);
    });
}

function onSlotClick(slotId) {
    currentSlotId = slotId;
    const side = slotId.startsWith('p') ? 'player' : 'enemy';
    if (state[side].slots[slotId]) {
        $('#menu-name').text(state[side].slots[slotId].name);
        $('#menu-overlay').show();
        $('#menu-modal').show();
    } else {
        openPopup();
    }
}

function openPopup() {
    $('#modal').css('display', 'block');
    switchTab('country');
}

function closePopup() {
    $('#modal').hide();
}

function closeMenu() {
    $('#menu-overlay').hide();
    $('#menu-modal').hide();
}

function selectBusho(busho) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    const parts = currentSlotId.split('-');
    const prefix = parts[0];
    const unitName = parts[1];
    const rowIdx = parts[2];

    state[side].slots[currentSlotId] = busho;
    
    const slotEl = document.getElementById(currentSlotId);
    if (busho.imgs && busho.imgs[0]) {
        slotEl.innerHTML = `<img src="${busho.imgs[0]}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
        slotEl.innerHTML = `<div style="font-size:0.8rem; color:#fff;">${busho.name}</div>`;
    }
    
    if (rowIdx === "0") {
        updateExtraInputs(prefix, unitName);
    }
    closePopup();
}

function updateExtraInputs(prefix, unitName) {
    const target = document.getElementById(`extra-${prefix}-${unitName}`);
    if (!target) return;
    target.innerHTML = `
        <div style="color:#b59153; font-size:0.6rem; text-align:center; margin-bottom:3px;">宿縁・宿運状況</div>
        <div class="syu-row">所持数 <input type="number" value="0" oninput="updateSyukuen('${prefix}', '${unitName}', 'count', this.value)"></div>
        <div class="syu-row">R極数 <input type="number" value="0" oninput="updateSyukuen('${prefix}', '${unitName}', 'rank', this.value)"></div>
        <div class="syu-row">技極数 <input type="number" value="0" oninput="updateSyukuen('${prefix}', '${unitName}', 'gi', this.value)"></div>
    `;
}

function updateTraining(prefix, slotId, itemId, val) {
    const side = (prefix === 'p') ? 'player' : 'enemy';
    if (!state[side].training[slotId]) state[side].training[slotId] = {};
    state[side].training[slotId][itemId] = val;
}

function updateSyukuen(prefix, unitName, type, val) {
    const side = (prefix === 'p') ? 'player' : 'enemy';
    if(!state[side].syukuen[unitName]) state[side].syukuen[unitName] = {count:0, rank:0, gi:0};
    state[side].syukuen[unitName][type] = parseFloat(val) || 0;
}

function toggleRes(id) {
    $(`#body-${id}`).toggle();
}

function handleMenuSelection(action) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    const parts = currentSlotId.split('-');
    closeMenu();
    if (action === 'change-busho') openPopup();
    if (action === 'delete-img') {
        delete state[side].slots[currentSlotId];
        document.getElementById(currentSlotId).innerHTML = `<span style="font-size:2rem; color:#444;">+</span>`;
        if(parts[2] === "0") document.getElementById(`extra-${parts[0]}-${parts[1]}`).innerHTML = "";
    }
}

function switchTab(type) {
    renderCountryList();
}

function renderCountryList() {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    const countries = ["秦国", "趙国", "魏国", "楚国", "韓国", "斉国", "燕国", "山の民", "毐国"];
    countries.forEach(c => {
        const btn = document.createElement('button');
        btn.style.width = '100%';
        btn.style.padding = '12px';
        btn.style.margin = '4px 0';
        btn.style.background = '#333';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #555';
        btn.style.textAlign = 'left';
        btn.style.cursor = 'pointer';
        btn.innerText = c;
        btn.onclick = () => renderBushoList(c);
        body.appendChild(btn);
    });
}

function renderBushoList(country) {
    const body = document.getElementById('modal-body');
    body.innerHTML = `<button onclick="renderCountryList()" style="width:100%; padding:10px; background:#555; color:#fff; border:none; margin-bottom:10px;">← 戻る</button>`;
    if (!window.bushosData) return;
    window.bushosData.filter(b => b.country === country).forEach(b => {
        const btn = document.createElement('button');
        btn.style.width = '100%';
        btn.style.padding = '10px';
        btn.style.margin = '2px 0';
        btn.style.background = '#444';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #666';
        btn.style.textAlign = 'left';
        btn.style.cursor = 'pointer';
        btn.innerText = b.name;
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
    });
}

function filterBushos() {
    const q = $('#busho-search').val().trim();
    if (!q) { renderCountryList(); return; }
    const body = document.getElementById('modal-body');
    body.innerHTML = "";
    window.bushosData.filter(b => b.name.includes(q)).forEach(b => {
        const btn = document.createElement('button');
        btn.style.width = '100%';
        btn.style.padding = '10px';
        btn.style.background = '#444';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #666';
        btn.innerText = `${b.name} (${b.country})`;
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
    });
}

function calculateAll() {
    alert("計算ロジック（bushos-skills.js連動）を実行します。");
}
