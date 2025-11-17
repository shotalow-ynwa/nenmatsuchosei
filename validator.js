/**
 * 年末調整入力バリデーション（令和7年版）
 */

// エラーメッセージ定義
const ERROR_MESSAGES = {
    INVALID_INCOME: "収入金額は0円以上の数値を入力してください",
    INVALID_AGE: "特定親族の年齢が要件を満たしていません（19歳以上23歳未満）",
    INVALID_SPOUSE_AGE: "配偶者の生年月日を確認してください",
    EXCESS_DEDUCTION: "控除額が上限を超えています",
    MISSING_REQUIRED: "必須項目が入力されていません",
    INVALID_DATE: "正しい日付形式で入力してください（例：2005/01/01）",
    INVALID_NUMBER: "数値を入力してください",
    NEGATIVE_VALUE: "マイナスの値は入力できません",
    INVALID_NAME: "氏名を入力してください",
    FUTURE_DATE: "未来の日付は入力できません",
    INVALID_DEPENDENT_INCOME: "特定親族の所得金額が要件外です（58万円超123万円以下が対象）"
};

/**
 * 数値バリデーション
 * @param {string|number} value - 検証する値
 * @param {boolean} allowZero - 0を許可するか
 * @returns {object} { valid: boolean, error: string }
 */
function validateNumber(value, allowZero = true) {
    const result = { valid: true, error: null };

    if (value === '' || value === null || value === undefined) {
        result.valid = false;
        result.error = ERROR_MESSAGES.MISSING_REQUIRED;
        return result;
    }

    const numValue = parseFormattedNumber(value);

    if (isNaN(numValue)) {
        result.valid = false;
        result.error = ERROR_MESSAGES.INVALID_NUMBER;
        return result;
    }

    if (numValue < 0) {
        result.valid = false;
        result.error = ERROR_MESSAGES.NEGATIVE_VALUE;
        return result;
    }

    if (!allowZero && numValue === 0) {
        result.valid = false;
        result.error = ERROR_MESSAGES.INVALID_INCOME;
        return result;
    }

    return result;
}

/**
 * 収入金額バリデーション
 * @param {string|number} income - 収入金額
 * @returns {object} { valid: boolean, error: string, warning: string }
 */
function validateIncome(income) {
    const result = { valid: true, error: null, warning: null };

    const numValidation = validateNumber(income, true);
    if (!numValidation.valid) {
        return { ...result, ...numValidation };
    }

    const numValue = parseFormattedNumber(income);

    // 高額所得の警告
    if (numValue > 100000000) {
        result.warning = "収入金額が1億円を超えています。金額をご確認ください";
    }

    // 所得税非課税基準の警告
    if (numValue > 0 && numValue < 1000000) {
        result.warning = "収入金額が100万円未満の場合、所得税が非課税となる可能性があります";
    }

    return result;
}

/**
 * 日付バリデーション
 * @param {string} dateStr - 日付文字列（YYYY/MM/DD または YYYY-MM-DD）
 * @param {boolean} required - 必須項目か
 * @returns {object} { valid: boolean, error: string, date: Date }
 */
function validateDate(dateStr, required = true) {
    const result = { valid: true, error: null, date: null };

    if (!dateStr || dateStr.trim() === '') {
        if (required) {
            result.valid = false;
            result.error = ERROR_MESSAGES.MISSING_REQUIRED;
        }
        return result;
    }

    // 日付形式の正規化（YYYY/MM/DD または YYYY-MM-DD）
    const normalizedDate = dateStr.replace(/-/g, '/');
    const date = new Date(normalizedDate);

    // 日付の妥当性チェック
    if (isNaN(date.getTime())) {
        result.valid = false;
        result.error = ERROR_MESSAGES.INVALID_DATE;
        return result;
    }

    // 未来日付チェック
    const today = new Date();
    if (date > today) {
        result.valid = false;
        result.error = ERROR_MESSAGES.FUTURE_DATE;
        return result;
    }

    // 生年月日として妥当な範囲チェック（1900年以降）
    const minDate = new Date('1900/01/01');
    if (date < minDate) {
        result.valid = false;
        result.error = "1900年以降の日付を入力してください";
        return result;
    }

    result.date = date;
    return result;
}

/**
 * 氏名バリデーション
 * @param {string} name - 氏名
 * @param {boolean} required - 必須項目か
 * @returns {object} { valid: boolean, error: string }
 */
function validateName(name, required = true) {
    const result = { valid: true, error: null };

    if (!name || name.trim() === '') {
        if (required) {
            result.valid = false;
            result.error = ERROR_MESSAGES.INVALID_NAME;
        }
        return result;
    }

    // 文字数チェック（1文字以上50文字以下）
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
        result.valid = false;
        result.error = "氏名は1文字以上50文字以内で入力してください";
        return result;
    }

    return result;
}

/**
 * 特定親族の年齢バリデーション
 * @param {string} birthDate - 生年月日
 * @param {number} targetYear - 対象年（令和7年=2025）
 * @returns {object} { valid: boolean, error: string, age: number }
 */
function validateSpecificDependentAge(birthDate, targetYear = 2025) {
    const result = { valid: true, error: null, age: null };

    const dateValidation = validateDate(birthDate, true);
    if (!dateValidation.valid) {
        return { ...result, ...dateValidation };
    }

    const birth = dateValidation.date;
    const targetDate = new Date(targetYear, 11, 31); // 12月31日時点

    const age = targetDate.getFullYear() - birth.getFullYear();
    const monthDiff = targetDate.getMonth() - birth.getMonth();
    const dayDiff = targetDate.getDate() - birth.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
    }

    result.age = actualAge;

    // 19歳以上23歳未満のチェック
    if (actualAge < 19 || actualAge >= 23) {
        result.valid = false;
        result.error = ERROR_MESSAGES.INVALID_AGE + `（現在${actualAge}歳）`;
        return result;
    }

    return result;
}

/**
 * 特定親族の所得金額バリデーション
 * @param {string|number} income - 所得金額
 * @returns {object} { valid: boolean, error: string, warning: string }
 */
function validateSpecificDependentIncome(income) {
    const result = { valid: true, error: null, warning: null };

    const numValidation = validateNumber(income, true);
    if (!numValidation.valid) {
        return { ...result, ...numValidation };
    }

    const numValue = parseFormattedNumber(income);

    // 58万円以下の場合は通常の扶養控除
    if (numValue <= 580000) {
        result.warning = "所得が58万円以下の場合、通常の扶養控除（63万円）が適用されます";
        return result;
    }

    // 123万円超の場合は控除なし
    if (numValue > 1230000) {
        result.valid = false;
        result.error = ERROR_MESSAGES.INVALID_DEPENDENT_INCOME;
        return result;
    }

    return result;
}

/**
 * 配偶者の所得金額バリデーション
 * @param {string|number} income - 所得金額
 * @returns {object} { valid: boolean, error: string, warning: string }
 */
function validateSpouseIncome(income) {
    const result = { valid: true, error: null, warning: null };

    const numValidation = validateNumber(income, true);
    if (!numValidation.valid) {
        return { ...result, ...numValidation };
    }

    const numValue = parseFormattedNumber(income);

    // 133万円超の場合は控除なし
    if (numValue > 1330000) {
        result.warning = "配偶者の所得が133万円を超えています。配偶者控除等の適用はありません";
        return result;
    }

    // 48万円以下は配偶者控除、超える場合は配偶者特別控除
    if (numValue <= 480000) {
        result.warning = "配偶者控除が適用されます";
    } else {
        result.warning = "配偶者特別控除が適用されます";
    }

    return result;
}

/**
 * フォーム全体のバリデーション（基礎控除申告書）
 * @param {object} formData - フォームデータ
 * @returns {object} { valid: boolean, errors: object }
 */
function validateBasicDeductionForm(formData) {
    const errors = {};
    let valid = true;

    // 氏名
    const nameValidation = validateName(formData.name, true);
    if (!nameValidation.valid) {
        errors.name = nameValidation.error;
        valid = false;
    }

    // 年収
    const salaryValidation = validateIncome(formData.annualSalary);
    if (!salaryValidation.valid) {
        errors.annualSalary = salaryValidation.error;
        valid = false;
    }

    // その他の所得
    if (formData.otherIncome && formData.otherIncome !== '0') {
        const otherIncomeValidation = validateNumber(formData.otherIncome, true);
        if (!otherIncomeValidation.valid) {
            errors.otherIncome = otherIncomeValidation.error;
            valid = false;
        }
    }

    return { valid, errors };
}

/**
 * フォーム全体のバリデーション（配偶者控除等申告書）
 * @param {object} formData - フォームデータ
 * @returns {object} { valid: boolean, errors: object }
 */
function validateSpouseDeductionForm(formData) {
    const errors = {};
    let valid = true;

    // 配偶者氏名
    const nameValidation = validateName(formData.spouseName, true);
    if (!nameValidation.valid) {
        errors.spouseName = nameValidation.error;
        valid = false;
    }

    // 配偶者生年月日
    const birthDateValidation = validateDate(formData.spouseBirthDate, false);
    if (!birthDateValidation.valid) {
        errors.spouseBirthDate = birthDateValidation.error;
        valid = false;
    }

    // 配偶者の給与収入
    const salaryValidation = validateIncome(formData.spouseSalary);
    if (!salaryValidation.valid) {
        errors.spouseSalary = salaryValidation.error;
        valid = false;
    }

    // 配偶者のその他所得
    if (formData.spouseOtherIncome && formData.spouseOtherIncome !== '0') {
        const otherIncomeValidation = validateNumber(formData.spouseOtherIncome, true);
        if (!otherIncomeValidation.valid) {
            errors.spouseOtherIncome = otherIncomeValidation.error;
            valid = false;
        }
    }

    return { valid, errors };
}

/**
 * フォーム全体のバリデーション（特定親族特別控除申告書）
 * @param {object} formData - フォームデータ
 * @returns {object} { valid: boolean, errors: object }
 */
function validateSpecificDependentForm(formData) {
    const errors = {};
    let valid = true;

    // 特定親族氏名
    const nameValidation = validateName(formData.dependentName, true);
    if (!nameValidation.valid) {
        errors.dependentName = nameValidation.error;
        valid = false;
    }

    // 特定親族生年月日（年齢要件チェック）
    const ageValidation = validateSpecificDependentAge(formData.dependentBirthDate);
    if (!ageValidation.valid) {
        errors.dependentBirthDate = ageValidation.error;
        valid = false;
    }

    // 特定親族の給与収入
    const salaryValidation = validateIncome(formData.dependentSalary);
    if (!salaryValidation.valid) {
        errors.dependentSalary = salaryValidation.error;
        valid = false;
    }

    return { valid, errors };
}

/**
 * リアルタイム入力検証（数値入力）
 * @param {string} value - 入力値
 * @returns {string} 検証済み値（カンマ区切り）
 */
function sanitizeNumberInput(value) {
    // カンマと数字以外を除去
    const cleaned = value.replace(/[^\d]/g, '');

    // 空文字の場合
    if (cleaned === '') {
        return '';
    }

    // 数値に変換してカンマ区切りで返す
    const number = parseInt(cleaned);
    return formatNumber(number);
}

/**
 * 日付入力のサニタイズ
 * @param {string} value - 入力値
 * @returns {string} サニタイズ済み値
 */
function sanitizeDateInput(value) {
    // スラッシュとハイフン、数字以外を除去
    return value.replace(/[^\d\/\-]/g, '');
}

/**
 * エラー表示用のHTML生成
 * @param {string} error - エラーメッセージ
 * @returns {string} HTMLエラー要素
 */
function createErrorHTML(error) {
    if (!error) return '';
    return `<div class="error-message" role="alert">${error}</div>`;
}

/**
 * 警告表示用のHTML生成
 * @param {string} warning - 警告メッセージ
 * @returns {string} HTML警告要素
 */
function createWarningHTML(warning) {
    if (!warning) return '';
    return `<div class="warning-message" role="alert">${warning}</div>`;
}
