document.addEventListener('DOMContentLoaded', () => {

    // --- РЕЦЕПТЫ ЗАГРУЖАЮТСЯ ИЗ ФАЙЛА ---
    let recipes = {};
    // --- КОНФИГ ЭКСПЕДИЦИЙ ЗАГРУЖАЕТСЯ ИЗ ФАЙЛА ---
    let expConfig = {};

    // --- МЕТАДАННЫЕ РЕСУРСОВ ДЛЯ ИКОНКИ/НАЗВАНИЯ/ИСТОЧНИКА ---
    const resourceMeta = {
        wood:        { name: 'Дерево', icon: '🌲', source: 'Экспедиции: режим «Дерево» или «Авто»' },
        stone:       { name: 'Камень', icon: '⛰️', source: 'Экспедиции: режим «Камень» или «Авто»' },
        planks:      { name: 'Доски', icon: '🪵', source: 'Мастерская: рецепт «Доски»' },
        stone_bricks:{ name: 'Каменные блоки', icon: '🧱', source: 'Мастерская: рецепт «Каменные блоки»' },
        dry_food:    { name: 'Сухая еда', icon: '🥫', source: 'Экспедиции: «Поиск еды»' },
        food:        { name: 'Готовая еда', icon: '🍲', source: 'Мастерская: рецепт «Готовая еда» (повар)' },
        crystals:    { name: 'Кристаллы', icon: '💎', source: 'Мастерская: рецепт «Амулет Призыва»' },
        esense:      { name: 'Эссенция', icon: '💫', source: 'Экспедиции: режим «Эссенция»' },
        magic_dust:  { name: 'Магическая пыль', icon: '✨', source: 'Алхимия: рецепт «Магическая пыль»' },
        iron_ingot:  { name: 'Железный слиток', icon: '⛓️', source: 'Мастерская: рецепт «Железные слитки»' },
        steel:       { name: 'Сталь', icon: '⚙️', source: 'Мастерская: рецепт «Сталь»' },
        leather:     { name: 'Кожа', icon: '🧥', source: 'Мастерская: рецепт «Кожа»' },
        rope:        { name: 'Верёвка', icon: '🪢', source: 'Мастерская: рецепт «Верёвка»' },
        paper:       { name: 'Бумага', icon: '📜', source: 'Мастерская: рецепт «Бумага»' },
        glass:       { name: 'Стекло', icon: '🧪', source: 'Мастерская: рецепт «Стекло»' },
        healing_potion: { name: 'Зелье лечения', icon: '🧴', source: 'Алхимия: рецепт «Зелье лечения»' },
        mana_potion: { name: 'Зелье маны', icon: '🔮', source: 'Алхимия: рецепт «Зелье маны»' },
        herb_extract:{ name: 'Травяной экстракт', icon: '🌿', source: 'Алхимия: рецепт «Травяной экстракт»' },
        tools:       { name: 'Инструменты', icon: '🛠️', source: 'Мастерская: рецепт «Инструменты»' },
        amulet_core: { name: 'Ядро амулета', icon: '🧿', source: 'Алхимия: рецепт «Ядро амулета»' },
        greater_healing_potion: { name: 'Большое зелье лечения', icon: '🧪', source: 'Алхимия: «Большое зелье лечения»' },
        elixir_power: { name: 'Эликсир силы', icon: '🧬', source: 'Алхимия: «Эликсир силы»' },
        charged_amulet_core: { name: 'Заряженное ядро', icon: '⚡', source: 'Алхимия: «Заряженное ядро амулета»' },
        iron_ore:    { name: 'Железная руда', icon: '🔗', source: 'Экспедиции: режим «Железная руда»' },
        herbs:       { name: 'Целебные травы', icon: '🌿', source: 'Экспедиции: режим «Целебные травы»' },
        hides:       { name: 'Шкуры зверей', icon: '🦌', source: 'Экспедиции: режим «Охота на зверей»' },
        ancient_relics: { name: 'Древние артефакты', icon: '🏺', source: 'Экспедиции: режим «Древние артефакты»' },
        gems:        { name: 'Драгоценные камни', icon: '💍', source: 'Экспедиции: режим «Драгоценные камни»' },
    };

    function resChip(key, qty) {
        const meta = resourceMeta[key] || { name: key.replace('_',' '), icon: '❔', source: 'Источник неизвестен' };
        const title = `${meta.name}: где получить — ${meta.source}`;
        return `<span class="res-chip" data-res="${key}" title="${title}"><span class="res-emoji">${meta.icon}</span><span class="res-name">${meta.name}</span><span class="res-qty">×${qty}</span></span>`;
    }

    // Точечное обновление статуса занятости на карточке без полного ререндера списка
    function updateGirlCardBusyState(girlId, isBusy) {
        const list = ui.containers.girlsList;
        if (!list) return;
        const card = list.querySelector(`.girl-card[data-id="${girlId}"]`);
        if (!card) return;
        card.classList.toggle('busy', !!isBusy);
        let overlay = card.querySelector('.busy-overlay');
        if (isBusy) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'busy-overlay';
                overlay.textContent = 'Занята';
                card.appendChild(overlay);
            }
        } else if (overlay) {
            overlay.remove();
        }
    }

    function updateGirlsBusyState(ids, isBusy) {
        (ids || []).forEach(id => updateGirlCardBusyState(id, isBusy));
    }

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ИГРЫ ---
    const gameState = {
        resources: {
            wood: 50,
            stone: 40,
            planks: 0,
            stone_bricks: 0,
            dry_food: 15,
            food: 0,
            crystals: 2,
            esense: 5,
            magic_dust: 0,
            iron_ore: 0,
            herbs: 0,
            hides: 0,
            ancient_relics: 0,
            gems: 0,
        },
        allGirlsData: [],
        ownedGirls: [],
        activeCrafts: [], // Активные задачи крафта
        pinnedCrafts: [], // Закрепленные циклические задачи: {girlId, recipeId}
        expeditions: [], // {id, girlIds:[], mode:'wood'|'stone'|'auto'|'dry_food', duration, stash:{wood,stone,dry_food}, elapsedMs, paused, nextFoodTick}
        recentResourceEvents: [],
        recentResourceKeys: [],
        lastResourceSnapshot: {},
        equipmentInventory: [], // Глобальный инвентарь экипировки
    };

    // --- СИСТЕМА СОХРАНЕНИЯ ---
    const SAVE_KEY = 'villageHeartsSaveData';

    function saveGame() {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                resources: gameState.resources,
                ownedGirls: gameState.ownedGirls.map(g => ({
                    ID: g.ID,
                    isBusy: g.isBusy,
                    level: g.level,
                    exp: g.exp,
                    skillPoints: g.skillPoints,
                    stats: g.stats,
                    unlockedStats: g.unlockedStats,
                    rank: g.rank,
                    starLevel: g.starLevel,
                    rarity: g.rarity,
                    specialization: g.specialization,
                    rankBonus: g.rankBonus,
                    starRank: g.starRank,
                    passiveBonuses: g.passiveBonuses,
                    equipment: g.equipment || []
                })),
                activeCrafts: gameState.activeCrafts,
                pinnedCrafts: gameState.pinnedCrafts,
                expeditions: gameState.expeditions.map(exp => ({
                    ...exp,
                    // Сохраняем текущее время для корректного восстановления
                    savedAt: Date.now()
                })),
                equipmentInventory: gameState.equipmentInventory || []
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            console.log('Игра сохранена');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    }

    function loadGame() {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (!savedData) return false;

            const data = JSON.parse(savedData);
            
            // Восстанавливаем ресурсы
            if (data.resources) {
                gameState.resources = { ...gameState.resources, ...data.resources };
            }

            // Восстанавливаем девушек
            if (data.ownedGirls && Array.isArray(data.ownedGirls)) {
                gameState.ownedGirls = [];
                data.ownedGirls.forEach(savedGirl => {
                    const original = gameState.allGirlsData.find(g => g.ID === savedGirl.ID);
                    if (original) {
                        const restored = { ...original, ...savedGirl };
                        ensureGirlProgressFields(restored);
                        gameState.ownedGirls.push(restored);
                    }
                });
            }

            // Восстанавливаем активные крафты
            if (data.activeCrafts) {
                gameState.activeCrafts = data.activeCrafts.map(task => {
                    if (task.waiting) return task;
                    // Корректируем время начала с учётом прошедшего времени
                    const elapsed = Date.now() - data.timestamp;
                    return {
                        ...task,
                        startTime: Date.now() - elapsed
                    };
                });
            }

            // Восстанавливаем закреплённые крафты
            if (data.pinnedCrafts) {
                gameState.pinnedCrafts = data.pinnedCrafts;
            }

            // Восстанавливаем экспедиции
            if (data.expeditions && Array.isArray(data.expeditions)) {
                gameState.expeditions = data.expeditions.map(exp => {
                    const timePassed = Date.now() - exp.savedAt;
                    return {
                        ...exp,
                        elapsedMs: Math.min(exp.duration, (exp.elapsedMs || 0) + timePassed),
                        nextFoodTick: Date.now() + 1000 // Следующий тик еды через секунду
                    };
                });
            }

            // Восстанавливаем инвентарь экипировки
            if (data.equipmentInventory && Array.isArray(data.equipmentInventory)) {
                gameState.equipmentInventory = data.equipmentInventory;
            }

            console.log('Игра загружена');
            return true;
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            return false;
        }
    }

    function resetSave() {
        if (confirm('Вы уверены, что хотите сбросить все сохранения? Это действие необратимо!')) {
            localStorage.removeItem(SAVE_KEY);
            location.reload();
        }
    }

    // --- СИСТЕМА ШАНСОВ ВЫПАДЕНИЯ ---
    const dropRates = {
        '3★': 70,  // 70% шанс
        '4★': 25,  // 25% шанс  
        '5★': 4,   // 4% шанс
        '6★': 1    // 1% шанс
    };

    // --- ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ---
    const ui = {
        resources: {
            
        },
        views: {
            village: document.getElementById('village-view'),
            map: document.getElementById('map-view'),
            crafting: document.getElementById('crafting-view'),
        },
        buttons: {
            nav: document.querySelectorAll('.nav-button'),
            summon: document.getElementById('summon-button'),
            modalClose: document.querySelectorAll('.modal-close-button'),
            headerToggle: document.getElementById('toggle-resources'),
        },
        containers: {
            girlsList: document.getElementById('girls-list-container'),
            workshopRecipes: document.getElementById('workshop-recipes'),
            activeTasks: document.getElementById('active-tasks-container'),
            activeTasksCraft: document.getElementById('active-tasks-container-craft'),
            expeditionGirls: document.getElementById('expedition-girls-list'),
            activeExpeditions: document.getElementById('active-expeditions-container'),
            foodExpeditionGirls: document.getElementById('food-expedition-girl-list'),
            scoutPointsRegular: document.getElementById('scout-points-regular-container'),
            scoutPointsEquipment: document.getElementById('scout-points-equipment-container'),
            headerResourceList: document.getElementById('resource-list'),
            headerResourcePanel: document.getElementById('resource-panel'),
            headerBackdrop: document.getElementById('resource-backdrop'),
            recentResources: document.getElementById('recent-resources'),
        },
        modal: {
            overlay: document.getElementById('girl-modal'),
            body: document.getElementById('modal-body'),
        },
        girlSelectionModal: {
            overlay: document.getElementById('girl-selection-modal'),
            body: document.getElementById('girl-selection-body'),
            list: document.getElementById('modal-girl-list'),
        },
        loadingScreen: document.getElementById('loading-screen'),
    };

    // --- ФУНКЦИИ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА ---

    // Собирает множество всех известных ресурсов
    function buildResourcesSet() {
        const set = new Set(Object.keys(gameState.resources || {}));
        Object.keys(resourceMeta).forEach(k => set.add(k));
        Object.keys(recipes || {}).forEach(id => {
            const r = recipes[id];
            if (!r) return;
            Object.keys(r.requires || {}).forEach(k => set.add(k));
            Object.keys(r.produces || {}).forEach(k => set.add(k));
        });
        return Array.from(set);
    }

    // Рендерит верхнюю панель ресурсов
    function renderHeaderResources() {
        const list = ui.containers.headerResourceList;
        if (!list) return;
        const keys = buildResourcesSet();
        list.innerHTML = '';
        keys.forEach(key => {
            const meta = resourceMeta[key] || { name: key.replace('_',' '), icon: '❔', source: 'Источник неизвестен' };
            const value = gameState.resources[key] || 0;
            const item = document.createElement('div');
            item.className = 'resource-item clickable-resource';
            item.setAttribute('title', `${meta.name}: Нажмите, чтобы узнать где добыть`);
            item.dataset.resourceKey = key;
            item.innerHTML = `<span class="res-emoji">${meta.icon}</span><span class="res-name">${meta.name}</span><span id="resource-${key.replace('_','-')}">${value}</span>`;
            item.addEventListener('click', () => {
                showResourceInfo(key);
            });
            list.appendChild(item);
        });
    }
    // рендер последних ресурсов
    function renderRecentResources() {
        const container = ui.containers.recentResources;
        if (!container) return;
        const keys = gameState.recentResourceKeys || [];
        container.innerHTML = '';
        keys.forEach(key => {
            const meta = resourceMeta[key] || { name: key.replace('_',' '), icon: '❔', source: '' };
            const value = (gameState.resources || {})[key] ?? 0;
            const item = document.createElement('div');
            item.className = 'resource-item';
            item.setAttribute('title', `${meta.name}: ${meta.source || ''}`.trim());
            item.innerHTML = `<span class="res-emoji">${meta.icon}</span><span>${value}</span>`;
            container.appendChild(item);
        });
    }

    // Обновляет отображение ресурсов
    function updateResourcesUI() {
        let missing = false;
        const current = gameState.resources || {};
        const snap = gameState.lastResourceSnapshot || {};
        const hasSnapshot = Object.keys(snap).length > 0;
        if (!hasSnapshot) {
            gameState.lastResourceSnapshot = { ...current };
        } else {
            for (const k in current) {
                const before = snap[k] ?? 0;
                const after = current[k] ?? 0;
                const delta = after - before;
                if (delta > 0) {
                    const arr = gameState.recentResourceKeys || [];
                    const idx = arr.indexOf(k);
                    if (idx !== -1) arr.splice(idx, 1);
                    arr.unshift(k);
                    if (arr.length > 3) arr.pop();
                    gameState.recentResourceKeys = arr;
                }
            }
            gameState.lastResourceSnapshot = { ...current };
        }

        for (const resource in current) {
            const element = document.getElementById(`resource-${resource.replace('_', '-')}`);
            if (element) {
                element.textContent = current[resource];
            } else {
                missing = true;
            }
        }
        if (missing) {
            renderHeaderResources();
        }

        renderRecentResources();

        ui.buttons.summon.disabled = current.crystals < 1;
        if (ui.views.crafting.classList.contains('active-view')) {
            renderRecipes();
        }
    }

    function ensureGirlProgressFields(g) {
        if (typeof g.level !== 'number') g.level = 0;
        if (typeof g.exp !== 'number') g.exp = 0;
        if (typeof g.skillPoints !== 'number') g.skillPoints = 0;
    }

    function expToNext(level) {
        const early = [5, 7, 9, 10, 12];
        if (level >= 0 && level < early.length) return early[level];
        return Math.round(50 * Math.pow(1.3, level - early.length));
    }

    function addExperience(girl, amount) {
        ensureGirlProgressFields(girl);
        const beforeLevel = girl.level || 0;
        girl.exp += Math.max(0, Math.floor(amount));
        while (girl.exp >= expToNext(girl.level)) {
            girl.exp -= expToNext(girl.level);
            girl.skillPoints += 1; // 1 очко за уровень
            girl.level += 1;
        }
        if (girl.level !== beforeLevel) {
            updateGirlCardProgress(girl.ID);
        }
    }

    function updateGirlCardProgress(girlId) {
        const girl = gameState.ownedGirls.find(g => g.ID === girlId) || gameState.allGirlsData.find(g => g.ID === girlId);
        if (!girl) return;
        ensureGirlProgressFields(girl);
        const list = ui.containers.girlsList;
        if (!list) return;
        const card = list.querySelector(`.girl-card[data-id="${girlId}"]`);
        if (!card) return;
        const levelEl = card.querySelector('.level');
        if (levelEl) levelEl.textContent = `Lv ${girl.level || 0}`;
        let ptsEl = card.querySelector('.skill-points');
        if ((girl.skillPoints || 0) > 0) {
            if (!ptsEl) {
                ptsEl = document.createElement('div');
                ptsEl.className = 'skill-points';
                card.appendChild(ptsEl);
            }
            ptsEl.textContent = `Очки: ${girl.skillPoints}`;
        } else if (ptsEl) {
            ptsEl.remove();
        }
        let btn = card.querySelector('.skill-up-btn');
        if (girl.skillPoints > 0) {
            if (!btn) {
                btn = document.createElement('button');
                btn.className = 'task-btn skill-up-btn';
                btn.textContent = 'Прокачать';
                card.appendChild(btn);
            }
            btn.disabled = false;
        } else if (btn) {
            // если очков нет — убираем кнопку
            btn.remove();
        }
    }

    function getAvatarIndex(g) {
        const m = String(g?.ID || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
    }

    function getAvatarCandidates(g) {
        const idx = getAvatarIndex(g);
        const z2 = String(idx).padStart(2, '0');
        const z3 = String(idx).padStart(3, '0');
        return [
            //`avatars/${idx}.png`,
            `avatars/${idx}.jpg`,
            
        ];
    }

    function getAvatarUrl(g) {
        const list = getAvatarCandidates(g);
        return list[0];
    }

    function nextAvatarSrc(img) {
        try {
            const list = JSON.parse(img.getAttribute('data-candidates'));
            let i = parseInt(img.getAttribute('data-idx') || '0', 10);
            i += 1;
            if (i < list.length) {
                img.setAttribute('data-idx', String(i));
                img.src = list[i];
            } else {
                img.onerror = null;
                img.src = 'data:image/svg+xml;utf8,' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
                    '<rect width="100%" height="100%" fill="%232c3e50"/>' +
                    '<text x="50%" y="50%" fill="%2399a" dominant-baseline="middle" text-anchor="middle" font-size="12">' +
                    'No img✨' +
                    '</text>' +
                    '</svg>';
            }
        } catch (e) {
            img.onerror = null;
        }
    }

    window.__nextAvatarSrc = nextAvatarSrc;

    // Рендерит карточки девушек, добавляя индикатор занятости
    function renderOwnedGirls() {
        ui.containers.girlsList.innerHTML = '';
        if (gameState.ownedGirls.length === 0) {
            ui.containers.girlsList.innerHTML = `<p>У вас пока нет девушек. Используйте "Зов Сердца"!</p>`;
            return;
        }

        gameState.ownedGirls.forEach(girl => {
            Leveling.ensureLevelingFields(girl);
            const spec = girl.specialization || 'none';
            const specIcons = {
                'none': '',
                'gatherer': '🌾',
                'crafter': '⚒️',
                'alchemist': '🧪',
                'warrior': '⚔️',
                'support': '💝'
            };
            
            const card = document.createElement('div');
            card.className = 'girl-card';
            card.dataset.id = girl.ID;
            card.dataset.rarity = girl.rarity;
            if (girl.isBusy) {
                card.classList.add('busy');
            }
            const candidates = JSON.stringify(getAvatarCandidates(girl)).replace(/'/g, "&apos;");
            card.innerHTML = `
                <div class="avatar"><img class="avatar-img" src="${getAvatarUrl(girl)}" data-candidates='${candidates}' data-idx="0" onerror="window.__nextAvatarSrc && window.__nextAvatarSrc(this)" alt="${girl.name}"></div>
                <div class="rarity">${girl.rarity}</div>
                <div class="name">${girl.name}</div>
                <div class="profession">${girl.profession}</div>
                ${spec !== 'none' ? `<div class="card-specialization">${specIcons[spec]}</div>` : ''}
                <div class="level">Lv ${girl.level || 0}</div>
                ${girl.isBusy ? '<div class="busy-overlay">Занята</div>' : ''}
            `;
            ui.containers.girlsList.appendChild(card);
            // после вставки дорисуем очки и кнопку прокачки (если есть)
            updateGirlCardProgress(girl.ID);
        });
    }

    // Рендер списка свободных девушек для экспедиции (карта)
    function renderExpeditionGirls() {
        if (!ui.containers.expeditionGirls) return;
        const freeGirls = gameState.ownedGirls.filter(g => !g.isBusy);
        ui.containers.expeditionGirls.innerHTML = '';
        if (freeGirls.length === 0) {
            ui.containers.expeditionGirls.innerHTML = '<p>Нет свободных девушек</p>';
            return;
        }
        freeGirls.forEach(g => {
            const el = document.createElement('div');
            el.className = 'exp-girl-chip';
            el.dataset.girlId = g.ID;
            const candidates = JSON.stringify(getAvatarCandidates(g)).replace(/'/g, "&apos;");
            el.innerHTML = `
                <span class="avatar-circle">
                    <img class="avatar-circle-img" src="${getAvatarUrl(g)}" data-candidates='${candidates}' data-idx="0" onerror="window.__nextAvatarSrc && window.__nextAvatarSrc(this)" alt="${g.name}">
                </span>
                <span class="chip-text">${g.name} <span class="chip-prof">(${g.profession})</span></span>
            `;
            ui.containers.expeditionGirls.appendChild(el);
        });
    }

    function computeExpeditionFoodCost(selectedCount, mode, durationMs) {
        if (!selectedCount) return 0;
        const m = (expConfig?.modes || {})[mode] || {};
        const consumption = expConfig?.consumption || {};
        const isFoodSearch = mode === 'dry_food';
        if (isFoodSearch) return 0;
        const upfront = Number(m.upfrontFoodPerGirl || 0);
        const consTickMs = Number(consumption.consumptionTickMs || 30000);
        const consPerGirl = Number(consumption.foodPerGirlPerConsumption || 0);
        const dur = Number(durationMs || 60000);
        const ticks = consTickMs > 0 ? Math.floor(dur / consTickMs) : 0;
        return selectedCount * (upfront + ticks * consPerGirl);
    }

    function updateExpeditionButtonLabel() {
        const startBtn = document.getElementById('start-expedition');
        if (!startBtn) return;
        const modeSel = document.getElementById('expedition-resource');
        const durSel = document.getElementById('expedition-duration');
        const distSel = document.getElementById('expedition-distance');
        const mode = modeSel ? modeSel.value : 'auto';
        const duration = durSel ? parseInt(durSel.value, 10) : 60000;
        const distance = distSel ? distSel.value : 'medium';
        const selectedChips = ui.containers.expeditionGirls ? Array.from(ui.containers.expeditionGirls.querySelectorAll('.exp-girl-chip.selected')) : [];
        const count = selectedChips.length;
        
        // Учитываем дальность в расчете еды
        const distConfig = (expConfig?.distances || {})[distance] || { foodCostMultiplier: 1.0, travelTimeMs: 0 };
        const need = Math.ceil(computeExpeditionFoodCost(count, mode, duration) * distConfig.foodCostMultiplier);
        const totalTime = ((duration + distConfig.travelTimeMs * 2) / 1000).toFixed(0);
        
        startBtn.textContent = need > 0 ? `Отправить (⏱️${totalTime}с 🍲${need})` : `Отправить (⏱️${totalTime}с)`;
        if (need > 0) {
            startBtn.disabled = (gameState.resources.food || 0) < need;
        } else {
            startBtn.disabled = false;
        }
    }

    // Запуск точки разведки
    function startScoutPoint(pointId, providedGirlIds) {
        const point = expConfig?.scoutPoints?.[pointId];
        if (!point) return;
        
        const freeGirls = gameState.ownedGirls.filter(g => !g.isBusy);
        
        // Проверки
        if (!Array.isArray(providedGirlIds) && freeGirls.length < point.minGirls) {
            showCustomAlert(`Недостаточно свободных девушек. Нужно минимум ${point.minGirls}.`);
            return;
        }
        
        // Проверка ресурсов
        for (const [res, need] of Object.entries(point.requiredResources || {})) {
            if ((gameState.resources[res] || 0) < need) {
                const meta = resourceMeta[res] || { name: res };
                showCustomAlert(`Недостаточно ресурсов: ${meta.name} (нужно ${need})`);
                return;
            }
        }
        
        // Список выбранных девушек
        let girlIds = Array.isArray(providedGirlIds) ? providedGirlIds.slice() : [];
        
        if (!Array.isArray(providedGirlIds)) {
            // Старое поведение: авто-подбор при прямом запуске (сохраним как fallback)
            const reqProfs = point.requiredProfessions || [];
            const selectedGirls = [];
            for (const prof of reqProfs) {
                const girl = freeGirls.find(g => (g.profession || '').toLowerCase().includes(prof) && !selectedGirls.includes(g));
                if (girl) selectedGirls.push(girl);
            }
            while (selectedGirls.length < point.minGirls && freeGirls.length > selectedGirls.length) {
                const girl = freeGirls.find(g => !selectedGirls.includes(g));
                if (girl) selectedGirls.push(girl);
            }
            girlIds = selectedGirls.map(g => g.ID);
        }
        
        // Валидация выбора: минимум и профессии
        const chosenGirls = girlIds.map(id => gameState.ownedGirls.find(g => g.ID === id)).filter(Boolean);
        if (chosenGirls.length < point.minGirls) {
            showCustomAlert(`Выберите минимум ${point.minGirls} девушек для разведки.`);
            return;
        }
        const reqProfs = point.requiredProfessions || [];
        for (const prof of reqProfs) {
            if (!chosenGirls.some(g => (g.profession || '').toLowerCase().includes(prof))) {
                showCustomAlert(`В отряде должна быть профессия, содержащая: ${prof}`);
                return;
            }
        }
        
        // Списание ресурсов
        for (const [res, need] of Object.entries(point.requiredResources || {})) {
            gameState.resources[res] -= need;
        }
        updateResourcesUI();
        
        // Пометить девушек занятыми
        girlIds.forEach(id => {
            const g = gameState.ownedGirls.find(x => x.ID === id);
            if (g) g.isBusy = true;
        });
        
        // Создать экспедицию-разведку
        const now = Date.now();
        const totalDuration = point.travelTimeMs * 2 + point.gatherDuration;
        const exp = {
            id: 'scout_' + Date.now() + Math.random(),
            girlIds: [...girlIds],
            mode: 'scout',
            scoutPoint: pointId,
            duration: totalDuration,
            gatherDuration: point.gatherDuration,
            travelTime: point.travelTimeMs,
            rewards: point.rewards,
            stash: {},
            elapsedMs: 0,
            phase: 'travel_to',
            phaseStartMs: now,
            paused: false,
            nextFoodTick: now + (expConfig?.consumption?.consumptionTickMs || 30000),
            contributions: {},
        };
        gameState.expeditions.push(exp);
        
        updateGirlsBusyState(girlIds, true);
        renderExpeditionGirls();
        renderFoodExpeditionGirls();
        renderActiveExpeditions();
        renderScoutPoints();
        saveGame();
        
        showCustomAlert(`Отряд отправлен в ${point.name}!`);
    }
    
    // Рендер точек разведки
    function renderScoutPoints() {
        const contReg = ui.containers.scoutPointsRegular;
        const contEq = ui.containers.scoutPointsEquipment;
        if ((!contReg && !contEq) || !expConfig?.scoutPoints) return;
        if (contReg) contReg.innerHTML = '';
        if (contEq) contEq.innerHTML = '';
        
        Object.entries(expConfig.scoutPoints).forEach(([pointId, point]) => {
            const freeGirls = gameState.ownedGirls.filter(g => !g.isBusy);
            const hasEnoughGirls = freeGirls.length >= point.minGirls;
            
            // Проверка ресурсов
            const resourcesOk = Object.entries(point.requiredResources || {}).every(([res, need]) => 
                (gameState.resources[res] || 0) >= need
            );
            
            // Проверка профессий
            const reqProfs = point.requiredProfessions || [];
            const hasProfs = reqProfs.every(prof => 
                freeGirls.some(g => (g.profession || '').toLowerCase().includes(prof))
            );
            
            const canStart = hasEnoughGirls && resourcesOk && hasProfs;
            
            const card = document.createElement('div');
            card.className = `scout-point-card ${canStart ? '' : 'disabled'}`;
            card.dataset.pointId = pointId;
            card.dataset.scoutId = pointId;
            
            // Применяем индивидуальный фон для каждой точки
            if (point.backgroundImage) {
                card.style.backgroundImage = `url('${point.backgroundImage}')`;
            }
            
            let reqResHTML = '';
            Object.entries(point.requiredResources || {}).forEach(([res, need]) => {
                const has = gameState.resources[res] || 0;
                const ok = has >= need;
                const meta = resourceMeta[res] || { icon: '❔', name: res };
                reqResHTML += `<div class="scout-req-item ${ok ? 'satisfied' : 'lacking'}">${ok ? '✓' : '✗'} ${meta.icon} ${need} ${meta.name}</div>`;
            });
            
            let rewardsHTML = '';
            Object.entries(point.rewards || {}).forEach(([res, range]) => {
                const meta = resourceMeta[res] || { icon: '❔', name: res };
                rewardsHTML += `${meta.icon} ${range.min}-${range.max} ${meta.name} `;
            });
            
            const totalTime = ((point.travelTimeMs * 2 + point.gatherDuration) / 1000).toFixed(0);
            
            card.innerHTML = `
                <h4>${point.name}</h4>
                <div class="scout-point-description">${point.description}</div>
                <div class="scout-point-requirements">
                    <div class="scout-req-item ${hasEnoughGirls ? 'satisfied' : 'lacking'}">${hasEnoughGirls ? '✓' : '✗'} Минимум ${point.minGirls} девушек</div>
                    <div class="scout-req-item ${hasProfs ? 'satisfied' : 'lacking'}">${hasProfs ? '✓' : '✗'} Нужны: ${reqProfs.join(', ')}</div>
                    ${reqResHTML}
                </div>
                <div class="scout-point-rewards">
                    <strong>Награды:</strong> ${rewardsHTML}
                </div>
                <div class="scout-point-stats">
                    <span>⏱️ ${totalTime}с</span>
                    <span>👥 ${point.minGirls}+</span>
                </div>
                <div class="scout-point-actions">
                    <button class="action-button start-scout-btn" ${canStart ? '' : 'disabled'}>Выбрать девушек</button>
                </div>
            `;
            
            const target = point.isEquipmentExpedition ? contEq : contReg;
            if (target) target.appendChild(card);
        });
    }

    // Открывает модалку выбора девушек для точки разведки
    function openScoutSelection(pointId) {
        const point = expConfig?.scoutPoints?.[pointId];
        if (!point) return;
        const overlay = ui.girlSelectionModal.overlay;
        const body = ui.girlSelectionModal.body;
        const list = ui.girlSelectionModal.list;
        if (!overlay || !body || !list) return;

        // Очистка списка, заголовка и старых выделений
        list.innerHTML = '';
        body.querySelectorAll('.exp-girl-chip.selected').forEach(chip => chip.classList.remove('selected'));
        const header = body.querySelector('h3');
        if (header) header.textContent = `${point.name}\nВыберите девушек`;

        // Выводим свободных девушек
        const freeGirls = gameState.ownedGirls.filter(g => !g.isBusy);
        if (freeGirls.length === 0) {
            list.innerHTML = '<p style="opacity:0.7;">Нет свободных девушек</p>';
        } else {
            freeGirls.forEach(g => {
                const el = document.createElement('div');
                el.className = 'exp-girl-chip';
                el.dataset.girlId = g.ID;
                const candidates = JSON.stringify(getAvatarCandidates(g)).replace(/'/g, "&apos;");
                el.innerHTML = `
                    <span class="avatar-circle">
                        <img class="avatar-circle-img" src="${getAvatarUrl(g)}" data-candidates='${candidates}' data-idx="0" onerror="window.__nextAvatarSrc && window.__nextAvatarSrc(this)" alt="${g.name}">
                    </span>
                    <span class="chip-text">${g.name} <span class="chip-prof">(${g.profession})</span></span>
                `;
                list.appendChild(el);
            });
        }

        // Делегирование выбора
        const onClickList = (e) => {
            const chip = e.target.closest('.exp-girl-chip');
            if (!chip) return;
            chip.classList.toggle('selected');
        };
        // Сбрасываем возможные старые обработчики, навешанные ранее
        list.replaceWith(list.cloneNode(true));
        const newList = body.querySelector('#modal-girl-list');
        newList.addEventListener('click', onClickList);
        // Обновляем ссылку в ui, чтобы другие функции использовали актуальный элемент
        ui.girlSelectionModal.list = newList;

        // Кнопка подтверждения
        let confirm = body.querySelector('.confirm-scout-start');
        if (!confirm) {
            confirm = document.createElement('button');
            confirm.className = 'action-button confirm-scout-start';
            confirm.textContent = 'Начать разведку';
            body.appendChild(confirm);
        }
        confirm.onclick = () => {
            const selected = Array.from(body.querySelectorAll('.exp-girl-chip.selected')).map(ch => ch.dataset.girlId);
            if (selected.length < point.minGirls) {
                showCustomAlert(`Выберите минимум ${point.minGirls} девушек`);
                return;
            }
            // Проверка профессий
            const reqProfs = point.requiredProfessions || [];
            const chosenGirls = selected.map(id => gameState.ownedGirls.find(g => g.ID === id)).filter(Boolean);
            for (const prof of reqProfs) {
                if (!chosenGirls.some(g => (g.profession || '').toLowerCase().includes(prof))) {
                    showCustomAlert(`В отряде должна быть профессия, содержащая: ${prof}`);
                    return;
                }
            }
            overlay.classList.add('hidden');
            startScoutPoint(pointId, selected);
        };

        overlay.classList.remove('hidden');
    }
    
    // Рендер списка свободных девушек для "Поиск еды"
    function renderFoodExpeditionGirls() {
        if (!ui.containers.foodExpeditionGirls) return;
        // Только подходящие профессии: собирательница, рыбак, охотник
        const isEligible = (prof) => {
            const p = (prof || '').toLowerCase();
            return p.includes('собира') || p.includes('рыбак') || p.includes('охот');
        };
        const freeGirls = gameState.ownedGirls.filter(g => !g.isBusy && isEligible(g.profession));
        ui.containers.foodExpeditionGirls.innerHTML = '';
        if (freeGirls.length === 0) {
            ui.containers.foodExpeditionGirls.innerHTML = '<p>Нет свободных девушек</p>';
            return;
        }
        freeGirls.forEach(g => {
            const el = document.createElement('div');
            el.className = 'exp-girl-chip';
            el.dataset.girlId = g.ID;
            const candidates = JSON.stringify(getAvatarCandidates(g)).replace(/'/g, "&apos;");
            el.innerHTML = `
                <span class="avatar-circle">
                    <img class="avatar-circle-img" src="${getAvatarUrl(g)}" data-candidates='${candidates}' data-idx="0" onerror="window.__nextAvatarSrc && window.__nextAvatarSrc(this)" alt="${g.name}">
                </span>
                <span class="chip-text">${g.name} <span class="chip-prof">(${g.profession})</span></span>
            `;
            ui.containers.foodExpeditionGirls.appendChild(el);
        });
    }

    // Вспомогательное: гарантирует стабильные под-контейнеры для крафта и экспедиций в activeTasks
    function ensureActiveTaskGroups() {
        const host = ui.containers.activeTasks;
        if (!host) return { crafts: null, exps: null };
        let crafts = host.querySelector('.tasks-group.crafts');
        let exps = host.querySelector('.tasks-group.exps');
        if (!crafts) {
            crafts = document.createElement('div');
            crafts.className = 'tasks-group crafts';
        }
        if (!exps) {
            exps = document.createElement('div');
            exps.className = 'tasks-group exps';
        }
        // Гарантируем порядок: сначала crafts, потом exps
        if (crafts.parentElement !== host || crafts.nextElementSibling !== exps) {
            host.innerHTML = '';
            host.appendChild(crafts);
            host.appendChild(exps);
        }
        return { crafts, exps };
    }

    // Рендер активных экспедиций
    function renderActiveExpeditions() {
        const targets = [];
        if (ui.containers.activeExpeditions) targets.push(ui.containers.activeExpeditions);
        const groups = ensureActiveTaskGroups();
        if (groups.exps) targets.push(groups.exps);

        targets.forEach(t => { if (t) t.querySelectorAll('.expedition-task-card').forEach(el => el.remove()); });
        if (gameState.expeditions.length === 0) return;
        const fragHTML = gameState.expeditions.map(exp => {
            const progress = Math.min(100, (exp.elapsedMs / exp.duration) * 100);
            const girls = exp.girlIds.map(id => gameState.ownedGirls.find(g => g.ID === id)?.name || '—');
            const mconf = (expConfig?.modes || {})[exp.mode] || {};
            const resLabel = mconf.name || (exp.mode || '—');
            const repeatLabel = (exp.repeatCount && exp.repeatCount > 0) ? `×${exp.repeatCount}` : 'ВЫКЛ';
            const autoOn = exp.auto ? 'on' : 'off';
            // Человекочитаемый статус фазы: путь к точке / сбор / возвращение
            const phaseMap = { travel_to: 'В пути к точке', gathering: 'Сбор ресурсов', travel_back: 'Возвращение' };
            const phaseLabel = phaseMap[exp.phase] || 'Выполняется';
            // Формируем строку склада, показывая только непустые ресурсы
            const stashItems = [];
            const stashMap = {
                wood: '🌲', stone: '⛰️', dry_food: '🥫', esense: '✨',
                iron_ore: '⚒️', herbs: '🌿', hides: '🦌', ancient_relics: '🏺', gems: '💍'
            };
            Object.entries(exp.stash || {}).forEach(([key, val]) => {
                if (val > 0 && stashMap[key]) stashItems.push(`${stashMap[key]} ${val}`);
            });
            const stashDisplay = stashItems.length > 0 ? stashItems.join(' ') : 'Пусто';
            return `
                <div class="active-task-card expedition-task-card" data-exp-id="${exp.id}">
                    <div class="task-info">
                        <strong>Экспедиция: ${resLabel}</strong>
                        <span>Участники: ${girls.join(', ')}</span>
                        <span class="exp-phase">Статус: ${phaseLabel}</span>
                    </div>
                    <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.toFixed(0)}">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                        <span class="progress-label">${progress.toFixed(0)}%</span>
                    </div>
                    <div class="task-controls">
                        <span>Склад: ${stashDisplay}</span>
                        ${exp.paused ? '<span class="waiting-label">Пауза: нет еды</span>' : ''}
                        <div class="waiting-actions">
                            <button class="task-btn exp-auto-toggle ${autoOn}">Авто: ${exp.auto ? 'ВКЛ' : 'ВЫКЛ'}</button>
                            <button class="task-btn exp-repeat">Повтор: ${repeatLabel}</button>
                            ${(() => { try {
                                // Кнопка продолжения доступна только для режимов, где расходуется еда
                                if (!exp.paused) return '';
                                if (exp.mode === 'dry_food' || exp.mode === 'scout') return '';
                                const consumption = expConfig?.consumption || {};
                                const consPerGirl = Number(consumption.foodPerGirlPerConsumption || 0);
                                const foodCost = (exp.girlIds?.length || 0) * consPerGirl;
                                if (foodCost <= 0) return '';
                                const have = (gameState.resources.food || 0);
                                return have >= foodCost ? '<button class="task-btn exp-continue">Продолжить</button>' : '';
                            } catch(e){ return '';} })()}
                            ${exp.phase === 'travel_back' ? '' : '<button class="task-btn exp-finish-now">Завершить</button>'}
                        </div>
                    </div>
                </div>`;
        }).join('');
        targets.forEach(t => { if (t) t.insertAdjacentHTML('beforeend', fragHTML); });
    }

    // Рендерит рецепты
    function renderRecipes() {
        const searchQuery = (document.getElementById('recipe-search')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('recipe-category')?.value || 'all';
        const typeFilter = document.getElementById('recipe-type')?.value || 'all';
        const sortBy = document.getElementById('recipe-sort')?.value || 'name';

        // Фильтрация
        let recipesArray = Object.entries(recipes).map(([id, recipe]) => ({ id, ...recipe }))
            .filter(recipe => {
                const matchesSearch = !searchQuery || recipe.name.toLowerCase().includes(searchQuery);
                const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
                const matchesType = typeFilter === 'all' || recipe.type === typeFilter;
                return matchesSearch && matchesCategory && matchesType;
            });

        // Сортировка
        recipesArray.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'tier') return (a.tier || 0) - (b.tier || 0);
            if (sortBy === 'time') return a.baseTime - b.baseTime;
            if (sortBy === 'available') {
                const canCraftA = Object.entries(a.requires).every(([res, need]) => (gameState.resources[res] || 0) >= need);
                const canCraftB = Object.entries(b.requires).every(([res, need]) => (gameState.resources[res] || 0) >= need);
                return canCraftB - canCraftA;
            }
            return 0;
        });

        ui.containers.workshopRecipes.innerHTML = '';
        
        recipesArray.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.dataset.recipeId = recipe.id;
            if (recipe.category) card.dataset.category = recipe.category;

            let requirementsHTML = '';
            let canCraft = true;
            for (const res in recipe.requires) {
                const has = gameState.resources[res] || 0;
                const needed = recipe.requires[res];
                const hasEnough = has >= needed;
                if (!hasEnough) canCraft = false;
                const chip = resChip(res, needed);
                requirementsHTML += `<span class="res-item ${hasEnough ? '' : 'lacking'}">${chip}</span>`;
            }

            if (!canCraft) card.classList.add('disabled');
            
            let producesHTML = '';
            for (const res in recipe.produces) {
                producesHTML += `<span class="res-item">${resChip(res, recipe.produces[res])}</span>`;
            }

            const typeBadge = recipe.type === 'alchemy' ? '<span class="rarity-badge rarity-4" style="margin-left:6px;">Алхимия</span>' : '';
            const tierBadge = recipe.tier ? `<span class="rarity-badge rarity-${Math.min(6, recipe.tier + 2)}" style="margin-left:6px;">T${recipe.tier}</span>` : '';

            card.innerHTML = `
                <h4>${recipe.name} ${typeBadge}${tierBadge}</h4>
                <div class="recipe-details">
                    <div class="recipe-row"><span class="recipe-label">Нужно</span><div class="res-list">${requirementsHTML || '—'}</div></div>
                    <div class="recipe-row"><span class="recipe-label">Создаст</span><div class="res-list">${producesHTML || '—'}</div></div>
                    <div class="recipe-row"><span class="recipe-label">Время</span><div class="recipe-time-val">${(recipe.baseTime / 1000).toFixed(0)}с</div></div>
                </div>
                <button class="craft-button" ${canCraft ? '' : 'disabled'}>Крафт</button>
            `;
            ui.containers.workshopRecipes.appendChild(card);
        });
    }

    // Рендерит активные задачи крафта
    function renderActiveCrafts() {
        const groups = ensureActiveTaskGroups();
        const containers = [groups.crafts, ui.containers.activeTasksCraft].filter(Boolean);
        // Удаляем только карточки крафта, не трогая экспедиции
        containers.forEach(c => {
            if (!c) return;
            c.querySelectorAll('.active-task-card:not(.expedition-task-card)').forEach(el => el.remove());
        });

        const hasCrafts = gameState.activeCrafts.length > 0;
        const hasExps = (gameState.expeditions || []).length > 0;
        // Контейнер activeTasks скрываем только если нет ни крафта, ни экспедиций
        if (ui.containers.activeTasks) {
            ui.containers.activeTasks.style.display = (hasCrafts || hasExps) ? 'flex' : 'none';
        }
        if (!hasCrafts) {
            // Нет крафта — добавлять нечего
            return;
        }

        const fragmentHTML = gameState.activeCrafts.map(task => {
            const girl = gameState.ownedGirls.find(g => g.ID === task.girlId) || { name: '—' };
            const recipe = recipes[task.recipeId];
            const elapsed = task.waiting ? 0 : (Date.now() - task.startTime);
            const progress = task.waiting ? 0 : Math.min(100, (elapsed / task.duration) * 100);
            const isPinned = !!gameState.pinnedCrafts.find(p => p.girlId === task.girlId && p.recipeId === task.recipeId);
            return `
                <div class="active-task-card" data-task-id="${task.id}">
                    <div class="task-info">
                        <strong>${recipe.name}</strong>
                        <span>Исполнитель: ${girl.name}</span>
                    </div>
                    <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.toFixed(0)}">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                        <span class="progress-label">${progress.toFixed(0)}%</span>
                    </div>
                    <div class="task-controls">
                        <button class="task-btn auto-toggle ${isPinned ? 'on' : 'off'}">Авто: ${isPinned ? 'ВКЛ' : 'ВЫКЛ'}</button>
                        ${task.waiting ? `
                            <span class="waiting-label">Ожидание ресурсов</span>
                            <div class="waiting-actions">
                                <button class="task-btn continue-wait">Продолжить</button>
                                <button class="task-btn remove-wait">Снять</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        containers.forEach(c => {
            if (!c) return;
            c.style.display = 'flex';
            c.insertAdjacentHTML('beforeend', fragmentHTML);
        });
    }

    // Показывает детальную информацию о девушке в модальном окне
    function showGirlDetails(girlId) {
        const girl = gameState.allGirlsData.find(g => g.ID === girlId);
        const owned = gameState.ownedGirls.find(g => g.ID === girlId);
        
        if (!girl) return;
        
        if (owned) {
            Leveling.ensureLevelingFields(owned);
        }
        
        const statInfo = Leveling.getStatInfo();
        let statsHTML = '';
        const displayStats = owned ? owned.stats : girl.stats;
        for (const [stat, value] of Object.entries(displayStats)) {
            const info = statInfo[stat] || { icon: '❔', name: stat.replace('_', ' ') };
            statsHTML += `<div class="modal-stats-item"><span>${info.icon} ${info.name}:</span> <span>${value}</span></div>`;
        }
        
        let rarityColor = '#95a5a6';
        if (girl.rarity === '4★') rarityColor = '#3498db';
        else if (girl.rarity === '5★') rarityColor = '#9b59b6';
        else if (girl.rarity === '6★') rarityColor = '#f39c12';

        const level = (owned && typeof owned.level === 'number') ? owned.level : 0;
        const exp = (owned && typeof owned.exp === 'number') ? owned.exp : 0;
        const skillPts = (owned && typeof owned.skillPoints === 'number') ? owned.skillPoints : 0;
        const next = expToNext(level);
        
        // Специализация
        const spec = owned ? (owned.specialization || 'none') : 'none';
        const specNames = {
            'none': '',
            'gatherer': '🌾 Собиратель',
            'crafter': '⚒️ Мастер',
            'alchemist': '🧪 Алхимик',
            'warrior': '⚔️ Воин',
            'support': '💝 Поддержка'
        };
        
        // Пассивные бонусы
        let passiveBonusesHTML = '';
        if (owned && owned.passiveBonuses) {
            const bonuses = owned.passiveBonuses;
            const bonusItems = [];
            
            if (bonuses.critChance && bonuses.critChance > 0) {
                bonusItems.push(`<div class="bonus-item">🎯 Крит шанс: <strong>${bonuses.critChance.toFixed(1)}%</strong></div>`);
            }
            if (bonuses.foodCostReduction && bonuses.foodCostReduction > 0) {
                bonusItems.push(`<div class="bonus-item">🍲 Экономия еды: <strong>-${bonuses.foodCostReduction.toFixed(1)}%</strong></div>`);
            }
            if (bonuses.damageReduction && bonuses.damageReduction > 0) {
                bonusItems.push(`<div class="bonus-item">🛡️ Снижение урона: <strong>-${bonuses.damageReduction.toFixed(1)}%</strong></div>`);
            }
            if (bonuses.foodBonus && bonuses.foodBonus > 0) {
                bonusItems.push(`<div class="bonus-item">👨‍🍳 Бонус к еде: <strong>+${bonuses.foodBonus.toFixed(0)}%</strong></div>`);
            }
            if (bonuses.bonusResourceChance && bonuses.bonusResourceChance > 0) {
                bonusItems.push(`<div class="bonus-item">💰 Шанс бонусов: <strong>${bonuses.bonusResourceChance.toFixed(1)}%</strong></div>`);
            }
            
            if (bonusItems.length > 0) {
                passiveBonusesHTML = `
                    <div class="modal-passive-bonuses">
                        <h4>✨ Пассивные бонусы</h4>
                        <div class="passive-bonuses-grid">
                            ${bonusItems.join('')}
                        </div>
                    </div>
                `;
            }
        }

        // Экипировка
        let equipmentHTML = '';
        if (owned) {
            const equippedItems = owned.equipment || [];
            const equipCount = equippedItems.length;
            const maxSlots = 3;
            
            if (equipCount > 0) {
                equipmentHTML = `
                    <div class="modal-equipment">
                        <h4>⚔️ Экипировка (${equipCount}/${maxSlots})</h4>
                        <div class="equipment-slots">
                            ${equippedItems.map(eq => {
                                const rarityInfo = Equipment.RARITY_LEVELS[eq.rarity];
                                const typeInfo = Equipment.EQUIPMENT_TYPES[eq.type];
                                return `
                                    <div class="equipment-item" style="border-color: ${rarityInfo.color};">
                                        <span class="eq-icon">${typeInfo.icon}</span>
                                        <div class="eq-info">
                                            <div class="eq-name" style="color: ${rarityInfo.color};">${eq.name}</div>
                                            <div class="eq-details">${rarityInfo.name} ${eq.stars ? '⭐'.repeat(eq.stars) : ''}</div>
                                        </div>
                                        <button class="unequip-btn" data-eq-id="${eq.id}" title="Снять">✖</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <button class="action-button manage-equipment-btn" style="margin-top:10px;">Управление экипировкой</button>
                    </div>
                `;
            } else {
                equipmentHTML = `
                    <div class="modal-equipment">
                        <h4>⚔️ Экипировка (0/${maxSlots})</h4>
                        <p style="opacity:0.7; font-size:0.9em;">Нет надетой экипировки</p>
                        <button class="action-button manage-equipment-btn" style="margin-top:10px;">Управление экипировкой</button>
                    </div>
                `;
            }
        }

        const modalCandidates = JSON.stringify(getAvatarCandidates(girl)).replace(/'/g, "&apos;");
        ui.modal.currentGirlId = girlId;
        ui.modal.body.innerHTML = `
            <div style="text-align:center; margin-bottom: 12px;">
                <h3 style="margin:0 0 8px 0;">${girl.name} <span style="color: ${rarityColor}; text-shadow: 0 0 10px ${rarityColor}40;">${girl.rarity}</span></h3>
                ${spec !== 'none' ? `<div class="specialization-badge" style="margin-bottom:8px;">${specNames[spec]}</div>` : ''}
                <img style="width:250px; height:270px; border-radius:8px; object-fit:cover;" src="${getAvatarUrl(girl)}" data-candidates='${modalCandidates}' data-idx="0" onerror="window.__nextAvatarSrc && window.__nextAvatarSrc(this)" alt="${girl.name}">
            </div>
            <p>${girl.description}</p>
            <div class="modal-stats">
                <strong>📊 Статистика:</strong>
                <p>⭐ Уровень: ${level} (опыт: ${exp} / ${next})</p>
                ${owned && owned.rankBonus ? `<p>📈 Ранг: ${owned.rankBonus} | 🌟 Звезд: ${owned.starRank || 0}</p>` : ''}
                ${statsHTML}
            </div>
            ${passiveBonusesHTML}
            ${equipmentHTML}
            ${owned ? `
            <div class="modal-skillup" style="display:flex; align-items:center; gap:8px; margin:8px 0 12px 0;">
                <span>⚡ Очки для прокачки: <strong>${skillPts}</strong></span>
                <button class="task-btn skill-up-btn-modal">Прокачать</button>
            </div>
            ` : ''}
            <p class="modal-location"><strong>📍 Локация:</strong> ${girl.location}</p>
            <p class="modal-trigger">«${girl.trigger}»</p>
        `;
        ui.modal.overlay.classList.remove('hidden');
        
        // Обработчики для экипировки
        if (owned) {
            ui.modal.body.querySelectorAll('.unequip-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const eqId = btn.dataset.eqId;
                    const unequipped = Equipment.unequipItem(owned, eqId);
                    if (unequipped) {
                        gameState.equipmentInventory.push(unequipped);
                        showCustomAlert(`Снято: ${unequipped.name}`);
                        showGirlDetails(girlId);
                        saveGame();
                    }
                });
            });
            
            const manageBtn = ui.modal.body.querySelector('.manage-equipment-btn');
            if (manageBtn) {
                manageBtn.addEventListener('click', () => {
                    showEquipmentManagement(girlId);
                });
            }
        }
    }

    // Скрывает все модальные окна
    function hideModals() {
        ui.modal.overlay.classList.add('hidden');
        
        // Сбрасываем выделение при закрытии модалки выбора девушек
        if (ui.girlSelectionModal.overlay) {
            ui.girlSelectionModal.overlay.classList.add('hidden');
            if (ui.girlSelectionModal.list) {
                ui.girlSelectionModal.list.querySelectorAll('.exp-girl-chip.selected').forEach(chip => {
                    chip.classList.remove('selected');
                });
            }
        }
        const levelModal = document.getElementById('level-modal');
        if (levelModal) levelModal.classList.add('hidden');
        const eqModal = document.getElementById('equipment-modal');
        if (eqModal) eqModal.classList.add('hidden');
    }

    // Показывает модалку управления экипировкой
    function showEquipmentManagement(girlId) {
        const girl = gameState.ownedGirls.find(g => g.ID === girlId);
        if (!girl) return;
        
        // Создаём модалку если её нет
        let modal = document.getElementById('equipment-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'equipment-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content equipment-modal-content">
                    <button class="modal-close-button">&times;</button>
                    <div id="equipment-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const body = document.getElementById('equipment-modal-body');
        const equippedItems = girl.equipment || [];
        const inventory = gameState.equipmentInventory.filter(eq => !eq.equipped);
        
        // Фильтр по категории
        const filterCombat = inventory.filter(eq => eq.category === 'combat');
        const filterSocial = inventory.filter(eq => eq.category === 'social');
        
        body.innerHTML = `
            <h3>⚔️ Управление экипировкой: ${girl.name}</h3>
            <div class="equipment-summary">
                <div>Надето: ${equippedItems.length}/3</div>
                <div>В инвентаре: ${inventory.length}</div>
            </div>
            
            <div class="equipment-tabs">
                <button class="eq-tab-btn active" data-category="all">Все (${inventory.length})</button>
                <button class="eq-tab-btn" data-category="combat">⚔️ Боевая (${filterCombat.length})</button>
                <button class="eq-tab-btn" data-category="social">🏘️ Мирная (${filterSocial.length})</button>
            </div>
            
            <div id="equipment-inventory-list" class="equipment-inventory-list"></div>
        `;
        
        const renderInventory = (category = 'all') => {
            const list = document.getElementById('equipment-inventory-list');
            const filtered = category === 'all' ? inventory : inventory.filter(eq => eq.category === category);
            
            if (filtered.length === 0) {
                list.innerHTML = '<p style="text-align:center; opacity:0.7;">Нет доступной экипировки</p>';
                return;
            }
            
            list.innerHTML = filtered.map(eq => {
                const rarityInfo = Equipment.RARITY_LEVELS[eq.rarity];
                const typeInfo = Equipment.EQUIPMENT_TYPES[eq.type];
                const canEquip = equippedItems.length < 3;
                
                let statsHTML = `<div class="eq-stat-main">${eq.mainStat.value} ${eq.mainStat.stat}</div>`;
                if (eq.modifiers && eq.modifiers.length > 0) {
                    statsHTML += eq.modifiers.map(mod => 
                        `<div class="eq-stat-mod">+${mod.value}% ${mod.name}</div>`
                    ).join('');
                }
                
                return `
                    <div class="inventory-equipment-item" style="border-left: 4px solid ${rarityInfo.color};">
                        <div class="eq-header">
                            <span class="eq-type-icon">${typeInfo.icon}</span>
                            <div class="eq-title">
                                <div class="eq-item-name" style="color: ${rarityInfo.color};">${eq.name}</div>
                                <div class="eq-item-meta">${rarityInfo.name} · ${typeInfo.name} · ${eq.stars ? '⭐'.repeat(eq.stars) : '☆'}</div>
                            </div>
                        </div>
                        <div class="eq-stats">${statsHTML}</div>
                        <button class="action-button equip-btn" data-eq-id="${eq.id}" ${canEquip ? '' : 'disabled'}>
                            ${canEquip ? 'Надеть' : 'Слотов нет'}
                        </button>
                    </div>
                `;
            }).join('');
            
            // Обработчики кнопок надеть
            list.querySelectorAll('.equip-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const eqId = btn.dataset.eqId;
                    const equipment = inventory.find(e => e.id === eqId);
                    if (equipment) {
                        const success = Equipment.equipItem(girl, equipment);
                        if (success) {
                            // Убираем из инвентаря
                            gameState.equipmentInventory = gameState.equipmentInventory.filter(e => e.id !== eqId);
                            showCustomAlert(`✅ Надето: ${equipment.name}`);
                            showEquipmentManagement(girlId); // Перерисовываем
                            saveGame();
                        } else {
                            showCustomAlert('❌ Не удалось надеть (проверьте слоты)');
                        }
                    }
                });
            });
        };
        
        renderInventory('all');
        
        // Обработчики табов
        body.querySelectorAll('.eq-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                body.querySelectorAll('.eq-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderInventory(btn.dataset.category);
            });
        });
        
        modal.classList.remove('hidden');
        
        // Закрытие
        const closeBtn = modal.querySelector('.modal-close-button');
        if (closeBtn) closeBtn.onclick = () => {
            modal.classList.add('hidden');
            showGirlDetails(girlId); // Возвращаемся к деталям
        };
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                showGirlDetails(girlId);
            }
        }, { once: true });
    }

    // --- ДОБАВИТЬ ЭТОТ БЛОК РЯДОМ С ДРУГИМИ UI-ФУНКЦИЯМИ ---
    // Показывает кастомное уведомление
    function showCustomAlert(message) {
        const alertOverlay = document.getElementById('custom-alert-overlay');
        const alertMessage = document.getElementById('custom-alert-message');
        if (!alertOverlay || !alertMessage) return;

        alertMessage.innerHTML = message; // Используем innerHTML для поддержки тегов, если нужно
        alertOverlay.classList.remove('hidden');
    }

    // Скрывает кастомное уведомление
    function hideCustomAlert() {
        const alertOverlay = document.getElementById('custom-alert-overlay');
        if (alertOverlay) {
            alertOverlay.classList.add('hidden');
        }
    }

    // --- Level Up Modal ---
    function renderLevelModal(girlId){
        const owned = gameState.ownedGirls.find(g => g.ID === girlId);
        if (!owned) return;
        Leveling.ensureLevelingFields(owned);
        const affordable = Leveling.getAffordableActions(owned);
        const body = document.getElementById('level-modal-body');
        if (!body) return;
        
        const statInfo = Leveling.getStatInfo();
        const statKeys = Object.keys(owned.stats || {});
        const unlockedStats = owned.unlockedStats || [];
        const allStatKeys = Object.keys(statInfo);
        const lockedStats = allStatKeys.filter(k => !unlockedStats.includes(k));
        
        // Подсчет динамических стоимостей
        const infuseCost = statKeys.length > 0 ? Leveling.getStatInfusionCost(owned, statKeys[0], 1) : 1;
        const rankCost = Leveling.getRankImproveCost(owned);
        const unlockCost = Leveling.getUnlockStatCost(owned);
        const starCost = Leveling.getStarLevelCost(owned);
        const rarityCost = Leveling.getRarityUpgradeCost(owned);
        
        const crystals = gameState.resources.crystals || 0;
        const currentRarity = Leveling.parseRarityStars ? Leveling.parseRarityStars(owned.rarity) : 3;
        const canUpgradeRarity = currentRarity < 6;
        
        // Специализация
        const spec = owned.specialization || 'none';
        const specNames = {
            'none': 'Не выбрана',
            'gatherer': '🌾 Собиратель',
            'crafter': '⚒️ Мастер',
            'alchemist': '🧪 Алхимик',
            'warrior': '⚔️ Воин',
            'support': '💝 Поддержка'
        };
        
        body.innerHTML = `
            <div class="level-modal-header">
                <h3>⚡ Прокачка: ${owned.name || girlId}</h3>
                <div class="skill-points-display">
                    <span class="points-label">Доступные очки:</span>
                    <span class="points-value">${owned.skillPoints||0} SP</span>
                </div>
                ${spec !== 'none' ? `<div class="specialization-badge">${specNames[spec]}</div>` : ''}
            </div>
            
            <!-- Конвертация кристаллов призыва -->
            <div class="level-section gem-conversion">
                <h4>💠 Обмен кристаллов призыва</h4>
                <div class="gem-convert-row">
                    <span class="gem-info">У вас: <strong>${crystals}</strong> <span class="inline-crystal-icon"></span> (1 кристалл = 3 SP)</span>
                    <input type="number" id="crystal-amount" min="1" max="${crystals}" value="1" ${crystals < 1 ? 'disabled' : ''} style="width:80px;" />
                    <button class="action-button gem-btn" id="btn-convert-crystals" ${crystals < 1 ? 'disabled' : ''}>Обменять</button>
                </div>
            </div>
            
            <!-- Вливание в статы -->
            <div class="level-section">
                <h4>📊 Прокачка статов</h4>
                <div class="stat-infusion-grid">
                    ${unlockedStats.map(statKey => {
                        const info = statInfo[statKey] || { name: statKey, icon: '❔', desc: '' };
                        const currentValue = owned.stats[statKey] || 0;
                        const cost1 = Leveling.getStatInfusionCost(owned, statKey, 1);
                        const cost5 = Leveling.getStatInfusionCost(owned, statKey, 5);
                        const cost10 = Leveling.getStatInfusionCost(owned, statKey, 10);
                        const canAfford1 = (owned.skillPoints || 0) >= cost1;
                        const canAfford5 = (owned.skillPoints || 0) >= cost5;
                        const canAfford10 = (owned.skillPoints || 0) >= cost10;
                        
                        return `
                            <div class="stat-card">
                                <div class="stat-header">
                                    <span class="stat-icon">${info.icon}</span>
                                    <div class="stat-info">
                                        <div class="stat-name">${info.name}</div>
                                        <div class="stat-value">Текущее: ${currentValue}</div>
                                    </div>
                                </div>
                                <div class="stat-desc">${info.desc}</div>
                                <div class="stat-buttons">
                                    <button class="stat-btn small" data-stat="${statKey}" data-amount="1" ${canAfford1 ? '' : 'disabled'}>+1 (${cost1})</button>
                                    <button class="stat-btn small" data-stat="${statKey}" data-amount="5" ${canAfford5 ? '' : 'disabled'}>+5 (${cost5})</button>
                                    <button class="stat-btn small" data-stat="${statKey}" data-amount="10" ${canAfford10 ? '' : 'disabled'}>+10 (${cost10})</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Разблокировка новых статов -->
            ${lockedStats.length > 0 ? `
            <div class="level-section">
                <h4>🔓 Разблокировать новый стат</h4>
                <div class="unlock-stats-grid">
                    ${lockedStats.map(statKey => {
                        const info = statInfo[statKey] || { name: statKey, icon: '❔', desc: '' };
                        const canAfford = (owned.skillPoints || 0) >= unlockCost;
                        const startValue = 5 + Math.floor(owned.level || 0);
                        return `
                            <button class="unlock-stat-btn" data-stat="${statKey}" ${canAfford ? '' : 'disabled'}>
                                <span class="stat-icon-big">${info.icon}</span>
                                <div class="unlock-stat-info">
                                    <div class="unlock-stat-name">${info.name}</div>
                                    <div class="unlock-stat-desc">${info.desc}</div>
                                    <div class="unlock-stat-cost">Старт: +${startValue} | Цена: ${unlockCost} SP</div>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Специализация -->
            ${spec === 'none' && affordable.canSpecialize ? `
            <div class="level-section specialization-section">
                <h4>⭐ Выбрать специализацию (20 SP)</h4>
                <p class="warning-text">⚠️ Выбирается один раз навсегда!</p>
                <div class="specialization-grid">
                    <button class="spec-btn" data-spec="gatherer">
                        <span class="spec-icon">🌾</span>
                        <div class="spec-name">Собиратель</div>
                        <div class="spec-bonus">+15 Сбор, +10 Удача</div>
                    </button>
                    <button class="spec-btn" data-spec="crafter">
                        <span class="spec-icon">⚒️</span>
                        <div class="spec-name">Мастер</div>
                        <div class="spec-bonus">+20 Крафт, +10 Ремонт</div>
                    </button>
                    <button class="spec-btn" data-spec="alchemist">
                        <span class="spec-icon">🧪</span>
                        <div class="spec-name">Алхимик</div>
                        <div class="spec-bonus">+20 Алхимия, +10 Магия</div>
                    </button>
                    <button class="spec-btn" data-spec="warrior">
                        <span class="spec-icon">⚔️</span>
                        <div class="spec-name">Воин</div>
                        <div class="spec-bonus">+15 Сила, +15 Защита</div>
                    </button>
                    <button class="spec-btn" data-spec="support">
                        <span class="spec-icon">💝</span>
                        <div class="spec-name">Поддержка</div>
                        <div class="spec-bonus">+15 Мораль, +15 Кулинария</div>
                    </button>
                </div>
            </div>
            ` : ''}
            
            <!-- Глобальные улучшения -->
            <div class="level-section">
                <h4>🌟 Глобальные улучшения</h4>
                <div class="global-upgrades">
                    <button class="upgrade-btn" id="btn-rank" ${affordable.canImproveRank ? '' : 'disabled'}>
                        <span class="upgrade-icon">📈</span>
                        <div class="upgrade-info">
                            <div class="upgrade-name">Улучшить ранг</div>
                            <div class="upgrade-desc">+5% ко всем статам | Ранг: ${owned.rankBonus || 0}</div>
                            <div class="upgrade-cost">${rankCost} SP</div>
                        </div>
                    </button>
                    <button class="upgrade-btn" id="btn-star-level" ${affordable.canIncreaseStarLevel ? '' : 'disabled'}>
                        <span class="upgrade-icon">⭐</span>
                        <div class="upgrade-info">
                            <div class="upgrade-name">Звездный уровень</div>
                            <div class="upgrade-desc">+2 ко всем статам | Звезд: ${owned.starRank || 0}</div>
                            <div class="upgrade-cost">${starCost} SP</div>
                        </div>
                    </button>
                    <button class="upgrade-btn" id="btn-upgrade-rarity" ${affordable.canUpgradeRarityStar && canUpgradeRarity ? '' : 'disabled'}>
                        <span class="upgrade-icon">💫</span>
                        <div class="upgrade-info">
                            <div class="upgrade-name">Повысить редкость</div>
                            <div class="upgrade-desc">Большой буст всех статов + бонус SP | ${owned.rarity} → ${currentRarity + 1}★</div>
                            <div class="upgrade-cost">${canUpgradeRarity ? rarityCost + ' SP' : 'Макс 6★'}</div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        const onDone = () => {
            updateGirlCardProgress(girlId);
            renderLevelModal(girlId);
            saveGame();
        };
        
        // Конвертация кристаллов призыва
        const convertBtn = body.querySelector('#btn-convert-crystals');
        if (convertBtn) convertBtn.addEventListener('click', () => {
            const input = body.querySelector('#crystal-amount');
            const amount = input ? parseInt(input.value) : 1;
            if (!amount || amount < 1) return;
            
            const result = Leveling.convertCrystalsToSkillPoints(owned, amount, gameState.resources.crystals);
            if (result.success) {
                gameState.resources.crystals -= result.crystalsUsed;
                updateResourcesUI();
                showCustomAlert(`✨ Получено ${result.pointsGained} очков навыка за ${result.crystalsUsed} кристаллов!`);
                onDone();
            } else {
                showCustomAlert(result.message);
            }
        });
        
        // Вливание в статы (массовое)
        body.querySelectorAll('.stat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stat = btn.dataset.stat;
                const amount = parseInt(btn.dataset.amount);
                if (Leveling.applyBulkStatInfusion(owned, stat, amount)) {
                    showCustomAlert(`+${amount} к ${stat}!`);
                    onDone();
                }
            });
        });
        
        // Разблокировка статов
        body.querySelectorAll('.unlock-stat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stat = btn.dataset.stat;
                if (Leveling.unlockExtraStat(owned, stat)) {
                    const info = Leveling.getStatInfo()[stat] || {};
                    showCustomAlert(`🔓 Разблокирован стат: ${info.name || stat}!`);
                    onDone();
                }
            });
        });
        
        // Специализация
        body.querySelectorAll('.spec-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const spec = btn.dataset.spec;
                if (confirm('Выбрать эту специализацию навсегда?')) {
                    if (Leveling.setSpecialization(owned, spec)) {
                        showCustomAlert(`⭐ Выбрана специализация!`);
                        onDone();
                    }
                }
            });
        });
        
        // Глобальные улучшения
        const rankBtn = body.querySelector('#btn-rank');
        if (rankBtn) rankBtn.addEventListener('click', () => {
            if (Leveling.improveRank(owned)) {
                showCustomAlert('📈 Ранг повышен!');
                onDone();
            }
        });
        
        const starBtn = body.querySelector('#btn-star-level');
        if (starBtn) starBtn.addEventListener('click', () => {
            if (Leveling.increaseStarLevel(owned)) {
                showCustomAlert('⭐ Звездный уровень повышен!');
                onDone();
            }
        });
        
        const upgBtn = body.querySelector('#btn-upgrade-rarity');
        if (upgBtn) upgBtn.addEventListener('click', () => {
            if (Leveling.upgradeRarityStar(owned)) {
                showCustomAlert('💫 Редкость повышена!');
                onDone();
            }
        });
    }

    function openLevelModal(girlId){
        const overlay = document.getElementById('level-modal');
        if (!overlay) return;
        renderLevelModal(girlId);
        overlay.classList.remove('hidden');
        // Закрытие по крестику
        const closeBtn = overlay.querySelector('.modal-close-button');
        if (closeBtn) closeBtn.onclick = hideModals;
        // Клик по фону
        overlay.addEventListener('click', (e) => { if (e.target === overlay) hideModals(); }, { once: true });
    }
    
    // Показывает красивый результат призыва
    function showSummonResult(girl) {
        let rarityColor = '#95a5a6';
        if (girl.rarity === '4★') rarityColor = '#3498db';
        else if (girl.rarity === '5★') rarityColor = '#9b59b6';
        else if (girl.rarity === '6★') rarityColor = '#f39c12';

        ui.modal.body.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3em; margin-bottom: 15px;">✨</div>
                <h3 style="color: ${rarityColor}; text-shadow: 0 0 10px ${rarityColor}40; margin-bottom: 10px;">
                    Новый персонаж!
                </h3>
                <h2 style="color: var(--text-color); margin-bottom: 15px; font-size: 1.5em;">
                    ${girl.name}
                </h2>
                <div style="font-size: 1.3em; color: ${rarityColor}; font-weight: bold; margin-bottom: 15px;">
                    ${girl.rarity}
                </div>
                <p style="color: #bdc3c7; margin-bottom: 15px; font-style: italic;">
                    ${girl.profession}
                </p>
                <p style="color: var(--text-color); line-height: 1.4;">
                    ${girl.description}
                </p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                    <p style="color: #bdc3c7; font-size: 0.9em; margin: 0;">
                        <strong>Локация:</strong> ${girl.location}
                    </p>
                </div>
            </div>
        `;
        ui.modal.overlay.classList.remove('hidden');
        
        setTimeout(() => {
            hideModals();
        }, 4000);
    }

    // Переключает активный вид (Деревня/Карта/Крафт)
    function switchView(viewName) {
        Object.values(ui.views).forEach(view => view.classList.remove('active-view'));
        ui.views[viewName.replace('-view', '')].classList.add('active-view');
        
        ui.buttons.nav.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        if (viewName === 'crafting-view') {
            renderRecipes();
        } else if (viewName === 'map-view') {
            renderExpeditionGirls();
            renderActiveExpeditions();
            renderFoodExpeditionGirls();
            updateExpeditionButtonLabel();
        } else if (viewName === 'village-view') {
            renderActiveExpeditions();
        }
    }

    // --- ИГРОВАЯ ЛОГИКА ---

    // Призыв новой девушки ("Гача")
    function summonGirl() {
        if (gameState.resources.crystals < 1) {
            showCustomAlert('Недостаточно кристаллов для «Зова Сердца»!');
            return;
        }

        ui.buttons.summon.style.transform = 'scale(0.95)';
        setTimeout(() => { ui.buttons.summon.style.transform = ''; }, 150);
        
        const availableGirls = gameState.allGirlsData.filter(girl => 
            !gameState.ownedGirls.some(owned => owned.ID === girl.ID)
        );

        if (availableGirls.length === 0) {
            showCustomAlert('Поздравляем! Вы собрали всех девушек!');
            return;
        }

        gameState.resources.crystals--;
        
        const selectRarityByDropRate = () => {
             const random = Math.random() * 100;
             let cumulative = 0;
             for (const [rarity, rate] of Object.entries(dropRates)) {
                 cumulative += rate;
                 if (random <= cumulative) return rarity;
             }
             return '3★';
        };

        const getRandomGirlByRarity = (targetRarity) => {
             const girlsOfRarity = availableGirls.filter(g => g.rarity === targetRarity);
             if (girlsOfRarity.length > 0) {
                 return girlsOfRarity[Math.floor(Math.random() * girlsOfRarity.length)];
             }
             // Запасной вариант: если девушек нужной редкости не осталось, берем любую доступную
             return availableGirls[Math.floor(Math.random() * availableGirls.length)];
        };

        const selectedRarity = selectRarityByDropRate();
        const newGirl = getRandomGirlByRarity(selectedRarity);
        
        ensureGirlProgressFields(newGirl);
        gameState.ownedGirls.push(newGirl);
        gameState.ownedGirls.sort((a, b) => a.rank - b.rank);
        
        showSummonResult(newGirl);
        updateResourcesUI();
        renderOwnedGirls();
        // Обновляем точки разведки при появлении новой девушки (может удовлетворить требования по профессии)
        renderScoutPoints();
        saveGame();
    }

    // Открывает модальное окно выбора девушки для крафта
    function openGirlSelectionModal(recipeId) {
        const recipe = recipes[recipeId];
        const freeGirls = gameState.ownedGirls.filter(g => !g.isBusy);
        
        // Очищаем список и сбрасываем заголовок
        ui.girlSelectionModal.list.innerHTML = '';
        const header = ui.girlSelectionModal.body.querySelector('h3');
        if (header) header.textContent = `Выберите девушку для крафта: ${recipe.name}`;
        
        // Убираем кнопку подтверждения разведки, если осталась
        const confirmBtn = ui.girlSelectionModal.body.querySelector('.confirm-scout-start');
        if (confirmBtn) confirmBtn.remove();
        
        if (freeGirls.length === 0) {
            ui.girlSelectionModal.list.innerHTML = '<p>Все девушки заняты!</p>';
        } else {
            // Сортируем по релевантному стату, чтобы лучшие были вверху
            freeGirls.sort((a, b) => (b.stats[recipe.stat] || 0) - (a.stats[recipe.stat] || 0));

            freeGirls.forEach(girl => {
                const statValue = girl.stats[recipe.stat] || 0;
                // Скидки: стат до 80% и уровень до 30% (2% за уровень)
                const timeReductionStat = Math.min(0.8, (statValue * 0.004));
                const levelVal = typeof girl.level === 'number' ? girl.level : 0;
                const timeReductionLevel = Math.min(0.3, levelVal * 0.02);
                const finalDuration = recipe.baseTime * (1 - timeReductionStat) * (1 - timeReductionLevel);

                const girlElement = document.createElement('div');
                girlElement.className = 'modal-girl-item';
                girlElement.dataset.girlId = girl.ID;
                girlElement.dataset.recipeId = recipeId;
                const candidates = JSON.stringify(getAvatarCandidates(girl)).replace(/'/g, "&apos;");
                girlElement.innerHTML = `
                    <div class="modal-girl-info">
                        <span class="avatar-circle">
                            <img class="avatar-circle-img" src="${getAvatarUrl(girl)}" data-candidates='${candidates}' data-idx="0" onerror="window.__nextAvatarSrc && window.__nextAvatarSrc(this)" alt="${girl.name}">
                        </span>
                        <div class="modal-girl-text">
                            <span>${girl.name} <span class="chip-prof">(${girl.profession})</span></span>
                            <span class="modal-girl-time">Время: ${(finalDuration / 1000).toFixed(1)}с</span>
                        </div>
                    </div>
                    <span class="stat-highlight">${recipe.stat.replace('_', ' ')}: ${statValue}</span>
                `;
                ui.girlSelectionModal.list.appendChild(girlElement);
            });
        }
        ui.girlSelectionModal.overlay.classList.remove('hidden');
    }

    // Запускает процесс крафта
    function startCrafting(recipeId, girlId) {
        const recipe = recipes[recipeId];
        const girl = gameState.ownedGirls.find(g => g.ID === girlId);
        if (!recipe) return;
        if (!girl) {
            showCustomAlert('Выбранная девушка не найдена.');
            return;
        }

        // Ограничение профессии повара для готовой еды
        if (recipeId === 'prepared_food') {
            const prof = (girl.profession || '').toLowerCase();
            if (!prof.includes('повар')) {
                showCustomAlert('Готовую еду может готовить только Повар.');
                return;
            }
        }
        // Ограничение профессии алхимия
        //if (recipeId === 'alchemy') {
        //    const prof = (girl.profession || '').toLowerCase();
        //    if (!prof.includes('Алхимик')) {
        //        showCustomAlert('Алхимией занимаеться алхимик.');
        //        return;
        //    }
        //}

        // Проверяем ресурсы ещё раз и списываем
        for (const res in recipe.requires) {
            const need = recipe.requires[res];
            const have = gameState.resources[res] || 0;
            if (have < need) {
                // Если закреплена задача, переводим в режим ожидания
                const pinned = gameState.pinnedCrafts.find(p => p.girlId === girlId && p.recipeId === recipeId);
                if (pinned) {
                    girl.isBusy = true;
                    const waitingTask = {
                        id: 'waiting_' + Date.now() + Math.random(),
                        recipeId,
                        girlId,
                        waiting: true,
                    };
                    gameState.activeCrafts.push(waitingTask);
                    // Закрываем только модалку выбора девушки, чтобы не закрывать модалку прокачки
                    if (ui.girlSelectionModal && ui.girlSelectionModal.overlay) {
                        ui.girlSelectionModal.overlay.classList.add('hidden');
                    }
                    updateGirlCardBusyState(girlId, true);
                    renderActiveCrafts();
                } else {
                    showCustomAlert('Недостаточно ресурсов для начала крафта.');
                }
                return;
            }
        }
        for (const res in recipe.requires) {
            gameState.resources[res] -= recipe.requires[res];
        }

        // Отмечаем девушку как занятую
        girl.isBusy = true;

        // Рассчитываем время крафта с учетом статов
        const statValue = girl.stats[recipe.stat] || 0;
        const timeReductionStat = Math.min(0.8, (statValue * 0.004));
        const levelVal = typeof girl.level === 'number' ? girl.level : 0;
        const timeReductionLevel = Math.min(0.3, levelVal * 0.02);
        const finalDuration = recipe.baseTime * (1 - timeReductionStat) * (1 - timeReductionLevel);

        // Создаем задачу
        const craftTask = {
            id: 'craft_' + Date.now() + Math.random(),
            recipeId,
            girlId,
            startTime: Date.now(),
            duration: finalDuration,
        };
        gameState.activeCrafts.push(craftTask);

        // Закрываем только модалку выбора девушки, чтобы не закрывать модалку прокачки
        if (ui.girlSelectionModal && ui.girlSelectionModal.overlay) {
            ui.girlSelectionModal.overlay.classList.add('hidden');
        }
        updateResourcesUI();
        updateGirlCardBusyState(girlId, true);
        renderActiveCrafts();
        // Обновляем точки разведки при занятости девушки/изменении ресурсов
        renderScoutPoints();
    }

    // Завершает процесс крафта
    function finishCrafting(task) {
        const recipe = recipes[task.recipeId];
        const girl = gameState.ownedGirls.find(g => g.ID === task.girlId);

        // Начисляем ресурсы
        const productName = Object.keys(recipe.produces)[0];
        let amountProduced = recipe.produces[productName];

        const luckValue = girl.stats.luck || 0;
        const crit = (Math.random() * 100) < luckValue;
        if (crit) {
            amountProduced = Math.ceil(amountProduced * 1.5);
        }
        
        // Применяем бонус от food для готовой еды
        if (task.recipeId === 'prepared_food' && girl.passiveBonuses && girl.passiveBonuses.foodBonus) {
            const foodBonus = girl.passiveBonuses.foodBonus / 100; // Переводим в множитель
            amountProduced = Math.ceil(amountProduced * (1 + foodBonus));
        }

        gameState.resources[productName] = (gameState.resources[productName] || 0) + amountProduced;

        addExperience(girl, 1 + (crit ? 1 : 0));

        // Проверяем закрепление
        const pinned = gameState.pinnedCrafts.find(p => p.girlId === task.girlId && p.recipeId === task.recipeId);

        // Удаляем выполненную задачу из активных
        gameState.activeCrafts = gameState.activeCrafts.filter(t => t.id !== task.id);

        if (pinned) {
            // Пытаемся запустить снова
            const canAfford = Object.entries(recipe.requires).every(([res, need]) => (gameState.resources[res] || 0) >= need);
            if (canAfford) {
                startCrafting(task.recipeId, task.girlId);
            } else {
                // Оставляем девушку занятой и создаем задачу ожидания ресурсов
                girl.isBusy = true;
                const waitingTask = {
                    id: 'waiting_' + Date.now() + Math.random(),
                    recipeId: task.recipeId,
                    girlId: task.girlId,
                    waiting: true,
                };
                gameState.activeCrafts.push(waitingTask);
            }
        } else {
            // Освобождаем девушку
            girl.isBusy = false;
        }

        console.log(`Крафт "${recipe.name}" завершен!`);
        updateResourcesUI();
        updateGirlCardBusyState(task.girlId, girl.isBusy);
        renderActiveCrafts();
        // Обновляем точки разведки при изменении доступности девушек/ресурсов
        renderScoutPoints();
        saveGame();
    }

    // Игровой цикл для отслеживания прогресса
    function gameLoop() {
        const now = Date.now();
        const completedTasks = gameState.activeCrafts.filter(task => !task.waiting && now >= task.startTime + task.duration);
        if (completedTasks.length > 0) {
            completedTasks.forEach(task => finishCrafting(task));
        }
        const waitingTasks = gameState.activeCrafts.filter(t => t.waiting);
        waitingTasks.forEach(t => {
            const recipe = recipes[t.recipeId];
            if (Object.entries(recipe.requires).every(([res, need]) => (gameState.resources[res] || 0) >= need)) {
                gameState.activeCrafts = gameState.activeCrafts.filter(x => x.id !== t.id);
                startCrafting(t.recipeId, t.girlId);
            }
        });
        renderActiveCrafts();
    }

    function startExpedition(girlIds, mode, duration, distance) {
        if (!Array.isArray(girlIds) || girlIds.length === 0) return;
        const finalMode = mode || 'auto';
        const mconf = (expConfig?.modes || {})[finalMode] || {};
        const finalDuration = (typeof mconf.fixedDurationMs === 'number') ? mconf.fixedDurationMs : (duration || 60000);
        
        // Обработка дальности
        const distanceKey = distance || 'medium';
        const distanceConfig = (expConfig?.distances || {})[distanceKey] || { multiplier: 1.0, travelTimeMs: 0, foodCostMultiplier: 1.0 };

        // Защита: не запускать, если хотя бы одна девушка уже занята
        const busyPick = girlIds
            .map(id => gameState.ownedGirls.find(g => g.ID === id))
            .filter(Boolean)
            .find(g => g.isBusy);
        if (busyPick) {
            showCustomAlert(`Некоторые участницы уже заняты: ${busyPick.name}. Освободите их или дождитесь завершения.`);
            return;
        }

        // Валидация профессий по конфигу (если указано)
        const allowed = (mconf.allowedProfessions || []);
        if (allowed.length > 0) {
            const invalid = girlIds
                .map(id => gameState.ownedGirls.find(g => g.ID === id))
                .filter(Boolean)
                .some(g => {
                    const p = (g.profession || '').toLowerCase();
                    return !allowed.some(substr => p.includes(substr));
                });
            if (invalid) {
                showCustomAlert('Состав экспедиции не соответствует требованиям профессий для выбранного режима.');
                return;
            }
        }

        // Предоплата еды с учетом дальности
        const upfrontPerGirl = Number(mconf.upfrontFoodPerGirl || 0) * distanceConfig.foodCostMultiplier;
        if (upfrontPerGirl > 0) {
            const upfrontCost = Math.ceil(girlIds.length * upfrontPerGirl);
            if ((gameState.resources.food || 0) < upfrontCost) {
                showCustomAlert(`Недостаточно готовой еды. Требуется: ${upfrontCost}.`);
                return;
            }
            gameState.resources.food -= upfrontCost;
            updateResourcesUI();
        }

        // Помечаем девушек занятыми
        girlIds.forEach(id => {
            const g = gameState.ownedGirls.find(x => x.ID === id);
            if (g) g.isBusy = true;
        });

        const now = Date.now();
        const totalDuration = finalDuration + distanceConfig.travelTimeMs * 2; // Туда и обратно (для dry_food travelTimeMs=0)
        const exp = {
            id: 'exp_' + Date.now() + Math.random(),
            girlIds: [...girlIds],
            mode: finalMode,
            duration: totalDuration,
            gatherDuration: finalDuration,
            travelTime: distanceConfig.travelTimeMs,
            distance: distanceKey,
            multiplier: distanceConfig.multiplier,
            stash: { wood: 0, stone: 0, dry_food: 0, esense: 0, iron_ore: 0, herbs: 0, hides: 0, ancient_relics: 0, gems: 0 },
            elapsedMs: 0,
            phase: 'travel_to', // travel_to, gathering, travel_back
            phaseStartMs: now,
            paused: false,
            nextFoodTick: now + (expConfig?.consumption?.consumptionTickMs || 30000),
            contributions: {},
        };
        exp.girlIds.forEach(id => { exp.contributions[id] = { wood: 0, stone: 0, dry_food: 0, esense: 0, iron_ore: 0, herbs: 0, hides: 0, ancient_relics: 0, gems: 0, total: 0 }; });
        exp.auto = false;
        exp.repeatCount = 0;
        gameState.expeditions.push(exp);
        updateGirlsBusyState(girlIds, true);
        renderExpeditionGirls();
        renderFoodExpeditionGirls();
        renderActiveExpeditions();
        // Обновляем точки разведки при занятости девушек
        renderScoutPoints();
        saveGame();
    }

    function expeditionTick() {
        if (gameState.expeditions.length === 0) return;
        gameState.expeditions.forEach(exp => {
            // Питание: по конфигу расход еды на девушку
            const now = Date.now();
            const consumption = expConfig?.consumption || {};
            const consTickMs = Number(consumption.consumptionTickMs || 30000);
            const consPerGirl = Number(consumption.foodPerGirlPerConsumption || 0);
            const foodCost = exp.girlIds.length * consPerGirl;
            // Исключения: 'dry_food' и 'scout' не требуют готовой еды на тиках
            if (exp.mode !== 'dry_food' && exp.mode !== 'scout') {
                if (now >= exp.nextFoodTick) {
                    const haveFood = (gameState.resources.food || 0);
                    if (haveFood >= foodCost) {
                        gameState.resources.food -= foodCost;
                        exp.paused = false;
                        exp.nextFoodTick += consTickMs;
                        updateResourcesUI();
                    } else {
                        exp.paused = true;
                    }
                }
            } else {
                // На всякий случай снимаем паузу для данных режимов
                exp.paused = false;
            }

            if (exp.paused) return; // пауза: не добываем и не двигаем прогресс

            // Проверка фаз экспедиции
            if (exp.phase) {
                const elapsed = now - (exp.phaseStartMs || now);
                if (exp.phase === 'travel_to' && elapsed >= (exp.travelTime || 0)) {
                    exp.phase = 'gathering';
                    exp.phaseStartMs = now;
                } else if (exp.phase === 'gathering' && elapsed >= (exp.gatherDuration || exp.duration)) {
                    exp.phase = 'travel_back';
                    exp.phaseStartMs = now;
                }
            }

            // Добыча только в фазе gathering
            if (!exp.phase || exp.phase === 'gathering') {
                // Для точек разведки - фиксированные награды в конце
                if (exp.mode === 'scout') {
                    // Не добываем во время сбора, награды будут в конце
                } else {
                    // Определяем что добываем в этот тик
                    let resThisTick = exp.mode;
                    const mAuto = (expConfig?.modes || {}).auto || {};
                    if (resThisTick === 'auto') {
                        const choices = Array.isArray(mAuto.autoChoices) && mAuto.autoChoices.length ? mAuto.autoChoices : ['wood', 'stone'];
                        resThisTick = choices[Math.floor(Math.random() * choices.length)] || 'wood';
                    }

                    // Считаем добычу: база (по числу участниц) + бонусы от статов/профессий по конфигу
                    const girls = exp.girlIds.map(id => gameState.ownedGirls.find(g => g.ID === id)).filter(Boolean);
                    const mconf = (expConfig?.modes || {})[resThisTick] || {};
                    let gain = girls.length * Number(mconf.baseGainPerGirl || 0);
                    
                    // Применяем multiplier от дальности
                    const multiplier = exp.multiplier || 1.0;
                    gain *= multiplier;
                    
                    const statWeights = mconf.statWeights || {};
                    const profBonusKeys = mconf.professionBonusKeywords || [];
                    const profs = girls.map(g => (g.profession || '').toLowerCase());
                    // статовые бонусы как сумма/делитель
                    Object.entries(statWeights).forEach(([stat, div]) => {
                        const sum = girls.reduce((acc, g) => acc + ((g.stats?.[stat]) || 0), 0);
                        if (Number(div) > 0) gain += Math.floor(sum / Number(div)) * multiplier;
                    });
                    // проф бонус: +1 за совпадающее ключевое слово
                    const profBonus = profs.filter(p => profBonusKeys.some(k => p.includes(k))).length;
                    gain += profBonus * multiplier;
                    const resKey = mconf.resourceKey || resThisTick;
                    for (let i = 0; i < Math.max(0, Math.floor(gain)); i++) {
                        const pick = girls[Math.floor(Math.random() * girls.length)];
                        exp.stash[resKey] = (exp.stash[resKey] || 0) + 1;
                        if (exp.contributions && pick && exp.contributions[pick.ID]) {
                            exp.contributions[pick.ID][resKey] = (exp.contributions[pick.ID][resKey] || 0) + 1;
                            exp.contributions[pick.ID].total += 1;
                        }
                    }
                }
            }

            // Двигаем прогресс экспедиции согласно tick режима (если есть) или 2000ms
            const tickMs = Number(((expConfig?.modes || {})[exp.mode] || {}).tickMs || 2000);
            exp.elapsedMs = Math.min(exp.duration, (exp.elapsedMs || 0) + tickMs);
        });
        // Завершение экспедиций
        const finished = gameState.expeditions.filter(exp => (exp.elapsedMs || 0) >= exp.duration);
        if (finished.length > 0) {
            finished.forEach(exp => finishExpedition(exp));
        }
        renderActiveExpeditions();
        updateResourcesUI();
        // Обновляем точки разведки если были завершенные экспедиции (изменились ресурсы)
        // finishExpedition уже обновляет при освобождении девушек, но не при авто-повторе
        if (finished.length > 0) {
            const hasAutoRepeat = finished.some(exp => exp.auto || (exp.repeatCount && exp.repeatCount > 0));
            if (hasAutoRepeat) {
                renderScoutPoints();
            }
        }
    }

    function finishExpedition(exp) {
        // Для точек разведки - выдаем фиксированные награды
        if (exp.mode === 'scout' && exp.rewards) {
            const point = (expConfig?.scoutPoints || {})[exp.scoutPoint];
            const minGirls = point?.minGirls || 0;
            const sentGirls = (exp.girlIds || []).length;
            const hasExtra = sentGirls > minGirls;
            const bonusMult = hasExtra ? 1.2 : 1.0; // +20% если отправлено больше квоты

            Object.entries(exp.rewards).forEach(([res, range]) => {
                const base = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                const amount = Math.ceil(base * bonusMult);
                gameState.resources[res] = (gameState.resources[res] || 0) + amount;
            });

            if (hasExtra) {
                showCustomAlert('🔼 Бонус: +20% к наградам за расширенный состав отряда');
            }

            // Дроп экипировки для специальных точек
            if (point && point.isEquipmentExpedition) {
                const cfgChance = (typeof point.equipmentDropChance === 'number') ? Math.max(0, Math.min(1, point.equipmentDropChance)) : null;
                const pass = (cfgChance === null) ? true : (Math.random() < cfgChance);
                if (pass && typeof Equipment?.generateEquipmentDrop === 'function') {
                    const girls = (exp.girlIds || []).map(id => gameState.ownedGirls.find(g => g.ID === id)).filter(Boolean);
                    const avgLuck = girls.length > 0 ? girls.reduce((s, g) => s + (g.stats?.luck || 0), 0) / girls.length : 0;
                    const avgStrength = girls.length > 0 ? girls.reduce((s, g) => s + (g.stats?.strength || 0), 0) / girls.length : 0;
                    const avgDefense = girls.length > 0 ? girls.reduce((s, g) => s + (g.stats?.defense || 0), 0) / girls.length : 0;
                    const avgMagic = girls.length > 0 ? girls.reduce((s, g) => s + (g.stats?.magic || 0), 0) / girls.length : 0;
                    const difficulty = point.difficulty || 1;
                    const duration = (point.travelTimeMs || 0) + (point.gatherDuration || 0);
                    
                    // Если шанс >= 0.99 (гарантированный), пытаемся до 10 раз
                    const isGuaranteed = cfgChance !== null && cfgChance >= 0.99;
                    const maxAttempts = isGuaranteed ? 10 : 1;
                    let equipment = null;
                    
                    for (let attempt = 0; attempt < maxAttempts && !equipment; attempt++) {
                        equipment = Equipment.generateEquipmentDrop(difficulty, avgLuck, {
                            girlCount: girls.length,
                            duration: duration,
                            avgStrength: avgStrength,
                            avgDefense: avgDefense,
                            avgMagic: avgMagic
                        });
                    }
                    
                    if (equipment) {
                        gameState.equipmentInventory.push(equipment);
                        const rarityName = Equipment.RARITY_LEVELS[equipment.rarity]?.name || '';
                        showCustomAlert(`🎉 Найдена экипировка: ${equipment.name} (${rarityName}${equipment.stars ? ', ' + equipment.stars + '★' : ''})!`);
                    }
                }
            }
        } else {
            // Начисляем накопленные ресурсы из обычных экспедиций
            const resKeys = ['wood', 'stone', 'dry_food', 'esense', 'iron_ore', 'herbs', 'hides', 'ancient_relics', 'gems'];
            resKeys.forEach(key => {
                gameState.resources[key] = (gameState.resources[key] || 0) + (exp.stash[key] || 0);
            });
        }
        // Критический бонус добычи по удаче участниц: +50% от их личного вклада (без уведомлений)
        if (exp.contributions) {
            exp.girlIds.forEach(id => {
                const g = gameState.ownedGirls.find(x => x.ID === id);
                if (!g) return;
                const luck = g.stats?.luck || 0;
                const crit = (Math.random() * 100) < luck;
                if (!crit) return;
                const contrib = exp.contributions[id] || {};
                resKeys.forEach(rk => {
                    const base = contrib[rk] || 0;
                    if (base > 0) {
                        const bonus = Math.ceil(base * 0.5);
                        gameState.resources[rk] = (gameState.resources[rk] || 0) + bonus;
                    }
                });
            });
        }
        const baseExp = Math.max(1, Math.round(exp.duration / 60000));
        const mode = exp.mode;
        const matchCheck = (p) => {
            const pr = (p || '').toLowerCase();
            if (mode === 'wood') return pr.includes('сад') || pr.includes('собир') || pr.includes('пчелов');
            if (mode === 'stone') return pr.includes('кузне') || pr.includes('инжен');
            if (mode === 'dry_food') return pr.includes('собир') || pr.includes('рыбак') || pr.includes('охот');
            if (mode === 'esense') return pr.includes('алхим') || pr.includes('маг') || pr.includes('жриц') || pr.includes('орак');
            if (mode === 'iron_ore') return pr.includes('кузне') || pr.includes('шахт') || pr.includes('горня');
            if (mode === 'herbs') return pr.includes('алхим') || pr.includes('травн') || pr.includes('собир') || pr.includes('целит');
            if (mode === 'hides') return pr.includes('охот') || pr.includes('воин') || pr.includes('следоп');
            if (mode === 'ancient_relics') return pr.includes('археол') || pr.includes('исследов') || pr.includes('учён') || pr.includes('маг') || pr.includes('жриц');
            if (mode === 'gems') return pr.includes('горня') || pr.includes('шахт') || pr.includes('геол') || pr.includes('ювел');
            return false;
        };
        let topIds = [];
        if (exp.girlIds.length > 1 && exp.contributions) {
            let maxTotal = 0;
            exp.girlIds.forEach(id => { maxTotal = Math.max(maxTotal, exp.contributions[id]?.total || 0); });
            topIds = exp.girlIds.filter(id => (exp.contributions[id]?.total || 0) === maxTotal && maxTotal > 0);
        }
        exp.girlIds.forEach(id => {
            const g = gameState.ownedGirls.find(x => x.ID === id);
            if (!g) return;
            const luck = g.stats?.luck || 0;
            const critBonus = (Math.random() * 100) < luck ? 1 : 0;
            const mostBonus = (exp.girlIds.length > 1 && topIds.includes(id)) ? 1 : 0;
            const profBonus = matchCheck(g.profession) ? 1 : 0;
            addExperience(g, baseExp + critBonus + mostBonus + profBonus);
        });
        // Освобождаем участниц
        // Решаем предварительно, будет ли повтор
        const shouldRepeat = exp.auto || (exp.repeatCount && exp.repeatCount > 0);
        // Удаляем текущую экспедицию
        gameState.expeditions = gameState.expeditions.filter(e => e.id !== exp.id);
        if (shouldRepeat) {
            // НЕ освобождаем девушек, моментально создаем следующую
            const now = Date.now();
            const consTickMs = Number((expConfig?.consumption || {}).consumptionTickMs || 30000);
            const next = {
                id: 'exp_' + Date.now() + Math.random(),
                girlIds: [...exp.girlIds],
                mode: exp.mode,
                // Полный цикл: путь туда + сбор + путь обратно, как и в исходной экспедиции
                duration: (exp.travelTime || 0) * 2 + (exp.gatherDuration || (exp.duration || 0)),
                gatherDuration: exp.gatherDuration || (exp.duration || 0),
                travelTime: exp.travelTime || 0,
                distance: exp.distance,
                multiplier: exp.multiplier || 1.0,
                stash: { wood: 0, stone: 0, dry_food: 0, esense: 0, iron_ore: 0, herbs: 0, hides: 0, ancient_relics: 0, gems: 0 },
                elapsedMs: 0,
                phase: 'travel_to',
                phaseStartMs: now,
                paused: false,
                nextFoodTick: now + consTickMs,
                contributions: {},
                auto: exp.auto,
                repeatCount: exp.repeatCount ? Math.max(0, exp.repeatCount - 1) : 0,
            };
            next.girlIds.forEach(id => { next.contributions[id] = { wood: 0, stone: 0, dry_food: 0, esense: 0, iron_ore: 0, herbs: 0, hides: 0, ancient_relics: 0, gems: 0, total: 0 }; });
            // Убедимся, что девушки остаются занятыми
            next.girlIds.forEach(id => { const g = gameState.ownedGirls.find(x => x.ID === id); if (g) g.isBusy = true; });
            updateGirlsBusyState(next.girlIds, true);
            gameState.expeditions.push(next);
            // Ререндер только карточек экспедиции
            renderActiveExpeditions();
        } else {
            // Освобождаем участниц и обновляем UI списков свободных
            exp.girlIds.forEach(id => {
                const g = gameState.ownedGirls.find(x => x.ID === id);
                if (g) g.isBusy = false;
            });
            updateGirlsBusyState(exp.girlIds, false);
            renderExpeditionGirls();
            renderFoodExpeditionGirls();
            renderActiveExpeditions();
            // Обновляем точки разведки при освобождении девушек
            renderScoutPoints();
        }
        saveGame();
    }

    function setupEventListeners() {
        ui.buttons.nav.forEach(button => {
            button.addEventListener('click', () => switchView(button.dataset.view));
        });
        if (ui.buttons.summon) ui.buttons.summon.addEventListener('click', summonGirl);
        if (ui.containers.girlsList) {
            ui.containers.girlsList.addEventListener('click', (event) => {
                const skillBtn = event.target.closest('.skill-up-btn');
                if (skillBtn) {
                    event.stopPropagation();
                    const cardEl = event.target.closest('.girl-card');
                    if (cardEl) openLevelModal(cardEl.dataset.id);
                    return;
                }
                const card = event.target.closest('.girl-card');
                if (card && !card.classList.contains('busy')) {
                    showGirlDetails(card.dataset.id);
                }
            });
        }
        ui.buttons.modalClose.forEach(button => button.addEventListener('click', hideModals));
        if (ui.modal.overlay) ui.modal.overlay.addEventListener('click', (e) => { if (e.target === ui.modal.overlay) hideModals(); });
        if (ui.girlSelectionModal.overlay) ui.girlSelectionModal.overlay.addEventListener('click', (e) => { if (e.target === ui.girlSelectionModal.overlay) hideModals(); });

        // Делегированный обработчик для кнопки прокачки в модалке деталей
        if (ui.modal && ui.modal.overlay) {
            ui.modal.overlay.addEventListener('click', (e) => {
                if (e.target.closest && e.target.closest('.skill-up-btn-modal')) {
                    const gid = ui.modal.currentGirlId;
                    if (gid) openLevelModal(gid);
                }
            });
        }

        const alertOverlay = document.getElementById('custom-alert-overlay');
        const alertCloseBtn = document.getElementById('custom-alert-close');
        if (alertOverlay && alertCloseBtn) {
            alertCloseBtn.addEventListener('click', hideCustomAlert);
            alertOverlay.addEventListener('click', (e) => { if (e.target === alertOverlay) hideCustomAlert(); });
        }

        if (ui.views.crafting) {
            ui.views.crafting.addEventListener('click', (event) => {
                const recipeCard = event.target.closest('.recipe-card');
                
                // Сворачивание/разворачивание рецепта по клику на заголовок
                if (event.target.closest('h4') && recipeCard) {
                    recipeCard.classList.toggle('collapsed');
                    return;
                }
                
                if (event.target.classList.contains('craft-button') && recipeCard && !recipeCard.classList.contains('disabled')) {
                    openGirlSelectionModal(recipeCard.dataset.recipeId);
                }
            });
        }
        
        // Обработчики фильтров и поиска для рецептов
        const searchInput = document.getElementById('recipe-search');
        const categorySelect = document.getElementById('recipe-category');
        const typeSelect = document.getElementById('recipe-type');
        const sortSelect = document.getElementById('recipe-sort');
        
        if (searchInput) {
            searchInput.addEventListener('input', renderRecipes);
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', renderRecipes);
        }
        if (typeSelect) {
            typeSelect.addEventListener('change', renderRecipes);
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', renderRecipes);
        }
        // Кнопки управления экспедициями (в обоих контейнерах)
        const attachExpHandlers = (container) => {
            if (!container) return;
            container.addEventListener('click', (e) => {
                const card = e.target.closest('.expedition-task-card');
                if (!card) return;
                const id = card.getAttribute('data-exp-id');
                const exp = gameState.expeditions.find(x => x.id === id);
                if (!exp) return;
                if (e.target.closest('.exp-auto-toggle')) {
                    exp.auto = !exp.auto;
                    renderActiveExpeditions();
                    saveGame();
                    return;
                }
                if (e.target.closest('.exp-repeat')) {
                    const current = exp.repeatCount || 0;
                    const nextCycle = current === 0 ? 1 : (current === 1 ? 3 : (current === 3 ? 5 : 0));
                    exp.repeatCount = nextCycle;
                    renderActiveExpeditions();
                    saveGame();
                    return;
                }
                if (e.target.closest('.exp-continue')) {
                    const consumption = expConfig?.consumption || {};
                    const consTickMs = Number(consumption.consumptionTickMs || 30000);
                    const consPerGirl = Number(consumption.foodPerGirlPerConsumption || 0);
                    const foodCost = (exp.girlIds?.length || 0) * consPerGirl;
                    if (exp.mode === 'dry_food' || exp.mode === 'scout' || foodCost <= 0) { exp.paused = false; renderActiveExpeditions(); return; }
                    if ((gameState.resources.food || 0) < foodCost) { showCustomAlert('Недостаточно еды для продолжения.'); return; }
                    gameState.resources.food -= foodCost;
                    exp.paused = false;
                    exp.nextFoodTick = Date.now() + consTickMs;
                    updateResourcesUI();
                    renderActiveExpeditions();
                    saveGame();
                    return;
                }
                if (e.target.closest('.exp-finish-now')) {
                    // Принудительное завершение: не моментально.
                    // Если в пути к точке — сразу разворачиваем назад, время возврата = уже пройденное время пути.
                    // Если сбор — прекращаем сбор и возвращаемся полное время пути.
                    const now = Date.now();
                    if (exp.phase === 'travel_to') {
                        const elapsedPhase = Math.max(0, now - (exp.phaseStartMs || now));
                        exp.phase = 'travel_back';
                        exp.phaseStartMs = now;
                        // Осталось ехать назад столько же, сколько уже проехали вперёд
                        const remainingReturn = Math.min(exp.travelTime || 0, elapsedPhase);
                        exp.duration = Math.max(exp.elapsedMs || 0, 0) + remainingReturn;
                    } else if (exp.phase === 'gathering') {
                        exp.phase = 'travel_back';
                        exp.phaseStartMs = now;
                        // Полное время пути назад
                        const remainingReturn = Math.max(0, exp.travelTime || 0);
                        exp.duration = Math.max(exp.elapsedMs || 0, 0) + remainingReturn;
                    } else {
                        // На всякий случай, если фаза неизвестна и не возврат — тоже переведём в возврат на полный путь
                        if (exp.phase !== 'travel_back') {
                            exp.phase = 'travel_back';
                            exp.phaseStartMs = now;
                            const remainingReturn = Math.max(0, exp.travelTime || 0);
                            exp.duration = Math.max(exp.elapsedMs || 0, 0) + remainingReturn;
                        }
                    }
                    renderActiveExpeditions();
                    saveGame();
                    return;
                }
            });
        };
        attachExpHandlers(ui.containers.activeExpeditions);
        attachExpHandlers(ui.containers.activeTasks);
        // Тоггл верхней панели ресурсов
        if (ui.buttons.headerToggle && ui.containers.headerResourcePanel) {
            const toggle = ui.buttons.headerToggle;
            const panel = ui.containers.headerResourcePanel;
            const backdrop = ui.containers.headerBackdrop;
            const setOpen = (open) => {
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                panel.classList.toggle('open', open);
                if (backdrop) backdrop.classList.toggle('hidden', !open);
            };
            toggle.addEventListener('click', () => {
                const open = toggle.getAttribute('aria-expanded') !== 'true';
                setOpen(open);
            });
            if (backdrop) backdrop.addEventListener('click', () => setOpen(false));
        }
        if (ui.girlSelectionModal.list) {
            ui.girlSelectionModal.list.addEventListener('click', (event) => {
                const girlItem = event.target.closest('.modal-girl-item');
                if (girlItem) startCrafting(girlItem.dataset.recipeId, girlItem.dataset.girlId);
            });
        }

        const attachAutoHandler = (container) => {
            if (!container) return;
            container.addEventListener('click', (event) => {
                const btn = event.target.closest('.auto-toggle');
                if (!btn) return;
                const card = event.target.closest('.active-task-card');
                if (!card) return;
                const taskId = card.getAttribute('data-task-id');
                const task = gameState.activeCrafts.find(t => t.id === taskId);
                if (!task) return;
                const idx = gameState.pinnedCrafts.findIndex(p => p.girlId === task.girlId && p.recipeId === task.recipeId);
                if (idx >= 0) {
                    gameState.pinnedCrafts.splice(idx, 1);
                } else {
                    gameState.pinnedCrafts.push({ girlId: task.girlId, recipeId: task.recipeId });
                    const girl = gameState.ownedGirls.find(g => g.ID === task.girlId);
                    if (girl) {
                        girl.isBusy = true;
                        updateGirlCardBusyState(task.girlId, true);
                    }
                }
                renderActiveCrafts();
                saveGame();
            });
        };
        attachAutoHandler(ui.containers.activeTasks);
        attachAutoHandler(ui.containers.activeTasksCraft);

        const attachWaitingHandlers = (container) => {
            if (!container) return;
            container.addEventListener('click', (event) => {
                const card = event.target.closest('.active-task-card');
                if (!card) return;
                const taskId = card.getAttribute('data-task-id');
                const task = gameState.activeCrafts.find(t => t.id === taskId);
                if (!task || !task.waiting) return;
                if (event.target.closest('.continue-wait')) {
                    const recipe = recipes[task.recipeId];
                    const canAfford = Object.entries(recipe.requires).every(([res, need]) => (gameState.resources[res] || 0) >= need);
                    if (!canAfford) { showCustomAlert('Недостаточно ресурсов для продолжения.'); return; }
                    gameState.activeCrafts = gameState.activeCrafts.filter(t => t.id !== task.id);
                    startCrafting(task.recipeId, task.girlId);
                    return;
                }
                if (event.target.closest('.remove-wait')) {
                    const pinIdx = gameState.pinnedCrafts.findIndex(p => p.girlId === task.girlId && p.recipeId === task.recipeId);
                    if (pinIdx >= 0) gameState.pinnedCrafts.splice(pinIdx, 1);
                    gameState.activeCrafts = gameState.activeCrafts.filter(t => t.id !== task.id);
                    const girl = gameState.ownedGirls.find(g => g.ID === task.girlId);
                    if (girl) {
                        girl.isBusy = false;
                        updateGirlCardBusyState(task.girlId, false);
                    }
                    renderActiveCrafts();
                    saveGame();
                }
            });
        };
        attachWaitingHandlers(ui.containers.activeTasks);
        attachWaitingHandlers(ui.containers.activeTasksCraft);

        if (ui.containers.expeditionGirls) {
            ui.containers.expeditionGirls.addEventListener('click', (e) => {
                const chip = e.target.closest('.exp-girl-chip');
                if (!chip) return;
                chip.classList.toggle('selected');
                updateExpeditionButtonLabel();
            });
        }
        if (ui.containers.foodExpeditionGirls) {
            ui.containers.foodExpeditionGirls.addEventListener('click', (e) => {
                const chip = e.target.closest('.exp-girl-chip');
                if (!chip) return;
                chip.classList.toggle('selected');
            });
        }

        const startBtn = document.getElementById('start-expedition');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const selectedChips = ui.containers.expeditionGirls ? Array.from(ui.containers.expeditionGirls.querySelectorAll('.exp-girl-chip.selected')) : [];
                if (selectedChips.length === 0) { showCustomAlert('Выберите хотя бы одну девушку для экспедиции.'); return; }
                const girlIds = selectedChips.map(ch => ch.dataset.girlId);
                const modeSel = document.getElementById('expedition-resource');
                const durSel = document.getElementById('expedition-duration');
                const distSel = document.getElementById('expedition-distance');
                const mode = modeSel ? modeSel.value : 'auto';
                const duration = durSel ? parseInt(durSel.value, 10) : 60000;
                const distance = distSel ? distSel.value : 'medium';
                startExpedition(girlIds, mode, duration, distance);
            });
            const modeSel = document.getElementById('expedition-resource');
            const durSel = document.getElementById('expedition-duration');
            const distSel = document.getElementById('expedition-distance');
            if (modeSel) modeSel.addEventListener('change', updateExpeditionButtonLabel);
            if (durSel) durSel.addEventListener('change', updateExpeditionButtonLabel);
            if (distSel) distSel.addEventListener('change', updateExpeditionButtonLabel);
            updateExpeditionButtonLabel();
        }

        const startFoodBtn = document.getElementById('start-food-expedition');
        if (startFoodBtn) {
            startFoodBtn.addEventListener('click', () => {
                const selectedChips = ui.containers.foodExpeditionGirls ? Array.from(ui.containers.foodExpeditionGirls.querySelectorAll('.exp-girl-chip.selected')) : [];
                if (selectedChips.length === 0) { showCustomAlert('Выберите хотя бы одну девушку для экспедиции.'); return; }
                const girlIds = selectedChips.map(ch => ch.dataset.girlId);
                startExpedition(girlIds, 'dry_food', 5000);
            });
        }

        // Обработчик кнопки сброса сохранений
        const resetBtn = document.getElementById('reset-save-button');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetSave);
        }
        
        // Обработчик клика на точки разведки — открываем выбор девушек (оба контейнера)
        const attachScoutHandlers = (container) => {
            if (!container) return;
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('.start-scout-btn');
                const card = e.target.closest('.scout-point-card');
                if (btn && card && !card.classList.contains('disabled')) {
                    const pointId = card.dataset.pointId;
                    if (pointId) openScoutSelection(pointId);
                }
            });
        };
        attachScoutHandlers(ui.containers.scoutPointsRegular);
        attachScoutHandlers(ui.containers.scoutPointsEquipment);

        // Тогглы сворачивания секций точек разведки
        const toggleReg = document.getElementById('toggle-scout-points-regular');
        const toggleEq = document.getElementById('toggle-scout-points-equipment');
        const setCollapsed = (btn, container, collapsed) => {
            if (!btn || !container) return;
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            container.style.display = collapsed ? 'none' : '';
            btn.textContent = collapsed ? 'Развернуть' : 'Свернуть';
        };
        if (toggleReg && ui.containers.scoutPointsRegular) {
            toggleReg.addEventListener('click', () => {
                const collapsed = toggleReg.getAttribute('aria-expanded') === 'true';
                setCollapsed(toggleReg, ui.containers.scoutPointsRegular, collapsed);
            });
        }
        if (toggleEq && ui.containers.scoutPointsEquipment) {
            toggleEq.addEventListener('click', () => {
                const collapsed = toggleEq.getAttribute('aria-expanded') === 'true';
                setCollapsed(toggleEq, ui.containers.scoutPointsEquipment, collapsed);
            });
        }
        
        // Клик по ресурсу внутри карточек рецептов (якорь к источникам)
        if (ui.containers.workshopRecipes) {
            ui.containers.workshopRecipes.addEventListener('click', (e) => {
                const chip = e.target.closest('.res-chip');
                if (chip && chip.dataset.res) {
                    showResourceInfo(chip.dataset.res);
                }
            });
        }
    }

    async function init() {
        try {
            const [girlsRes, recipesRes, expeditionsRes] = await Promise.all([
                fetch('girls.json'),
                fetch('recipes.json'),
                fetch('expeditions.json')
            ]);
            if (!girlsRes.ok) throw new Error('Не удалось загрузить girls.json.');
            if (!recipesRes.ok) throw new Error('Не удалось загрузить recipes.json.');
            if (!expeditionsRes.ok) throw new Error('Не удалось загрузить expeditions.json.');

            gameState.allGirlsData = await girlsRes.json();
            recipes = await recipesRes.json();
            expConfig = await expeditionsRes.json();
            // Перестраиваем источники ресурсов с учётом загруженных рецептов
            resourceSources = buildResourceSources();

            // Пытаемся загрузить сохранение
            const hasLoad = loadGame();

            // Если сохранения нет, даем стартовых персонажей
            if (!hasLoad) {
                const firstGirl = gameState.allGirlsData.find(g => g.ID === 'girl_029');
                const secondGirl = gameState.allGirlsData.find(g => g.ID === 'girl_180');
                const thirdGirl = gameState.allGirlsData.find(g => g.ID === 'girl_251');
                if (firstGirl) { ensureGirlProgressFields(firstGirl); gameState.ownedGirls.push(firstGirl); }
                if (secondGirl) { ensureGirlProgressFields(secondGirl); gameState.ownedGirls.push(secondGirl); }
                if (thirdGirl) { ensureGirlProgressFields(thirdGirl); gameState.ownedGirls.push(thirdGirl); }
            }

            renderHeaderResources();
            updateResourcesUI();
            renderOwnedGirls();
            renderRecipes();
            renderExpeditionGirls();
            renderFoodExpeditionGirls();
            renderActiveExpeditions();
            renderScoutPoints();

            setupEventListeners();

            ui.loadingScreen.style.opacity = '0';
            setTimeout(() => ui.loadingScreen.classList.add('hidden'), 500);

            setInterval(gameLoop, 1000);
            setInterval(expeditionTick, 2000);
            setInterval(saveGame, 30000); // Автосохранение каждые 30 секунд
        } catch (error) {
            ui.loadingScreen.innerHTML = `<p style="color: red; text-align: center;">Ошибка: ${error.message}</p>`;
        }
    }

    // ========================================
    // СИСТЕМА ЯКОРНЫХ ТОЧЕК ДЛЯ РЕСУРСОВ
    // ========================================
    
    function buildResourceSources() {
        const base = {
            wood: [
                { type: 'expedition', mode: 'wood', name: 'Экспедиция: Дерево', view: 'map' },
                { type: 'scout', id: 'haunted_forest', name: 'Проклятый лес', view: 'map' }
            ],
            stone: [
                { type: 'expedition', mode: 'stone', name: 'Экспедиция: Камень', view: 'map' },
                { type: 'scout', id: 'crystal_cave', name: 'Кристальная пещера', view: 'map' },
                { type: 'scout', id: 'forgotten_mine', name: 'Забытая шахта', view: 'map' }
            ],
            iron_ore: [
                { type: 'expedition', mode: 'iron_ore', name: 'Экспедиция: Железная руда', view: 'map' },
                { type: 'scout', id: 'crystal_cave', name: 'Кристальная пещера', view: 'map' },
                { type: 'scout', id: 'forgotten_mine', name: 'Забытая шахта', view: 'map' }
            ],
            herbs: [
                { type: 'expedition', mode: 'herbs', name: 'Экспедиция: Целебные травы', view: 'map' },
                { type: 'scout', id: 'haunted_forest', name: 'Проклятый лес', view: 'map' }
            ],
            hides: [
                { type: 'expedition', mode: 'hides', name: 'Экспедиция: Охота на зверей', view: 'map' }
            ],
            gems: [
                { type: 'expedition', mode: 'gems', name: 'Экспедиция: Драгоценные камни', view: 'map' }
            ],
            ancient_relics: [
                { type: 'expedition', mode: 'ancient_relics', name: 'Экспедиция: Древние артефакты', view: 'map' }
            ],
            esense: [
                { type: 'expedition', mode: 'esense', name: 'Экспедиция: Эссенция', view: 'map' }
            ],
            dry_food: [
                { type: 'expedition', mode: 'dry_food', name: 'Поиск еды (быстро)', view: 'map' }
            ]
        };
        // Добавляем крафтовые источники для всех ресурсов, которые производятся рецептами
        Object.entries(recipes || {}).forEach(([id, r]) => {
            const produces = r?.produces || {};
            Object.keys(produces).forEach(resKey => {
                if (!base[resKey]) base[resKey] = [];
                base[resKey].push({ type: 'craft', recipe: id, name: `Крафт: ${r.name}`, view: 'crafting' });
            });
        });
        return base;
    }
    
    let resourceSources = buildResourceSources();

    function showResourceInfo(resourceKey) {
        const sources = resourceSources[resourceKey];
        if (!sources || sources.length === 0) {
            showCustomAlert(`Источники для "${resourceKey}" пока не добавлены`);
            return;
        }

        const modal = document.getElementById('resource-info-modal');
        const body = document.getElementById('resource-info-body');
        
        const resourceData = resourceMeta[resourceKey];
        
        body.innerHTML = `
            <h3>📍 Где добыть: ${resourceData.name} ${resourceData.icon}</h3>
            <div class="resource-sources-list">
                ${sources.map(source => `
                    <div class="resource-source-item">
                        <div class="source-info">
                            <span class="source-icon">${source.type === 'expedition' ? '🗺️' : source.type === 'scout' ? '⚔️' : '⚒️'}</span>
                            <span class="source-name">${source.name}</span>
                        </div>
                        <button class="action-button small-btn goto-btn" data-view="${source.view}" data-type="${source.type}" data-id="${source.mode || source.recipe || source.id}">
                            Показать →
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Обработчики кнопок "Показать"
        body.querySelectorAll('.goto-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                const type = btn.dataset.type;
                const id = btn.dataset.id;
                
                // Переключаем вид
                switchView(view + '-view');
                // Скрываем фон и закрываем панель ресурсов, если были открыты
                if (ui.containers.headerBackdrop) ui.containers.headerBackdrop.classList.add('hidden');
                if (ui.containers.headerResourcePanel) ui.containers.headerResourcePanel.classList.remove('open');
                if (ui.buttons.headerToggle) ui.buttons.headerToggle.setAttribute('aria-expanded', 'false');
                
                // Подсвечиваем нужный элемент
                setTimeout(() => {
                    if (type === 'expedition' && view === 'map') {
                        const select = document.getElementById('expedition-resource');
                        if (select) {
                            select.value = id;
                            select.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            select.style.outline = '3px solid var(--accent-color)';
                            setTimeout(() => { select.style.outline = ''; }, 2000);
                        }
                    } else if (type === 'scout' && view === 'map') {
                        const scoutCard = document.querySelector(`[data-scout-id="${id}"]`);
                        if (scoutCard) {
                            scoutCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            scoutCard.style.outline = '3px solid var(--accent-color)';
                            setTimeout(() => { scoutCard.style.outline = ''; }, 2000);
                        }
                    } else if (type === 'craft' && view === 'crafting') {
                        const craftCard = document.querySelector(`[data-recipe-id="${id}"]`);
                        if (craftCard) {
                            craftCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            craftCard.style.outline = '3px solid var(--accent-color)';
                            setTimeout(() => { craftCard.style.outline = ''; }, 2000);
                        }
                    }
                }, 300);
                
                modal.classList.add('hidden');
            });
        });
        
        
        // Закрытие по крестику
        const closeBtn = modal.querySelector('.modal-close-button');
        if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
        
        // Закрытие по фону
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        }, { once: true });
    }

    // ========================================
    // ИНТЕГРАЦИЯ ЭКИПИРОВКИ В ЭКСПЕДИЦИИ
    // ========================================

    // Обновляем завершение scout-экспедиции для добычи экипировки
    function finishScoutExpedition(expId) {
        const expedition = gameState.expeditions.find(e => e.id === expId);
        // В актуальной модели поле называется scoutPoint, а конфиг — expConfig
        if (!expedition || !expedition.scoutPoint) return;

        const scoutData = (expConfig?.scoutPoints || {})[expedition.scoutPoint];
        if (!scoutData) return;

        // Начисляем награды
        for (const [resKey, range] of Object.entries(scoutData.rewards)) {
            const amount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            gameState.resources[resKey] = (gameState.resources[resKey] || 0) + amount;
            addResourceEvent(resKey, amount);
        }

        // НОВОЕ: Дроп экипировки
        if (scoutData.isEquipmentExpedition) {
            const girls = expedition.girlIds.map(id => gameState.ownedGirls.find(g => g.ID === id)).filter(Boolean);
            const avgLuck = girls.length > 0 ? girls.reduce((sum, g) => sum + (g.stats.luck || 0), 0) / girls.length : 0;
            const avgStrength = girls.length > 0 ? girls.reduce((sum, g) => sum + (g.stats.strength || 0), 0) / girls.length : 0;
            const avgDefense = girls.length > 0 ? girls.reduce((sum, g) => sum + (g.stats.defense || 0), 0) / girls.length : 0;
            const avgMagic = girls.length > 0 ? girls.reduce((sum, g) => sum + (g.stats.magic || 0), 0) / girls.length : 0;
            const difficulty = scoutData.difficulty || 1;
            const duration = (scoutData.travelTimeMs || 0) + (scoutData.gatherDuration || 0);

            // Если в конфиге указан явный шанс дропа — применяем его как внешний гейт
            const cfgChance = typeof scoutData.equipmentDropChance === 'number' ? scoutData.equipmentDropChance : null;
            if (cfgChance === null || Math.random() < Math.max(0, Math.min(1, cfgChance))) {
                const equipment = Equipment.generateEquipmentDrop(difficulty, avgLuck, {
                    girlCount: girls.length,
                    duration: duration,
                    avgStrength: avgStrength,
                    avgDefense: avgDefense,
                    avgMagic: avgMagic
                });
                if (equipment) {
                    gameState.equipmentInventory.push(equipment);
                    const rarityName = Equipment.RARITY_LEVELS[equipment.rarity].name;
                    showCustomAlert(`🎉 Найдена экипировка: ${equipment.name} (${rarityName}, ${equipment.stars}★)!`);
                }
            }
        }

        // Освобождаем девушек
        expedition.girlIds.forEach(girlId => {
            const girl = gameState.ownedGirls.find(g => g.ID === girlId);
            if (girl) {
                girl.isBusy = false;
                addExperience(girl, 3); // Больше опыта за опасную экспедицию
            }
        });

        // Удаляем экспедицию
        gameState.expeditions = gameState.expeditions.filter(e => e.id !== expId);

        updateResourcesUI();
        renderActiveExpeditions();
        renderExpeditionGirls();
        renderScoutPoints();
        saveGame();
    }

    // --- ЗАПУСК ИГРЫ ---
    init();
});