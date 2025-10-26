(function(global) {
  'use strict';

  // ========================================
  // СИСТЕМА ЭКИПИРОВКИ
  // ========================================

  // Типы экипировки (6 слотов)
  const EQUIPMENT_TYPES = {
    weapon: { name: 'Оружие', icon: '⚔️', category: 'combat' },
    armor: { name: 'Броня', icon: '🛡️', category: 'combat' },
    accessory: { name: 'Аксессуар', icon: '💍', category: 'combat' },
    tool: { name: 'Инструмент', icon: '🔨', category: 'social' },
    clothing: { name: 'Одежда', icon: '👗', category: 'social' },
    charm: { name: 'Талисман', icon: '🔮', category: 'social' }
  };

  // 10 уровней редкости
  const RARITY_LEVELS = [
    { name: 'Обычная', color: '#95a5a6', statBonus: 1.0, modChance: 0 },      // 0
    { name: 'Хорошая', color: '#7fb069', statBonus: 1.2, modChance: 0.1 },    // 1
    { name: 'Качественная', color: '#52b788', statBonus: 1.4, modChance: 0.2 }, // 2
    { name: 'Отличная', color: '#3498db', statBonus: 1.7, modChance: 0.3 },   // 3
    { name: 'Редкая', color: '#9b59b6', statBonus: 2.0, modChance: 0.4 },     // 4
    { name: 'Эпическая', color: '#e74c3c', statBonus: 2.5, modChance: 0.5 },  // 5
    { name: 'Легендарная', color: '#f39c12', statBonus: 3.0, modChance: 0.6 }, // 6
    { name: 'Мифическая', color: '#e67e22', statBonus: 3.8, modChance: 0.7 }, // 7
    { name: 'Божественная', color: '#d4af37', statBonus: 4.8, modChance: 0.8 }, // 8
    { name: 'Трансцендентная', color: '#ff1493', statBonus: 6.0, modChance: 1.0 } // 9
  ];

  // Базовые статы для экипировки
  const BASE_STATS = {
    combat: ['strength', 'defense', 'luck', 'magic'],
    social: ['harvest', 'craft_speed', 'alchemy_speed', 'morale', 'food']
  };

  // Возможные модификаторы (проценты)
  const MODIFIER_POOL = [
    { stat: 'strength', name: 'Сила', min: 5, max: 25 },
    { stat: 'defense', name: 'Защита', min: 5, max: 25 },
    { stat: 'luck', name: 'Удача', min: 3, max: 15 },
    { stat: 'magic', name: 'Магия', min: 5, max: 20 },
    { stat: 'harvest', name: 'Сбор', min: 5, max: 25 },
    { stat: 'craft_speed', name: 'Скорость крафта', min: 3, max: 15 },
    { stat: 'alchemy_speed', name: 'Скорость алхимии', min: 3, max: 15 },
    { stat: 'morale', name: 'Мораль', min: 5, max: 20 },
    { stat: 'food', name: 'Кулинария', min: 5, max: 25 },
    { stat: 'rare_find', name: 'Редкая находка', min: 2, max: 10 },
    { stat: 'repair', name: 'Ремонт', min: 5, max: 20 }
  ];

  /**
   * Генерирует случайную экипировку
   * @param {string} type - Тип экипировки (weapon, armor, etc.)
   * @param {number} rarity - Уровень редкости (0-9)
   * @param {number} stars - Уровень звёзд (0-6)
   * @returns {Object} - Объект экипировки
   */
  function generateEquipment(type, rarity = 0, stars = 0) {
    const typeInfo = EQUIPMENT_TYPES[type];
    const rarityInfo = RARITY_LEVELS[rarity];
    
    // Базовые статы зависят от категории
    const category = typeInfo.category;
    const baseStatPool = BASE_STATS[category];
    
    // Выбираем основной стат
    const mainStat = baseStatPool[Math.floor(Math.random() * baseStatPool.length)];
    const mainStatValue = Math.floor((10 + rarity * 5) * rarityInfo.statBonus);
    
    // Генерируем модификаторы (количество зависит от звёзд)
    const modCount = Math.min(stars, 6); // До 6 модификаторов
    const modifiers = [];
    
    if (modCount > 0 && Math.random() < rarityInfo.modChance) {
      const availableMods = [...MODIFIER_POOL];
      for (let i = 0; i < modCount && availableMods.length > 0; i++) {
        const idx = Math.floor(Math.random() * availableMods.length);
        const mod = availableMods.splice(idx, 1)[0];
        
        // Процент зависит от редкости и звёзд
        const percentValue = Math.floor(
          mod.min + Math.random() * (mod.max - mod.min) * 
          (1 + rarity * 0.1) * (1 + stars * 0.15)
        );
        
        modifiers.push({
          stat: mod.stat,
          name: mod.name,
          value: percentValue,
          isPercent: true
        });
      }
    }
    
    return {
      id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      category: category,
      name: generateEquipmentName(type, rarity),
      rarity: rarity,
      stars: stars,
      mainStat: {
        stat: mainStat,
        value: mainStatValue
      },
      modifiers: modifiers,
      equipped: false,
      girlId: null
    };
  }

  /**
 * Генерирует название для экипировки
 */
function generateEquipmentName(type, rarity) {
  const prefixes = {
    // Мужской род
    masculine: [
      ['Простой', 'Крепкий', 'Прочный', 'Острый', 'Надёжный', 'Изящный', 'Великолепный', 'Древний', 'Священный', 'Запредельный'],
      ['', 'Усиленный', 'Качественный', 'Превосходный', 'Редкий', 'Эпический', 'Легендарный', 'Мифический', 'Божественный', 'Трансцендентный']
    ],
    // Женский род
    feminine: [
      ['Простая', 'Крепкая', 'Прочная', 'Острая', 'Надёжная', 'Изящная', 'Великолепная', 'Древняя', 'Священная', 'Запредельная'],
      ['', 'Усиленная', 'Качественная', 'Превосходная', 'Редкая', 'Эпическая', 'Легендарная', 'Мифическая', 'Божественная', 'Трансцендентная']
    ],
    // Средний род
    neuter: [
      ['Простое', 'Крепкое', 'Прочное', 'Острое', 'Надёжное', 'Изящное', 'Великолепное', 'Древнее', 'Священное', 'Запредельное'],
      ['', 'Усиленное', 'Качественное', 'Превосходное', 'Редкое', 'Эпическое', 'Легендарное', 'Мифическое', 'Божественное', 'Трансцендентное']
    ]
  };

  const typeNames = {
    weapon: ['Оружие', 'Клинок', 'Меч', 'Копьё', 'Посох'],
    armor: ['Доспех', 'Броня', 'Кираса', 'Латы', 'Защита'],
    accessory: ['Кольцо', 'Ожерелье', 'Браслет', 'Серьги', 'Амулет'],
    tool: ['Инструмент', 'Молот', 'Топор', 'Пила', 'Кирка'],
    clothing: ['Одежда', 'Платье', 'Роба', 'Мантия', 'Туника'],
    charm: ['Талисман', 'Оберег', 'Символ', 'Тотем', 'Реликвия']
  };

  // Определение пола существительного
  const gender = (() => {
    if (type === 'armor' || type === 'accessory') return 'feminine'; // Большинство типов женского рода
    if (type === 'weapon') return 'masculine'; // Мечи, клинки — мужского рода
    return 'neuter'; // Остальное — средний род
  })();

  const prefixArray = prefixes[gender][rarity < 5 ? 0 : 1];
  const typeName = typeNames[type][Math.floor(Math.random() * typeNames[type].length)];
  const prefix = prefixArray[rarity];

  return prefix ? `${prefix} ${typeName}` : typeName;
}

  /**
   * Экипирует предмет на девушку
   * @param {Object} girl - Объект девушки
   * @param {Object} equipment - Объект экипировки
   * @returns {boolean} - Успешность экипировки
   */
  function equipItem(girl, equipment) {
    if (!girl.equipment) {
      girl.equipment = [];
    }
    
    // Проверка: максимум 3 предмета
    if (girl.equipment.length >= 3) {
      return false;
    }
    
    // Проверка: уже экипирован этот предмет
    if (girl.equipment.find(eq => eq.id === equipment.id)) {
      return false;
    }
    
    equipment.equipped = true;
    equipment.girlId = girl.ID;
    girl.equipment.push(equipment);
    
    return true;
  }

  /**
   * Снимает предмет с девушки
   * @param {Object} girl - Объект девушки
   * @param {string} equipmentId - ID экипировки
   * @returns {Object|null} - Снятый предмет или null
   */
  function unequipItem(girl, equipmentId) {
    if (!girl.equipment) return null;
    
    const idx = girl.equipment.findIndex(eq => eq.id === equipmentId);
    if (idx === -1) return null;
    
    const item = girl.equipment.splice(idx, 1)[0];
    item.equipped = false;
    item.girlId = null;
    
    return item;
  }

  /**
   * Вычисляет бонусы от экипировки
   * @param {Object} girl - Объект девушки
   * @returns {Object} - Объект с бонусами к статам
   */
  function calculateEquipmentBonuses(girl) {
    if (!girl.equipment || girl.equipment.length === 0) {
      return {};
    }
    
    const bonuses = {};
    
    girl.equipment.forEach(eq => {
      // Основной стат
      if (eq.mainStat) {
        bonuses[eq.mainStat.stat] = (bonuses[eq.mainStat.stat] || 0) + eq.mainStat.value;
      }
      
      // Модификаторы (проценты)
      if (eq.modifiers && eq.modifiers.length > 0) {
        eq.modifiers.forEach(mod => {
          const key = mod.stat + '_percent';
          bonuses[key] = (bonuses[key] || 0) + mod.value;
        });
      }
    });
    
    return bonuses;
  }

  /**
   * Применяет бонусы от экипировки к статам девушки
   * @param {Object} girl - Объект девушки
   * @returns {Object} - Финальные статы с учётом экипировки
   */
  function applyEquipmentBonuses(girl) {
    const bonuses = calculateEquipmentBonuses(girl);
    const finalStats = { ...girl.stats };
    
    // Применяем плоские бонусы
    Object.keys(bonuses).forEach(key => {
      if (!key.endsWith('_percent')) {
        finalStats[key] = (finalStats[key] || 0) + bonuses[key];
      }
    });
    
    // Применяем процентные бонусы
    Object.keys(bonuses).forEach(key => {
      if (key.endsWith('_percent')) {
        const statName = key.replace('_percent', '');
        if (finalStats[statName]) {
          finalStats[statName] = Math.floor(finalStats[statName] * (1 + bonuses[key] / 100));
        }
      }
    });
    
    return finalStats;
  }

  /**
   * Генерирует дроп экипировки для экспедиции
   * @param {number} difficulty - Сложность экспедиции (0-6)
   * @param {number} luck - Средняя удача персонажей
   * @param {Object} options - Дополнительные параметры
   * @param {number} options.girlCount - Количество девушек в экспедиции
   * @param {number} options.duration - Длительность экспедиции в мс
   * @param {number} options.avgStrength - Средняя сила
   * @param {number} options.avgDefense - Средняя защита
   * @param {number} options.avgMagic - Средняя магия
   * @returns {Object|null} - Сгенерированная экипировка или null
   */
  function generateEquipmentDrop(difficulty = 0, luck = 0, options = {}) {
    const {
      girlCount = 1,
      duration = 0,
      avgStrength = 0,
      avgDefense = 0,
      avgMagic = 0
    } = options;

    // === МОДИФИКАТОРЫ ШАНСА ДРОПА ===
    
    // Базовый шанс дропа 30% + удача
    let dropChance = 0.3 + (luck / 100) * 0.3;
    
    // Бонус от сложности: +5% за каждый уровень
    dropChance += difficulty * 0.05;
    
    // Бонус от количества девушек: +3% за каждую девушку после первой
    dropChance += (girlCount - 1) * 0.03;
    
    // Бонус от длительности: +1% за каждую минуту
    const durationMinutes = duration / 60000;
    dropChance += durationMinutes * 0.01;
    
    // Бонус от характеристик: среднее значение всех статов даёт до +10%
    const avgStats = (avgStrength + avgDefense + avgMagic) / 3;
    dropChance += (avgStats / 100) * 0.1;
    
    // Ограничиваем максимум 95%
    dropChance = Math.min(0.95, dropChance);
    
    if (Math.random() > dropChance) {
      return null;
    }
    
    // === МОДИФИКАТОРЫ РЕДКОСТИ ===
    
    const rarityRoll = Math.random();
    let rarity = 0;
    
    const rarityChances = [
      0.50, // 0 - Обычная (50%)
      0.25, // 1 - Хорошая (25%)
      0.12, // 2 - Качественная (12%)
      0.06, // 3 - Отличная (6%)
      0.03, // 4 - Редкая (3%)
      0.02, // 5 - Эпическая (2%)
      0.01, // 6 - Легендарная (1%)
      0.006, // 7 - Мифическая (0.6%)
      0.003, // 8 - Божественная (0.3%)
      0.001  // 9 - Трансцендентная (0.1%)
    ];
    
    // Модификатор редкости от сложности (сильнее влияние)
    let rarityBonus = difficulty * 0.15;
    
    // Бонус от количества девушек: +5% за каждую девушку
    rarityBonus += (girlCount - 1) * 0.05;
    
    // Бонус от длительности: +2% за каждую минуту
    rarityBonus += durationMinutes * 0.02;
    
    // Бонус от удачи: до +20% при 100 удаче
    rarityBonus += (luck / 100) * 0.2;
    
    // Бонус от магии (влияет на редкость): до +15% при 100 магии
    rarityBonus += (avgMagic / 100) * 0.15;
    
    let cumulative = 0;
    
    for (let i = rarityChances.length - 1; i >= 0; i--) {
      cumulative += rarityChances[i] * (1 + rarityBonus * (rarityChances.length - i));
      if (rarityRoll * (1 + rarityBonus * 3) >= (1 - cumulative)) {
        rarity = i;
        break;
      }
    }
    
    // === МОДИФИКАТОРЫ ЗВЁЗД ===
    
    const starRoll = Math.random();
    let stars = 0;
    
    // Базовые пороги для звёзд
    const starThresholds = [0.5, 0.7, 0.85, 0.93, 0.97, 0.99];
    
    // Модификатор от характеристик
    const statBonus = (avgStrength + avgDefense) / 200; // до -0.1 сдвига порогов
    
    for (let i = 0; i < starThresholds.length; i++) {
      if (starRoll > (starThresholds[i] - statBonus)) {
        stars = i + 1;
      }
    }
    
    // Дополнительные звёзды от сложности
    stars = Math.min(6, stars + Math.floor(difficulty / 2));
    
    // Бонус звезды от количества девушек (шанс)
    if (girlCount >= 4 && Math.random() < 0.2) {
      stars = Math.min(6, stars + 1);
    }
    
    // Случайный тип экипировки
    const types = Object.keys(EQUIPMENT_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    return generateEquipment(type, rarity, stars);
  }

  // Экспорт
  global.Equipment = {
    EQUIPMENT_TYPES: EQUIPMENT_TYPES,
    RARITY_LEVELS: RARITY_LEVELS,
    generateEquipment: generateEquipment,
    equipItem: equipItem,
    unequipItem: unequipItem,
    calculateEquipmentBonuses: calculateEquipmentBonuses,
    applyEquipmentBonuses: applyEquipmentBonuses,
    generateEquipmentDrop: generateEquipmentDrop
  };
})(typeof window !== 'undefined' ? window : globalThis);
