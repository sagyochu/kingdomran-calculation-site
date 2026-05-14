/**
 * script.js - キン乱計算シミュレーター 修正版
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

window.onload = () => {
    renderGrid('player-grid', 'p');
    renderGrid('enemy-grid', 'e');
};

function renderGrid(containerId, prefix) {
    const container = document.getElementById(containerId);
    units.forEach(unit => {
        const col = document.createElement('div');
        col.className = 'unit-column';
        
        const label = document.createElement('div');
        label.className = `column-label label-${unit.type}`;
        label.innerText = unit.name;
        col.appendChild(label);

        // 武将スロット生成
        for (let i = 0; i < unit.rows; i++) {
            const slotId = `${prefix}-${unit.name}-${i}`;
            const slotWrapper = document.createElement('div');
            slotWrapper.className = 'slot-wrapper';

            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.id = slotId;
            slot.onclick = () => onSlotClick(slotId);
            slot.innerHTML = `<div class="plus-mark">+</div>`;
            
            slotWrapper.appendChild(slot);
            
            // 育成設定
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

        // 宿縁・宿運入力エリア（部隊バフの上に配置）
        if (unit.type !== 'gunshi') {
            const extraInput = document.createElement('div');
            extraInput.className = 'extra-input-area';
            extraInput.id = `extra-${prefix}-${unit.name}`;
            extraInput.innerHTML = `<div style="font-size:0.6rem; color:#555; text-align:center;">(宿縁/宿運 未開放)</div>`;
            col.appendChild(extraInput);
        }

        // 部隊計算結果エリア
        const resArea = document.createElement('div');
        resArea.className = 'unit-result-area';
        resArea.id = `res-${prefix}-${unit.name}`;
        resArea.innerHTML = `<div class="res-toggle" onclick="toggleRes('${prefix}-${unit.name}')">▽ 部隊バフ表示</div><div class="res-body" id="body-${prefix}-${unit.name}"></div>`;
        col.appendChild(resArea);

        container.appendChild(col);
    });
}

function onSlotClick(slotId) {
    currentSlotId = slotId;
    const side = slotId.startsWith('p') ? 'player' : 'enemy';
    if (state[side].slots[slotId]) {
        $('#menu-name').text(state[side].slots[slotId].name);
        $('#menu-overlay, #menu-modal').fadeIn(200);
    } else {
        openPopup();
    }
}

function selectBusho(busho) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    const parts = currentSlotId.split('-');
    const prefix = parts[0];
    const unitName = parts[1];
    const rowIdx = parts[2];

    state[side].slots[currentSlotId] = busho;
    document.getElementById(currentSlotId).innerHTML = `<img src="${busho.imgs[0]}">`;
    
    // 大将(0番目)が変更されたら宿縁入力欄を更新
    if (rowIdx === "0") {
        updateExtraInputs(prefix, unitName, busho);
    }
    closePopup();
}

function updateExtraInputs(prefix, unitName, busho) {
    const target = document.getElementById(`extra-${prefix}-${unitName}`);
    if (!target) return;

    // 宿縁・宿運入力欄を常に表示（定義は武将データに依存）
    target.innerHTML = `
        <div style="color:var(--border-gold); font-size:0.6rem; text-align:center; margin-bottom:3px;">宿縁・宿運状況</div>
        <div class="syu-row">所持武将数<input type="number" value="0" oninput="updateSyukuen('${prefix}', '${unitName}', 'count', this.value)"></div>
        <div class="syu-row">ランク最大<input type="number" value="0" oninput="updateSyukuen('${prefix}', '${unitName}', 'rank', this.value)"></div>
        <div class="syu-row">技極数　　<input type="number" value="0" oninput="updateSyukuen('${prefix}', '${unitName}', 'gi', this.value)"></div>
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
    document.getElementById(`body-${id}`).classList.toggle('active');
}

function calculateAll() {
    // 各部隊の結果エリアにダミー数値を反映
    units.forEach(unit => {
        ['p', 'e'].forEach(pre => {
            const body = document.getElementById(`body-${pre}-${unit.name}`);
            if(!body) return;
            body.innerHTML = `
                <div class="res-item">攻撃力: <span class="res-val">+0%</span></div>
                <div class="res-item">防御力: <span class="res-val">+0%</span></div>
                <div style="font-size:0.6rem; color:#666; margin-top:5px; border-top:1px solid #222;">(詳細データ待機中)</div>
            `;
        });
    });
    alert("全部隊の計算処理をシミュレートしました。");
}

/* 共通処理（不具合修正済み） */
function openPopup() { $('#modal').show(); switchTab('country'); }
function closePopup() { $('#modal').hide(); }
function closeMenu() { $('#menu-overlay, #menu-modal').fadeOut(200); }

function handleMenuSelection(action) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    const parts = currentSlotId.split('-');
    const prefix = parts[0];
    const unitName = parts[1];
    const rowIdx = parts[2];

    closeMenu();
    if (action === 'change-busho') openPopup();
    if (action === 'delete-img') {
        delete state[side].slots[currentSlotId];
        document.getElementById(currentSlotId).innerHTML = `<div class="plus-mark">+</div>`;
        if(rowIdx === "0") document.getElementById(`extra-${prefix}-${unitName}`).innerHTML = "";
    }
}

function switchTab(type) {
    const isCountry = (type === 'country');
    $('#tab-country').toggleClass('active', isCountry).css('background', isCountry ? '#444':'#222');
    $('#tab-belongs').toggleClass('active', !isCountry).css('background', !isCountry ? '#444':'#222');
    if (isCountry) renderCountryList(); else renderBelongsList();
}

function renderCountryList() {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    ["秦国", "趙国", "魏国", "楚国", "韓国", "斉国", "燕国", "山の民", "毐国"].forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = c;
        btn.onclick = () => renderBushoList(c);
        body.appendChild(btn);
    });
}

function renderBushoList(country) {
    const body = document.getElementById('modal-body');
    body.innerHTML = `<button class="choice-btn" style="background:#555;" onclick="renderCountryList()">← 戻る</button>`;
    window.bushosData.filter(b => b.country === country).forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
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
        btn.className = 'choice-btn';
        btn.innerText = `${b.name} (${b.country})`;
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
    });
}
