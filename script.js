/**
 * script.js - キン乱計算シミュレーター v15.0
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
    player: { slots: {}, training: {}, traits: {}, syukuen: {} },
    enemy: { slots: {}, training: {}, traits: {}, syukuen: {} }
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

        // 武将スロット（大将・副将）
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

        // 宿縁・特性入力エリア（各列の下部に配置）
        if (unit.type !== 'gunshi') {
            const extraInput = document.createElement('div');
            extraInput.className = 'extra-input-area';
            extraInput.id = `extra-${prefix}-${unit.name}`;
            col.appendChild(extraInput);
        }

        // 部隊計算結果エリア
        const resArea = document.createElement('div');
        resArea.className = 'unit-result-area';
        resArea.id = `res-${prefix}-${unit.name}`;
        resArea.innerHTML = `<div class="res-toggle" onclick="toggleRes('${prefix}-${unit.name}')">▽ 部隊バフ</div><div class="res-body"></div>`;
        col.appendChild(resArea);

        container.appendChild(col);
    });
}

// 宿縁・特性入力欄の生成 (大将が選択された時のみ)
function updateExtraInputs(prefix, unitName, busho) {
    const target = document.getElementById(`extra-${prefix}-${unitName}`);
    target.innerHTML = '';

    // 1. 武将固有特性 (大将のみ)
    const skills = window.bushosSkills ? window.bushosSkills[busho.name] : null;
    if (skills && skills.traits) {
        skills.traits.forEach(t => {
            const div = document.createElement('div');
            div.className = 'trait-input-box';
            div.innerHTML = `<span>${t}</span><input type="number" placeholder="0" oninput="updateStateValue('${prefix}', 'traits', '${t}', this.value)">`;
            target.appendChild(div);
        });
    }

    // 2. 宿縁・宿運入力 (所持・ランク・技極)
    if (skills && (skills.hasSyukuen || skills.hasSyukuun)) {
        const syuDiv = document.createElement('div');
        syuDiv.className = 'syukuen-input-group';
        syuDiv.innerHTML = `
            <div class="syu-title">宿縁/宿運</div>
            <div class="syu-row">所持<input type="number" oninput="updateSyukuen('${prefix}', '${unitName}', 'count', this.value)"></div>
            <div class="syu-row">R極 <input type="number" oninput="updateSyukuen('${prefix}', '${unitName}', 'rank', this.value)"></div>
            <div class="syu-row">技極<input type="number" oninput="updateSyukuen('${prefix}', '${unitName}', 'gi', this.value)"></div>
        `;
        target.appendChild(syuDiv);
    }
}

function updateStateValue(prefix, category, key, val) {
    const side = (prefix === 'p') ? 'player' : 'enemy';
    state[side][category][key] = parseFloat(val) || 0;
}

function updateSyukuen(prefix, unitName, type, val) {
    const side = (prefix === 'p') ? 'player' : 'enemy';
    if(!state[side].syukuen[unitName]) state[side].syukuen[unitName] = {count:0, rank:0, gi:0};
    state[side].syukuen[unitName][type] = parseFloat(val) || 0;
}

// 計算実行
function calculateAll() {
    ['p', 'e'].forEach(prefix => {
        units.forEach(unit => {
            const body = document.querySelector(`#res-${prefix}-${unit.name} .res-body`);
            body.innerHTML = ''; // リセット

            // ダミー計算結果の表示例
            const side = prefix === 'p' ? 'player' : 'enemy';
            const stats = { atk: 100, def: 100 }; // ここにロジックを実装

            const html = `
                <div class="res-item">攻撃力: <span class="val">+${stats.atk}%</span></div>
                <div class="res-item">防御力: <span class="val">+${stats.def}%</span></div>
                <div class="situation-header">▽ 戦闘時状況</div>
                <div class="res-item-cond">近接交戦時: ATK+50%</div>
                <div class="res-item-cond">山地形: DEF+30%</div>
            `;
            body.innerHTML = html;
        });
    });
}

function toggleRes(id) {
    document.querySelector(`#res-${id} .res-body`).classList.toggle('active');
}

/* --- 以下、既存の検索・モーダル処理 (省略・統合済み) --- */
function selectBusho(busho) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    const [prefix, unitName, rowIdx] = currentSlotId.split('-');
    
    state[side].slots[currentSlotId] = busho;
    document.getElementById(currentSlotId).innerHTML = `<img src="${busho.imgs[0]}">`;
    
    // 大将(rowIdx "0")の場合のみ特性・宿縁入力を更新
    if (rowIdx === "0") {
        updateExtraInputs(prefix, unitName, busho);
    }
    closePopup();
}
// (他、モーダル開閉などは前回分を継承)
