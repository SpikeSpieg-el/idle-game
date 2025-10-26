(function(global){
  // Конфигурация статов и их влияние на геймплей
  const STAT_INFO = {
    harvest: { name: 'Сбор', icon: '🌾', desc: 'Увеличивает добычу дерева, еды, трав, гемов' },
    luck: { name: 'Удача', icon: '🍀', desc: 'Шанс критической добычи и редких находок' },
    repair: { name: 'Ремонт', icon: '🔧', desc: 'Увеличивает добычу камня и железной руды' },
    magic: { name: 'Магия', icon: '✨', desc: 'Увеличивает добычу эссенции и артефактов' },
    craft_speed: { name: 'Скорость крафта', icon: '⚒️', desc: 'Ускоряет мастерскую (макс. -80% времени)' },
    alchemy_speed: { name: 'Алхимия', icon: '🧪', desc: 'Ускоряет алхимию (макс. -80% времени)' },
    morale: { name: 'Мораль', icon: '💪', desc: 'Снижает расход еды в экспедициях' },
    defense: { name: 'Защита', icon: '🛡️', desc: 'Снижает риск потерь в опасных местах' },
    rare_find: { name: 'Чутьё', icon: '🔍', desc: 'Шанс найти бонусные ресурсы' },
    food: { name: 'Кулинария', icon: '🍲', desc: 'Увеличивает выход готовой еды' },
    strength: { name: 'Сила', icon: '💥', desc: 'Увеличивает добычу руды и шкур' }
  };

  function ensureLevelingFields(g){
    if (!g || typeof g !== 'object') return g;
    if (typeof g.skillPoints !== 'number') g.skillPoints = 0;
    if (typeof g.rankBonus !== 'number') g.rankBonus = 0;
    if (!Array.isArray(g.unlockedStats)) g.unlockedStats = [];
    if (typeof g.starRank !== 'number') g.starRank = 0;
    if (!g.stats || typeof g.stats !== 'object') g.stats = {};
    if (typeof g.specialization !== 'string') g.specialization = 'none';
    if (typeof g.passiveBonuses !== 'object') g.passiveBonuses = {};
    return g;
  }

  function spendPoints(g, cost){
    ensureLevelingFields(g);
    if ((g.skillPoints|0) < cost) return false;
    g.skillPoints -= cost;
    return true;
  }

  /**
   * Конвертирует кристаллы призыва в очки навыков
   * @param {Object} girl - Объект девушки
   * @param {number} crystalAmount - Количество кристаллов для обмена
   * @param {number} availableCrystals - Доступное количество кристаллов
   * @returns {Object} - {success: boolean, crystalsUsed: number, pointsGained: number, message: string}
   */
  function convertCrystalsToSkillPoints(girl, crystalAmount, availableCrystals) {
    const rate = 3; // 1 кристалл = 3 SP
    
    if (crystalAmount < 1) {
      return { success: false, message: 'Укажите корректное количество кристаллов' };
    }
    
    if (crystalAmount > availableCrystals) {
      return { success: false, message: 'Недостаточно кристаллов призыва' };
    }
    
    const pointsToAdd = crystalAmount * rate;
    girl.skillPoints = (girl.skillPoints || 0) + pointsToAdd;
    
    return {
      success: true,
      crystalsUsed: crystalAmount,
      pointsGained: pointsToAdd,
      message: `Получено ${pointsToAdd} очков навыка!`
    };
  }

  // Улучшенная инфузия статов с динамической ценой
  function applyStatInfusion(g, statKey, amount){
    ensureLevelingFields(g);
    var amt = typeof amount === 'number' ? amount : 1;
    const currentValue = g.stats[statKey] || 0;
    
    // Динамическая цена: каждые 20 очков стата - +1 к стоимости
    const baseCost = 1;
    const additionalCost = Math.floor(currentValue / 20);
    const totalCost = baseCost + additionalCost;
    
    if (!spendPoints(g, totalCost)) return false;
    if (typeof g.stats[statKey] !== 'number') g.stats[statKey] = 0;
    g.stats[statKey] += amt;
    if (!g.unlockedStats.includes(statKey)) g.unlockedStats.push(statKey);
    
    // Проверка синергий и пассивных бонусов
    updatePassiveBonuses(g);
    
    return true;
  }

  // Массовая инфузия (вложить несколько очков за раз)
  function applyBulkStatInfusion(g, statKey, points){
    ensureLevelingFields(g);
    let totalCost = 0;
    let currentValue = g.stats[statKey] || 0;
    
    // Подсчет общей стоимости
    for (let i = 0; i < points; i++) {
      const baseCost = 1;
      const additionalCost = Math.floor((currentValue + i) / 20);
      totalCost += baseCost + additionalCost;
    }
    
    if (!spendPoints(g, totalCost)) return false;
    if (typeof g.stats[statKey] !== 'number') g.stats[statKey] = 0;
    g.stats[statKey] += points;
    if (!g.unlockedStats.includes(statKey)) g.unlockedStats.push(statKey);
    
    updatePassiveBonuses(g);
    return true;
  }

  // Подсчет стоимости инфузии
  function getStatInfusionCost(g, statKey, points){
    const currentValue = g.stats[statKey] || 0;
    let totalCost = 0;
    
    for (let i = 0; i < (points || 1); i++) {
      const baseCost = 1;
      const additionalCost = Math.floor((currentValue + i) / 20);
      totalCost += baseCost + additionalCost;
    }
    
    return totalCost;
  }

  // Улучшение ранга - дает бонус ко всем действиям
  function improveRank(g){
    ensureLevelingFields(g);
    const currentRank = g.rankBonus || 0;
    // Динамическая стоимость: 5 + (текущий_ранг * 3)
    const cost = 5 + Math.floor(currentRank * 3);
    
    if (!spendPoints(g, cost)) return false;
    g.rankBonus = (g.rankBonus || 0) + 1;
    
    // Улучшение ранга дает +5% ко всем базовым статам
    const unlocked = g.unlockedStats || [];
    unlocked.forEach(stat => {
      if (g.stats[stat]) {
        g.stats[stat] = Math.floor(g.stats[stat] * 1.05);
      }
    });
    
    updatePassiveBonuses(g);
    return true;
  }

  function getRankImproveCost(g){
    const currentRank = g.rankBonus || 0;
    return 5 + Math.floor(currentRank * 3);
  }

  // Разблокировка нового стата - дает больший стартовый бонус
  function unlockExtraStat(g, statKey){
    ensureLevelingFields(g);
    
    // Если стат уже разблокирован, нельзя разблокировать снова
    if (g.unlockedStats && g.unlockedStats.includes(statKey)) {
      return false;
    }
    
    // Стоимость зависит от количества уже разблокированных статов
    const unlockedCount = (g.unlockedStats || []).length;
    const cost = 8 + (unlockedCount * 2);
    
    if (!spendPoints(g, cost)) return false;
    
    // Даём хороший стартовый бонус
    const startValue = 5 + Math.floor(g.level || 0);
    if (typeof g.stats[statKey] !== 'number') g.stats[statKey] = startValue;
    else g.stats[statKey] += startValue;
    
    if (!g.unlockedStats.includes(statKey)) g.unlockedStats.push(statKey);
    
    updatePassiveBonuses(g);
    return true;
  }

  function getUnlockStatCost(g){
    const unlockedCount = (g.unlockedStats || []).length;
    return 8 + (unlockedCount * 2);
  }

  // Увеличение звездного уровня - мощный бонус
  function increaseStarLevel(g){
    ensureLevelingFields(g);
    const currentStars = g.starRank || 0;
    const cost = 12 + (currentStars * 4);
    
    if (!spendPoints(g, cost)) return false;
    g.starRank = (g.starRank || 0) + 1;
    
    // Каждая звезда дает +2 ко всем разблокированным статам
    const unlocked = g.unlockedStats || [];
    unlocked.forEach(stat => {
      if (typeof g.stats[stat] === 'number') {
        g.stats[stat] += 2;
      }
    });
    
    updatePassiveBonuses(g);
    return true;
  }

  function getStarLevelCost(g){
    const currentStars = g.starRank || 0;
    return 12 + (currentStars * 4);
  }

  function parseRarityStars(rarity){
    if (typeof rarity !== 'string') return 0;
    var m = rarity.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function setRarityStars(g, stars){
    var s = Math.max(1, Math.min(6, stars|0));
    g.rarity = s + '★';
  }

  // Повышение редкости - самое дорогое улучшение, но очень сильное
  function upgradeRarityStar(g){
    ensureLevelingFields(g);
    var current = parseRarityStars(g.rarity);
    
    // Нельзя поднять выше 6 звезд
    if (current >= 6) return false;
    
    // Динамическая стоимость
    const cost = 25 + (current * 10);
    
    if (!spendPoints(g, cost)) return false;
    setRarityStars(g, current + 1);
    
    // Повышение редкости даёт большой буст
    if (Array.isArray(g.unlockedStats)){
      for (var i=0;i<g.unlockedStats.length;i++){
        var k = g.unlockedStats[i];
        if (typeof g.stats[k] !== 'number') g.stats[k] = 0;
        // Бонус зависит от новой редкости
        g.stats[k] += 3 + current;
      }
    }
    
    // Повышение редкости также дает skillPoints
    g.skillPoints = (g.skillPoints || 0) + (current + 1);
    
    updatePassiveBonuses(g);
    return true;
  }

  function getRarityUpgradeCost(g){
    var current = parseRarityStars(g.rarity);
    if (current >= 6) return Infinity;
    return 25 + (current * 10);
  }

  // Выбор специализации - даёт уникальные бонусы
  function setSpecialization(g, specType){
    ensureLevelingFields(g);
    const cost = 20;
    
    // Можно выбрать специализацию только один раз
    if (g.specialization && g.specialization !== 'none') {
      return false;
    }
    
    if (!spendPoints(g, cost)) return false;
    
    g.specialization = specType;
    
    // Бонусы в зависимости от специализации
    switch(specType) {
      case 'gatherer': // Собиратель
        g.stats.harvest = (g.stats.harvest || 0) + 15;
        g.stats.luck = (g.stats.luck || 0) + 10;
        if (!g.unlockedStats.includes('harvest')) g.unlockedStats.push('harvest');
        if (!g.unlockedStats.includes('luck')) g.unlockedStats.push('luck');
        break;
      case 'crafter': // Мастер
        g.stats.craft_speed = (g.stats.craft_speed || 0) + 20;
        g.stats.repair = (g.stats.repair || 0) + 10;
        if (!g.unlockedStats.includes('craft_speed')) g.unlockedStats.push('craft_speed');
        if (!g.unlockedStats.includes('repair')) g.unlockedStats.push('repair');
        break;
      case 'alchemist': // Алхимик
        g.stats.alchemy_speed = (g.stats.alchemy_speed || 0) + 20;
        g.stats.magic = (g.stats.magic || 0) + 10;
        if (!g.unlockedStats.includes('alchemy_speed')) g.unlockedStats.push('alchemy_speed');
        if (!g.unlockedStats.includes('magic')) g.unlockedStats.push('magic');
        break;
      case 'warrior': // Воин
        g.stats.strength = (g.stats.strength || 0) + 15;
        g.stats.defense = (g.stats.defense || 0) + 15;
        if (!g.unlockedStats.includes('strength')) g.unlockedStats.push('strength');
        if (!g.unlockedStats.includes('defense')) g.unlockedStats.push('defense');
        break;
      case 'support': // Поддержка
        g.stats.morale = (g.stats.morale || 0) + 15;
        g.stats.food = (g.stats.food || 0) + 15;
        if (!g.unlockedStats.includes('morale')) g.unlockedStats.push('morale');
        if (!g.unlockedStats.includes('food')) g.unlockedStats.push('food');
        break;
    }
    
    updatePassiveBonuses(g);
    return true;
  }

  // Обновление пассивных бонусов
  function updatePassiveBonuses(g){
    if (!g.passiveBonuses) g.passiveBonuses = {};
    
    // Синергия между статами
    const luck = g.stats.luck || 0;
    const harvest = g.stats.harvest || 0;
    const magic = g.stats.magic || 0;
    
    // Luck даёт шанс на критические находки
    g.passiveBonuses.critChance = Math.min(50, luck * 0.5); // макс 50%
    
    // Высокий harvest + luck = бонус к rare_find
    if (harvest > 30 && luck > 30) {
      g.stats.rare_find = (g.stats.rare_find || 0) + Math.floor((harvest + luck) / 20);
    }
    
    // Morale снижает расход еды
    const morale = g.stats.morale || 0;
    g.passiveBonuses.foodCostReduction = Math.min(40, morale * 0.4); // макс 40%
    
    // Defense снижает урон/потери
    const defense = g.stats.defense || 0;
    g.passiveBonuses.damageReduction = Math.min(50, defense * 0.5); // макс 50%
    
    // Food увеличивает выход готовой еды
    const food = g.stats.food || 0;
    g.passiveBonuses.foodBonus = Math.min(100, food * 1.0); // макс +100%
    
    // Rare_find увеличивает шанс бонусных ресурсов
    const rareFind = g.stats.rare_find || 0;
    g.passiveBonuses.bonusResourceChance = Math.min(30, rareFind * 0.3); // макс 30%
  }

  function getAffordableActions(g){
    ensureLevelingFields(g);
    var sp = g.skillPoints|0;
    return {
      canInfuse: sp >= getStatInfusionCost(g, 'harvest', 1),
      canImproveRank: sp >= getRankImproveCost(g),
      canUnlockExtraStat: sp >= getUnlockStatCost(g),
      canIncreaseStarLevel: sp >= getStarLevelCost(g),
      canUpgradeRarityStar: sp >= getRarityUpgradeCost(g),
      canSpecialize: sp >= 20 && (!g.specialization || g.specialization === 'none')
    };
  }

  // Получить информацию о всех доступных статах
  function getStatInfo(){
    return STAT_INFO;
  }

  global.Leveling = {
    ensureLevelingFields: ensureLevelingFields,
    applyStatInfusion: applyStatInfusion,
    applyBulkStatInfusion: applyBulkStatInfusion,
    getStatInfusionCost: getStatInfusionCost,
    improveRank: improveRank,
    getRankImproveCost: getRankImproveCost,
    unlockExtraStat: unlockExtraStat,
    getUnlockStatCost: getUnlockStatCost,
    increaseStarLevel: increaseStarLevel,
    getStarLevelCost: getStarLevelCost,
    upgradeRarityStar: upgradeRarityStar,
    getRarityUpgradeCost: getRarityUpgradeCost,
    parseRarityStars: parseRarityStars,
    setRarityStars: setRarityStars,
    setSpecialization: setSpecialization,
    convertCrystalsToSkillPoints: convertCrystalsToSkillPoints,
    updatePassiveBonuses: updatePassiveBonuses,
    getAffordableActions: getAffordableActions,
    getStatInfo: getStatInfo
  };
})(typeof window !== 'undefined' ? window : globalThis);
