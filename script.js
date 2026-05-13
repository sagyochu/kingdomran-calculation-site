/**
 * vs-script.js - 数値計算シミュレーター用ロジック
 */

// 編成の定義（自軍・敵軍それぞれ6枠）
const units = [
    { name: "総大将", type: "soudaisho", rows: 2 },
    { name: "第1軍", type: "army", rows: 2 },
    { name: "第2軍", type: "army", rows: 2 },
    { name: "第3軍", type: "army", rows: 2 },
    { name: "第4軍", type: "army", rows: 2 },
    { name: "軍師", type: "gunshi", rows: 1 },
    { name: "援軍", type: "army", rows: 2 }
];

// 育成条件の定義
const trainingOptions = [
    { id: "gigoku", label: "技極" },
    { id: "ura-gigoku", label: "裏技極" },
    { id: "lg-awake", label: "LG覚醒2" },
    { id: "shukumei", label: "宿命" }
];

let bushoData = window.bushosData || [];
let bushosSkills = window.bushosSkills || {}; // bushos-skills.jsから読み込み

// データ構造：自軍(p)と敵軍(e)を分ける
let vsFormation = {
    player: { slots: {}, training: {}, traits: {} },
    enemy: { slots: {}, training: {}, traits: {} }
};

let currentSlotId = ""; // 例: "p-slot-総大将"
let lastSelectedCountry = "";

window.onload = () => {
    renderVSGrid('player-unit-container', 'p');
    renderVSGrid('enemy-unit-container', 'e');
    // 初期UI更新
};

// グリッドのレンダリング
function renderVSGrid(containerId, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    armyPositions.forEach(pos => {
        const col = document.createElement('div');
        col.className = 'unit-column';

        // ラベル
        const label = document.createElement('div');
        label.className = `column-label label-${pos.type}`;
        label.innerText = pos.name;
        col.appendChild(label);

        // 武将スロット (各1枠)
        const slotId = `${prefix}-slot-${pos.name}`;
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.id = slotId;
        slot.onclick = () => onBushoClick(slotId);
        slot.innerHTML = `<div class="plus-mark">+</div>`;
        col.appendChild(slot);

        // 育成チェックボックス
        const trainingDiv = document.createElement('div');
        trainingDiv.className = 'training-settings';
        trainingOptions.forEach(opt => {
            const wrapper = document.createElement('label');
            wrapper.className = 'training-label';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.onchange = () => {
                vsFormation[prefix === 'p' ? 'player' : 'enemy'].training[`${slotId}-${opt.id}`] = chk.checked;
            };
            wrapper.appendChild(chk);
            wrapper.appendChild(document.createTextNode(opt.label));
            trainingDiv.appendChild(wrapper);
        });
        col.appendChild(trainingDiv);
        container.appendChild(col);
    });
}

// 武将クリック時（既存のポップアップ流用）
function onBushoClick(slotId) {
    currentSlotId = slotId;
    const bushoName = document.getElementById(slotId).getAttribute('data-busho-name');
    if (!bushoName) {
        openPopup();
    } else {
        const busho = bushoData.find(b => b.name === bushoName);
        if (busho) {
            $('#menu-name').text(busho.name);
            $('#menu-overlay, #menu-modal').fadeIn(200);
        }
    }
}

// 武将画像確定後の処理（特性入力欄の生成を追加）
function selectBushoImage(src, bushoName) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    vsFormation[side].slots[currentSlotId] = { src: src, name: bushoName };
    
    const el = document.getElementById(currentSlotId);
    el.innerHTML = `<img src="${src}">`;
    el.setAttribute('data-busho-name', bushoName);

    updateTraitsInput(); // 特性入力欄を更新
    closePopup();
}

// 特性入力欄の動的生成
function updateTraitsInput() {
    const container = document.getElementById('traits-inputs');
    container.innerHTML = '';
    const addedTraits = new Set();

    // 自軍・敵軍両方のスロットをチェック
    ['player', 'enemy'].forEach(side => {
        Object.values(vsFormation[side].slots).forEach(slot => {
            const skillData = bushosSkills[slot.name];
            if (skillData && skillData.traits) {
                skillData.traits.forEach(traitName => {
                    if (!addedTraits.has(traitName)) {
                        const box = document.createElement('div');
                        box.className = 'trait-box';
                        box.innerHTML = `
                            <span>${traitName}</span>
                            <input type="number" value="${vsFormation[side].traits[traitName] || ''}" 
                             oninput="vsFormation.${side}.traits['${traitName}'] = this.value">
                        `;
                        container.appendChild(box);
                        addedTraits.add(traitName);
                    }
                });
            }
        });
    });
}

// 計算実行
function executeCalculation() {
    // ここに具体的な計算ロジック（乗算）を実装
    // 詳細な計算式が届き次第、内容を肉付けします
    alert("計算を実行しました。結果エリアに反映します。");
    
    // 仮の結果表示
    const pRes = document.getElementById('player-res');
    pRes.innerHTML = `
        <div class="result-item">▼ 飛信隊部隊<br>攻撃力: 150%上昇 / 防御力: 40%上昇</div>
        <div class="result-item">▼ 秦国部隊<br>攻撃力: 80%上昇</div>
    `;
}

// アコーディオン開閉
function toggleResult(id) {
    const target = document.getElementById(id);
    target.classList.toggle('active');
}

// 既存のポップアップ関連関数（renderImageListのみ確定ボタンを差し替え）
// renderImageListの中で、画像クリック時に selectBushoImage(src, busho.name) を呼ぶように修正してください。
