/**
 * script.js - 数値計算シミュレーター用 (v14.0)
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
    { id: "gi", label: "技極" },
    { id: "ura", label: "裏技極" },
    { id: "lg", label: "LG" },
    { id: "lg1", label: "LG1" },
    { id: "lg2", label: "LG2" },
    { id: "lg3", label: "LG3" },
    { id: "ex", label: "EX(6)" }
];

let state = {
    player: { slots: {}, training: {}, traits: {} },
    enemy: { slots: {}, training: {}, traits: {} }
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

        for (let i = 0; i < unit.rows; i++) {
            const slotId = `${prefix}-${unit.name}-${i}`;
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.id = slotId;
            slot.onclick = () => onSlotClick(slotId);
            slot.innerHTML = `<div class="plus-mark">+</div>`;
            col.appendChild(slot);

            // 育成設定
            const tDiv = document.createElement('div');
            tDiv.className = 'training-settings';
            trainingItems.forEach(item => {
                const l = document.createElement('label');
                l.className = 'training-label';
                l.innerHTML = `<input type="checkbox" onchange="updateTraining('${prefix}', '${slotId}', '${item.id}', this.checked)"> ${item.label}`;
                tDiv.appendChild(l);
            });
            col.appendChild(tDiv);
        }
        container.appendChild(col);
    });
}

function updateTraining(prefix, slotId, itemId, val) {
    const side = (prefix === 'p') ? 'player' : 'enemy';
    if (!state[side].training[slotId]) state[side].training[slotId] = {};
    state[side].training[slotId][itemId] = val;
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
    state[side].slots[currentSlotId] = busho;
    
    const el = document.getElementById(currentSlotId);
    el.innerHTML = `<img src="${busho.imgs[0]}">`;
    el.setAttribute('data-busho-name', busho.name);
    
    updateTraitsUI();
    closePopup();
}

function updateTraitsUI() {
    const container = document.getElementById('traits-inputs');
    container.innerHTML = '';
    const traitNames = new Set();

    // 両軍のスキルデータから特性名を抽出
    ['player', 'enemy'].forEach(side => {
        Object.values(state[side].slots).forEach(b => {
            const skills = window.bushosSkills ? window.bushosSkills[b.name] : null;
            if (skills && skills.traits) {
                skills.traits.forEach(t => traitNames.add(t));
            }
        });
    });

    if (traitNames.size === 0) {
        container.innerHTML = '<p style="color:#666; font-size:0.8rem;">特性を持つ武将が選択されていません</p>';
        return;
    }

    traitNames.forEach(t => {
        const box = document.createElement('div');
        box.className = 'trait-box';
        box.innerHTML = `<span>${t}</span><input type="number" value="${state.player.traits[t] || 0}" oninput="updateTraitValue('${t}', this.value)">`;
        container.appendChild(box);
    });
}

function updateTraitValue(name, val) {
    state.player.traits[name] = parseFloat(val) || 0;
    state.enemy.traits[name] = parseFloat(val) || 0;
}

function calculateAll() {
    // ここにご提示いただいた公式を元にした計算処理を実装予定
    // 現時点では動作確認用の表示のみ
    document.getElementById('p-res-summary').innerText = "計算済み";
    document.getElementById('e-res-summary').innerText = "計算済み";
    
    document.getElementById('player-res').innerHTML = "<p>※bushos-skills.js読み込み後に詳細な数値が表示されます。</p>";
    document.getElementById('enemy-res').innerHTML = "<p>※敵軍デバフ計算ロジック待機中...</p>";
}

function toggleAccordion(id) {
    document.getElementById(id).classList.toggle('active');
}

/* ポップアップ・メニュー基本操作 */
function openPopup() { $('#modal').show(); switchTab('country'); }
function closePopup() { $('#modal').hide(); }
function closeMenu() { $('#menu-overlay, #menu-modal').fadeOut(200); }

function handleMenuSelection(action) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    closeMenu();
    if (action === 'change-busho') openPopup();
    if (action === 'delete-img') {
        delete state[side].slots[currentSlotId];
        document.getElementById(currentSlotId).innerHTML = `<div class="plus-mark">+</div>`;
        updateTraitsUI();
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
