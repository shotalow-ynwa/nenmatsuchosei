/**
 * 年末調整計算エンジン（令和7年版）
 * 基礎控除、配偶者控除、特定親族特別控除、所得金額調整控除の計算
 */

// 定数定義
const TAX_CONSTANTS = {
    // 基礎控除額（令和7年）
    BASIC_DEDUCTION: {
        FULL: 480000,      // 48万円（所得2,400万円以下）
        REDUCED_1: 320000, // 32万円（所得2,400万円超2,450万円以下）
        REDUCED_2: 160000, // 16万円（所得2,450万円超2,500万円以下）
        ZERO: 0            // 0円（所得2,500万円超）
    },

    // 基礎控除の区分判定基準
    BASIC_DEDUCTION_THRESHOLD: {
        THRESHOLD_1: 9000000,  // 900万円（区分Aの上限）
        THRESHOLD_2: 9500000,  // 950万円（区分Bの上限）
        THRESHOLD_3: 10000000  // 1,000万円（区分Cの上限）
    },

    // 所得判定基準
    INCOME_THRESHOLD: {
        BASIC_1: 24000000,  // 2,400万円
        BASIC_2: 24500000,  // 2,450万円
        BASIC_3: 25000000   // 2,500万円
    },

    // 配偶者控除額
    SPOUSE_DEDUCTION: {
        NORMAL: 480000,   // 48万円（一般）
        ELDERLY: 580000   // 58万円（70歳以上）
    },

    // 配偶者特別控除（最大額）
    SPECIAL_SPOUSE_DEDUCTION_MAX: 480000, // 48万円

    // 特定親族特別控除（最大額）
    SPECIFIC_DEPENDENT_DEDUCTION_MAX: 250000, // 25万円

    // 所得金額調整控除（最大額）
    INCOME_ADJUSTMENT_DEDUCTION_MAX: 150000, // 15万円

    // 配偶者の所得要件
    SPOUSE_INCOME: {
        DEDUCTION_LIMIT: 480000,   // 48万円（控除対象配偶者）
        SPECIAL_LIMIT: 1330000     // 133万円（配偶者特別控除）
    }
};

/**
 * 給与所得控除後の給与所得を計算
 * @param {number} annualSalary - 年間給与収入額
 * @returns {number} 給与所得控除後の所得金額
 */
function calculateSalaryIncome(annualSalary) {
    const salary = parseInt(annualSalary) || 0;

    if (salary <= 0) {
        return 0;
    }

    // 令和7年の給与所得控除
    // 給与所得 = 給与収入 - 給与所得控除額
    let deduction;

    if (salary <= 1625000) {
        // 162.5万円以下：控除額55万円
        deduction = 550000;
    } else if (salary <= 1800000) {
        // 162.5万円超180万円以下：収入 × 40% - 10万円
        deduction = Math.floor(salary * 0.4) - 100000;
    } else if (salary <= 3600000) {
        // 180万円超360万円以下：収入 × 30% + 8万円
        deduction = Math.floor(salary * 0.3) + 80000;
    } else if (salary <= 6600000) {
        // 360万円超660万円以下：収入 × 20% + 44万円
        deduction = Math.floor(salary * 0.2) + 440000;
    } else if (salary <= 8500000) {
        // 660万円超850万円以下：収入 × 10% + 110万円
        deduction = Math.floor(salary * 0.1) + 1100000;
    } else {
        // 850万円超：控除額195万円（上限）
        deduction = 1950000;
    }

    return Math.max(0, salary - deduction);
}

/**
 * 合計所得金額を計算
 * @param {number} salaryIncome - 給与所得
 * @param {number} otherIncome - その他の所得
 * @returns {number} 合計所得金額
 */
function calculateTotalIncome(salaryIncome, otherIncome = 0) {
    return salaryIncome + (parseInt(otherIncome) || 0);
}

/**
 * 基礎控除額を判定
 * @param {number} totalIncome - 合計所得金額
 * @returns {number} 基礎控除額
 */
function calculateBasicDeduction(totalIncome) {
    if (totalIncome <= TAX_CONSTANTS.INCOME_THRESHOLD.BASIC_1) {
        return TAX_CONSTANTS.BASIC_DEDUCTION.FULL;
    } else if (totalIncome <= TAX_CONSTANTS.INCOME_THRESHOLD.BASIC_2) {
        return TAX_CONSTANTS.BASIC_DEDUCTION.REDUCED_1;
    } else if (totalIncome <= TAX_CONSTANTS.INCOME_THRESHOLD.BASIC_3) {
        return TAX_CONSTANTS.BASIC_DEDUCTION.REDUCED_2;
    } else {
        return TAX_CONSTANTS.BASIC_DEDUCTION.ZERO;
    }
}

/**
 * 基礎控除の区分を判定（A/B/C）
 * @param {number} totalIncome - 合計所得金額
 * @returns {string} 区分（'A', 'B', 'C'）
 */
function calculateBasicDeductionCategory(totalIncome) {
    if (totalIncome <= TAX_CONSTANTS.BASIC_DEDUCTION_THRESHOLD.THRESHOLD_1) {
        return 'A';
    } else if (totalIncome <= TAX_CONSTANTS.BASIC_DEDUCTION_THRESHOLD.THRESHOLD_2) {
        return 'B';
    } else {
        return 'C';
    }
}

/**
 * 配偶者の年齢が70歳以上かチェック
 * @param {string} birthDate - 生年月日（YYYY/MM/DD）
 * @param {number} targetYear - 対象年（令和7年=2025）
 * @returns {boolean} 70歳以上かどうか
 */
function isElderlySpouse(birthDate, targetYear = 2025) {
    if (!birthDate) return false;

    const birth = new Date(birthDate);
    const targetDate = new Date(targetYear, 11, 31); // 12月31日時点

    const age = targetDate.getFullYear() - birth.getFullYear();
    const monthDiff = targetDate.getMonth() - birth.getMonth();
    const dayDiff = targetDate.getDate() - birth.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
    }

    return actualAge >= 70;
}

/**
 * 配偶者控除額を計算
 * @param {number} ownTotalIncome - 本人の合計所得金額
 * @param {number} spouseTotalIncome - 配偶者の合計所得金額
 * @param {string} spouseBirthDate - 配偶者の生年月日
 * @returns {object} { deduction: 控除額, type: '配偶者控除' or '配偶者特別控除', category: 区分番号 }
 */
function calculateSpouseDeduction(ownTotalIncome, spouseTotalIncome, spouseBirthDate = null) {
    const result = {
        deduction: 0,
        type: null,
        category: null,
        message: ''
    };

    // 本人の所得が1,000万円超の場合は控除なし
    if (ownTotalIncome > 10000000) {
        result.message = '本人の所得が1,000万円を超えるため、配偶者控除等の適用はありません';
        return result;
    }

    const isElderly = isElderlySpouse(spouseBirthDate);

    // 配偶者の所得による判定
    if (spouseTotalIncome <= TAX_CONSTANTS.SPOUSE_INCOME.DEDUCTION_LIMIT) {
        // 配偶者控除
        result.type = '配偶者控除';

        if (ownTotalIncome <= 9000000) {
            result.deduction = isElderly ? TAX_CONSTANTS.SPOUSE_DEDUCTION.ELDERLY : TAX_CONSTANTS.SPOUSE_DEDUCTION.NORMAL;
        } else if (ownTotalIncome <= 9500000) {
            result.deduction = isElderly ? 387000 : 320000;
        } else if (ownTotalIncome <= 10000000) {
            result.deduction = isElderly ? 193000 : 160000;
        }

    } else if (spouseTotalIncome <= TAX_CONSTANTS.SPOUSE_INCOME.SPECIAL_LIMIT) {
        // 配偶者特別控除
        result.type = '配偶者特別控除';
        result.deduction = calculateSpecialSpouseDeduction(ownTotalIncome, spouseTotalIncome);
    } else {
        result.message = '配偶者の所得が133万円を超えるため、配偶者控除等の適用はありません';
    }

    return result;
}

/**
 * 配偶者特別控除額を計算
 * @param {number} ownTotalIncome - 本人の合計所得金額
 * @param {number} spouseTotalIncome - 配偶者の合計所得金額
 * @returns {number} 配偶者特別控除額
 */
function calculateSpecialSpouseDeduction(ownTotalIncome, spouseTotalIncome) {
    // 配偶者の所得金額による控除額の判定
    let baseAmount = 0;

    if (spouseTotalIncome <= 500000) {
        baseAmount = 480000;
    } else if (spouseTotalIncome <= 550000) {
        baseAmount = 480000;
    } else if (spouseTotalIncome <= 600000) {
        baseAmount = 460000;
    } else if (spouseTotalIncome <= 650000) {
        baseAmount = 440000;
    } else if (spouseTotalIncome <= 700000) {
        baseAmount = 420000;
    } else if (spouseTotalIncome <= 750000) {
        baseAmount = 400000;
    } else if (spouseTotalIncome <= 800000) {
        baseAmount = 360000;
    } else if (spouseTotalIncome <= 850000) {
        baseAmount = 320000;
    } else if (spouseTotalIncome <= 900000) {
        baseAmount = 280000;
    } else if (spouseTotalIncome <= 950000) {
        baseAmount = 240000;
    } else if (spouseTotalIncome <= 1000000) {
        baseAmount = 200000;
    } else if (spouseTotalIncome <= 1050000) {
        baseAmount = 160000;
    } else if (spouseTotalIncome <= 1100000) {
        baseAmount = 120000;
    } else if (spouseTotalIncome <= 1150000) {
        baseAmount = 80000;
    } else if (spouseTotalIncome <= 1200000) {
        baseAmount = 40000;
    } else if (spouseTotalIncome <= 1250000) {
        baseAmount = 20000;
    } else if (spouseTotalIncome <= 1300000) {
        baseAmount = 10000;
    } else if (spouseTotalIncome <= 1330000) {
        baseAmount = 10000;
    } else {
        return 0;
    }

    // 本人の所得による減額
    if (ownTotalIncome <= 9000000) {
        return baseAmount;
    } else if (ownTotalIncome <= 9500000) {
        return Math.floor(baseAmount * 2 / 3);
    } else if (ownTotalIncome <= 10000000) {
        return Math.floor(baseAmount * 1 / 3);
    } else {
        return 0;
    }
}

/**
 * 特定親族の年齢をチェック（19歳以上23歳未満）
 * @param {string} birthDate - 生年月日（YYYY/MM/DD）
 * @param {number} targetYear - 対象年（令和7年=2025）
 * @returns {boolean} 年齢要件を満たすか
 */
function isSpecificDependentAge(birthDate, targetYear = 2025) {
    if (!birthDate) return false;

    const birth = new Date(birthDate);
    const targetDate = new Date(targetYear, 11, 31); // 12月31日時点

    const age = targetDate.getFullYear() - birth.getFullYear();
    const monthDiff = targetDate.getMonth() - birth.getMonth();
    const dayDiff = targetDate.getDate() - birth.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
    }

    return actualAge >= 19 && actualAge < 23;
}

/**
 * 特定親族特別控除額を計算
 * @param {number} ownTotalIncome - 本人の合計所得金額
 * @param {number} dependentIncome - 特定親族の所得金額
 * @param {string} dependentBirthDate - 特定親族の生年月日
 * @returns {object} { deduction: 控除額, eligible: 適用可否, message: メッセージ }
 */
function calculateSpecificDependentDeduction(ownTotalIncome, dependentIncome, dependentBirthDate) {
    const result = {
        deduction: 0,
        eligible: false,
        message: ''
    };

    // 年齢要件チェック（19歳以上23歳未満）
    if (!isSpecificDependentAge(dependentBirthDate)) {
        result.message = '特定親族の年齢が要件を満たしていません（19歳以上23歳未満が対象）';
        return result;
    }

    // 所得要件チェック（58万円超123万円以下）
    if (dependentIncome <= 580000) {
        result.message = '特定親族の所得が58万円以下のため、通常の扶養控除が適用されます';
        return result;
    }

    if (dependentIncome > 1230000) {
        result.message = '特定親族の所得が123万円を超えるため、控除の適用はありません';
        return result;
    }

    // 本人の所得による控除額の判定
    let baseAmount = TAX_CONSTANTS.SPECIFIC_DEPENDENT_DEDUCTION_MAX;

    if (ownTotalIncome <= 9000000) {
        result.deduction = baseAmount;
    } else if (ownTotalIncome <= 9500000) {
        result.deduction = Math.floor(baseAmount * 2 / 3); // 約16.7万円
    } else if (ownTotalIncome <= 10000000) {
        result.deduction = Math.floor(baseAmount * 1 / 3); // 約8.3万円
    } else {
        result.message = '本人の所得が1,000万円を超えるため、控除の適用はありません';
        return result;
    }

    result.eligible = true;
    result.message = '特定親族特別控除が適用されます';

    return result;
}

/**
 * 所得金額調整控除を計算
 * @param {number} annualSalary - 年間給与収入額
 * @param {boolean} hasSpecialDisabled - 特別障害者の有無
 * @param {boolean} hasYoungDependent - 23歳未満の扶養親族の有無
 * @returns {object} { deduction: 控除額, eligible: 適用可否, message: メッセージ }
 */
function calculateIncomeAdjustmentDeduction(annualSalary, hasSpecialDisabled = false, hasYoungDependent = false) {
    const result = {
        deduction: 0,
        eligible: false,
        message: ''
    };

    const salary = parseInt(annualSalary) || 0;

    // 年収850万円以下は対象外
    if (salary <= 8500000) {
        result.message = '年収が850万円以下のため、所得金額調整控除の適用はありません';
        return result;
    }

    // 要件チェック
    if (!hasSpecialDisabled && !hasYoungDependent) {
        result.message = '特別障害者または23歳未満の扶養親族がいないため、控除の適用はありません';
        return result;
    }

    // 控除額の計算：(給与収入 - 850万円) × 10%（上限15万円）
    const excess = Math.min(salary - 8500000, 1500000); // 上限1,000万円-850万円=150万円
    result.deduction = Math.min(Math.floor(excess * 0.1), TAX_CONSTANTS.INCOME_ADJUSTMENT_DEDUCTION_MAX);
    result.eligible = true;
    result.message = '所得金額調整控除が適用されます';

    return result;
}

/**
 * 数値をカンマ区切りでフォーマット
 * @param {number} num - 数値
 * @returns {string} フォーマット済み文字列
 */
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * カンマ区切り文字列を数値に変換
 * @param {string} str - カンマ区切り文字列
 * @returns {number} 数値
 */
function parseFormattedNumber(str) {
    if (!str) return 0;
    return parseInt(str.toString().replace(/,/g, '')) || 0;
}

// ============================================
// 保険料控除の計算（Phase 3）
// ============================================

/**
 * 新制度の生命保険料控除額を計算
 * @param {number} amount - 年間支払保険料額
 * @returns {number} 控除額
 */
function calculateNewInsuranceDeduction(amount) {
    const payment = parseInt(amount) || 0;

    if (payment <= 0) {
        return 0;
    } else if (payment <= 20000) {
        return payment;
    } else if (payment <= 40000) {
        return Math.floor(payment / 2 + 10000);
    } else if (payment <= 80000) {
        return Math.floor(payment / 4 + 20000);
    } else {
        return 40000; // 上限4万円
    }
}

/**
 * 旧制度の生命保険料控除額を計算
 * @param {number} amount - 年間支払保険料額
 * @returns {number} 控除額
 */
function calculateOldInsuranceDeduction(amount) {
    const payment = parseInt(amount) || 0;

    if (payment <= 0) {
        return 0;
    } else if (payment <= 25000) {
        return payment;
    } else if (payment <= 50000) {
        return Math.floor(payment / 2 + 12500);
    } else if (payment <= 100000) {
        return Math.floor(payment / 4 + 25000);
    } else {
        return 50000; // 上限5万円
    }
}

/**
 * 生命保険料控除の合計額を計算
 * @param {object} data - 保険料データ
 * @returns {object} 控除額の詳細
 */
function calculateLifeInsuranceDeduction(data) {
    const result = {
        generalNew: 0,        // 一般生命保険料（新制度）
        generalOld: 0,        // 一般生命保険料（旧制度）
        generalTotal: 0,      // 一般生命保険料合計
        medicalNew: 0,        // 介護医療保険料（新制度のみ）
        pensionNew: 0,        // 個人年金保険料（新制度）
        pensionOld: 0,        // 個人年金保険料（旧制度）
        pensionTotal: 0,      // 個人年金保険料合計
        total: 0              // 生命保険料控除合計
    };

    // 一般生命保険料（新制度）
    if (data.generalNewAmount) {
        result.generalNew = calculateNewInsuranceDeduction(data.generalNewAmount);
    }

    // 一般生命保険料（旧制度）
    if (data.generalOldAmount) {
        result.generalOld = calculateOldInsuranceDeduction(data.generalOldAmount);
    }

    // 一般生命保険料の合計（新旧併用時の特例計算）
    if (result.generalNew > 0 && result.generalOld > 0) {
        // 新旧両方ある場合：合計額の上限4万円
        result.generalTotal = Math.min(result.generalNew + result.generalOld, 40000);
    } else if (result.generalNew > 0) {
        result.generalTotal = result.generalNew;
    } else {
        result.generalTotal = result.generalOld;
    }

    // 介護医療保険料（新制度のみ）
    if (data.medicalNewAmount) {
        result.medicalNew = calculateNewInsuranceDeduction(data.medicalNewAmount);
    }

    // 個人年金保険料（新制度）
    if (data.pensionNewAmount) {
        result.pensionNew = calculateNewInsuranceDeduction(data.pensionNewAmount);
    }

    // 個人年金保険料（旧制度）
    if (data.pensionOldAmount) {
        result.pensionOld = calculateOldInsuranceDeduction(data.pensionOldAmount);
    }

    // 個人年金保険料の合計（新旧併用時の特例計算）
    if (result.pensionNew > 0 && result.pensionOld > 0) {
        // 新旧両方ある場合：合計額の上限4万円
        result.pensionTotal = Math.min(result.pensionNew + result.pensionOld, 40000);
    } else if (result.pensionNew > 0) {
        result.pensionTotal = result.pensionNew;
    } else {
        result.pensionTotal = result.pensionOld;
    }

    // 生命保険料控除合計（上限12万円）
    result.total = Math.min(
        result.generalTotal + result.medicalNew + result.pensionTotal,
        120000
    );

    return result;
}

/**
 * 地震保険料控除額を計算
 * @param {number} earthquakeAmount - 地震保険料
 * @param {number} oldLongTermAmount - 旧長期損害保険料
 * @returns {object} 控除額の詳細
 */
function calculateEarthquakeInsuranceDeduction(earthquakeAmount, oldLongTermAmount) {
    const result = {
        earthquake: 0,      // 地震保険料控除額
        oldLongTerm: 0,     // 旧長期損害保険料控除額
        total: 0            // 合計
    };

    const earthquake = parseInt(earthquakeAmount) || 0;
    const oldLongTerm = parseInt(oldLongTermAmount) || 0;

    // 地震保険料控除（支払額全額、上限5万円）
    if (earthquake > 0) {
        result.earthquake = Math.min(earthquake, 50000);
    }

    // 旧長期損害保険料控除
    if (oldLongTerm > 0) {
        if (oldLongTerm <= 10000) {
            result.oldLongTerm = Math.floor(oldLongTerm / 2);
        } else if (oldLongTerm <= 20000) {
            result.oldLongTerm = Math.floor(oldLongTerm / 2 + 5000);
        } else {
            result.oldLongTerm = 15000; // 上限1.5万円
        }
    }

    // 合計（地震保険料と旧長期損害保険料の合計、上限5万円）
    result.total = Math.min(result.earthquake + result.oldLongTerm, 50000);

    return result;
}

/**
 * 社会保険料控除額を計算（全額控除）
 * @param {number} nationalPension - 国民年金保険料
 * @param {number} nationalHealth - 国民健康保険料
 * @param {number} otherSocial - その他社会保険料
 * @returns {object} 控除額の詳細
 */
function calculateSocialInsuranceDeduction(nationalPension, nationalHealth, otherSocial) {
    const result = {
        nationalPension: parseInt(nationalPension) || 0,
        nationalHealth: parseInt(nationalHealth) || 0,
        otherSocial: parseInt(otherSocial) || 0,
        total: 0
    };

    result.total = result.nationalPension + result.nationalHealth + result.otherSocial;

    return result;
}

/**
 * 小規模企業共済等掛金控除額を計算（全額控除）
 * @param {number} iDeCoAmount - iDeCo掛金額
 * @param {number} mutualAidAmount - 小規模企業共済掛金額
 * @returns {object} 控除額の詳細
 */
function calculateSmallEnterpriseDeduction(iDeCoAmount, mutualAidAmount) {
    const result = {
        iDeCo: parseInt(iDeCoAmount) || 0,
        mutualAid: parseInt(mutualAidAmount) || 0,
        total: 0
    };

    result.total = result.iDeCo + result.mutualAid;

    return result;
}
