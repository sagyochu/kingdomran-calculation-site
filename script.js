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

const belongsMap = {
    "フィゴ族": ["ダント", "パム"], "メラ族": ["カタリ", "キタリ"], "中華十弓": ["白麗", "蒼源", "魏加", "黄離弦", "姜燕"],
    "亜光軍": ["亜光", "英紀"], "合従軍": ["春申君", "汗明", "項翼", "白麗", "臨武君", "バミュウ", "媧燐", "媧偃", "仁凹", "貝満", "剛摩諸", "魯近", "豪徳", "巨暴", "オルド", "ユキイ", "オタジ", "李牧", "龐煖", "カイネ", "万極", "李白", "公孫龍", "傅抵", "晋成常", "慶舎", "成恢", "奈棍", "張印", "呉鳳明"],
    "呂氏四柱": ["蒙武", "昌平君", "李斯", "蔡沢"], "媧燐軍": ["項翼", "白麗", "バミュウ", "媧燐", "媧偃", "豪徳"], "廉頗四天王": ["輪虎", "介子坊", "玄峰", "姜燕"],
    "廉頗軍": ["廉頗", "輪虎", "介子坊", "玄峰", "姜燕"], "成恢軍": ["成恢", "奈棍"], "桓騎軍": ["桓騎", "黒桜", "雷土", "摩論", "オギコ", "ゼノウ", "リン玉", "那貴", "馬印", "角雲", "呂敏"],
    "楽華隊": ["蒙恬", "陸仙", "蒙恬のじィ"], "汗明軍": ["汗明", "仁凹", "貝満", "剛摩諸", "巨暴"], "玉鳳隊": ["王賁", "番陽", "関常", "宮康", "松琢"],
    "王翦軍": ["王翦", "関常", "宮康", "松琢", "田里弥", "亜光", "麻鉱", "英紀"], "王騎軍": ["王騎", "騰", "録嗚未", "鱗坊", "同金", "干央", "隆国"],
    "秦の六大将軍": ["王騎", "白起", "王齕", "司馬錯", "胡傷", "摎"], "紀彗軍": ["紀彗", "馬呈", "劉冬", "紀昌", "青公"],
    "飛信隊": ["信", "河了貂", "尾平", "尾到", "澤圭", "羌瘣", "渕", "楚水", "田有", "沛浪", "松左", "竜川", "田永", "崇原", "石", "去亥", "魯延", "昂", "慶", "我呂", "中鉄", "竜有", "岳雷", "那貴", "呂敏", "有義"],
    "魏火龍": ["呉慶", "凱孟", "霊凰", "紫伯", "太呂慈"]
};

let state = {
    player: { slots: {}, training: {}, syukuen: {} },
    enemy: { slots: {}, training: {}, syukuen: {} }
};

let currentSlotId = "";
let currentTab = "country";

// DOMの読込完了を待つ
document.addEventListener("DOMContentLoaded", function() {
    initApp();
    setupGlobalEvents();
});

function initApp() {
    // データ注入
    if (window.bushosData) {
        window.bushosData.forEach(b => {
            b.belongs = [];
            for (const [g, m] of Object.entries(belongsMap)) {
                if (m.includes(b.name)) b.belongs.push(g);
            }
        });
    }
    // 描画
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
    document.getElementById('menu-change-btn').addEventListener('click', () => { closeMenu(); $('#modal').show(); switchTab(currentTab); });
    document.getElementById('menu-delete-btn').addEventListener('click', deleteBusho);
}

function renderGrid(containerId, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    units.forEach(unit => {
        const col = document.createElement('div');
        col.className = 'unit-column';
        
        const title = document.createElement('div');
        title.style = "text-align:center;font-size:0.75rem;background:#333;color:#b59153;padding:3px;";
        title.innerText = unit.name;
        col.appendChild(title);

        for (let i = 0; i < unit.rows; i++) {
            const sid = `${prefix}-${unit.name}-${i}`;
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.id = sid;
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

        if (unit.type !== 'gunshi') {
            const extra = document.createElement('div');
            extra.className = 'extra-input-area';
            extra.id = `extra-${prefix}-${unit.name}`;
            col.appendChild(extra);
        }

        const res = document.createElement('div');
        res.className = 'unit-result-area';
        const toggle = document.createElement('div');
        toggle.className = 'res-toggle';
        toggle.innerText = '▽ 部隊バフ';
        const body = document.createElement('div');
        body.className = 'res-body';
        toggle.addEventListener('click', () => $(body).toggle());
        res.appendChild(toggle);
        res.appendChild(body);
        col.appendChild(res);

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
        $('#modal').show();
        switchTab(currentTab);
    }
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
    const items = (type === 'country') ? ["秦国", "趙国", "魏国", "楚国", "韓国", "斉国", "燕国", "山の民", "毐国"] : Object.keys(belongsMap);
    items.forEach(it => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.style = "width:100%;text-align:left;margin:2px 0;";
        btn.innerText = it;
        btn.onclick = () => renderBushoList(type, it);
        body.appendChild(btn);
    });
}

function renderBushoList(type, val) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    const back = document.createElement('button');
    back.style = "width:100%;padding:10px;margin-bottom:10px;background:#444;color:#fff;border:none;";
    back.innerText = `← 戻る (${val})`;
    back.onclick = () => renderCategoryList(type);
    body.appendChild(back);

    const filtered = window.bushosData.filter(b => (type === 'country') ? b.country === val : b.belongs.includes(val));
    filtered.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.style = "width:100%;text-align:left;margin:1px 0;";
        btn.innerText = b.name;
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
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
        btn.onclick = () => selectBusho(b);
        body.appendChild(btn);
    });
}

function selectBusho(b) {
    const side = currentSlotId.startsWith('p') ? 'player' : 'enemy';
    state[side].slots[currentSlotId] = b;
    const slot = document.getElementById(currentSlotId);
    slot.innerHTML = b.imgs ? `<img src="${b.imgs[0]}">` : b.name;
    const parts = currentSlotId.split('-');
    if (parts[2] === "0") updateExtraInputs(parts[0], parts[1]);
    $('#modal').hide();
}

function updateExtraInputs(pre, uName) {
    const target = document.getElementById(`extra-${pre}-${uName}`);
    if (!target) return;
    target.innerHTML = '';
    [1, 2].forEach(i => {
        const group = document.createElement('div');
        group.className = 'syu-group';
        group.innerHTML = `<div class="syu-title">枠 ${i}</div>`;
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

function deleteBusho() {
    const parts = currentSlotId.split('-');
    const side = parts[0] === 'p' ? 'player' : 'enemy';
    delete state[side].slots[currentSlotId];
    document.getElementById(currentSlotId).innerHTML = '+';
    if(parts[2] === "0") {
        const ex = document.getElementById(`extra-${parts[0]}-${parts[1]}`);
        if(ex) ex.innerHTML = "";
    }
    closeMenu();
}

function closeMenu() { $('#menu-overlay, #menu-modal').hide(); }

function updateS(pre, u, f, t, v) {
    const side = pre === 'p' ? 'player' : 'enemy';
    if(!state[side].syukuen[u]) state[side].syukuen[u] = {1:{}, 2:{}};
    state[side].syukuen[u][f][t] = Math.max(0, parseFloat(v) || 0);
}
function updateT(pre, sid, tid, val) {
    const side = pre === 'p' ? 'player' : 'enemy';
    if (!state[side].training[sid]) state[side].training[sid] = {};
    state[side].training[sid][tid] = val;
}
