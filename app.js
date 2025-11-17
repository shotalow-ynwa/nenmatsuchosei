/**
 * 年末調整書類記入サポートツール メインアプリケーション（令和7年版）
 */

// アプリケーション状態管理
const AppState = {
    currentTab: 'basic',
    formData: {
        // 基礎控除申告書
        name: '',
        annualSalary: '',
        otherIncome: '',

        // 配偶者控除等申告書
        hasSpouse: false,
        spouseName: '',
        spouseBirthDate: '',
        spouseSalary: '',
        spouseOtherIncome: '',

        // 特定親族特別控除申告書
        hasSpecificDependent: false,
        dependentName: '',
        dependentBirthDate: '',
        dependentSalary: '',

        // 所得金額調整控除申告書
        hasIncomeAdjustment: false,
        hasSpecialDisabled: false,
        hasYoungDependent: false,

        // 保険料控除申告書
        // 生命保険料控除
        generalNewAmount: '',
        generalOldAmount: '',
        medicalNewAmount: '',
        pensionNewAmount: '',
        pensionOldAmount: '',
        // 地震保険料控除
        earthquakeAmount: '',
        oldLongTermAmount: '',
        // 社会保険料控除
        nationalPension: '',
        nationalHealth: '',
        otherSocial: '',
        // 小規模企業共済等掛金控除
        iDeCoAmount: '',
        mutualAidAmount: ''
    },
    results: {}
};

// LocalStorageキー
const STORAGE_KEY = 'nenmatsuchosei_data_v1';

/**
 * アプリケーション初期化
 */
function initApp() {
    // タブイベントの設定
    setupTabs();

    // フォームイベントの設定
    setupFormEvents();

    // LocalStorageからデータ読み込み
    loadFromStorage();

    // 初期計算
    calculateAll();
}

/**
 * タブ切り替え機能のセットアップ
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            switchTab(targetTab);
        });
    });
}

/**
 * タブ切り替え
 * @param {string} tabName - タブ名
 */
function switchTab(tabName) {
    // すべてのタブボタンとコンテンツを非アクティブ化
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 指定されたタブをアクティブ化
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeButton && activeContent) {
        activeButton.classList.add('active');
        activeContent.classList.add('active');
        AppState.currentTab = tabName;
    }
}

/**
 * フォームイベントのセットアップ
 */
function setupFormEvents() {
    // 基本情報入力
    setupInputEvent('name', 'name');
    setupInputEvent('annualSalary', 'annualSalary', true);
    setupInputEvent('otherIncome', 'otherIncome', true);

    // 配偶者情報
    setupCheckboxEvent('hasSpouse', 'spouse-section');
    setupInputEvent('spouseName', 'spouseName');
    setupInputEvent('spouseBirthDate', 'spouseBirthDate');
    setupInputEvent('spouseSalary', 'spouseSalary', true);
    setupInputEvent('spouseOtherIncome', 'spouseOtherIncome', true);

    // 特定親族情報
    setupCheckboxEvent('hasSpecificDependent', 'dependent-section');
    setupInputEvent('dependentName', 'dependentName');
    setupInputEvent('dependentBirthDate', 'dependentBirthDate');
    setupInputEvent('dependentSalary', 'dependentSalary', true);

    // 所得金額調整控除
    setupCheckboxEvent('hasIncomeAdjustment', 'adjustment-section');
    setupCheckboxEvent('hasSpecialDisabled', null);
    setupCheckboxEvent('hasYoungDependent', null);

    // 保険料控除（Phase 3）
    // 生命保険料控除
    setupInputEvent('generalNewAmount', 'generalNewAmount', true);
    setupInputEvent('generalOldAmount', 'generalOldAmount', true);
    setupInputEvent('medicalNewAmount', 'medicalNewAmount', true);
    setupInputEvent('pensionNewAmount', 'pensionNewAmount', true);
    setupInputEvent('pensionOldAmount', 'pensionOldAmount', true);
    // 地震保険料控除
    setupInputEvent('earthquakeAmount', 'earthquakeAmount', true);
    setupInputEvent('oldLongTermAmount', 'oldLongTermAmount', true);
    // 社会保険料控除
    setupInputEvent('nationalPension', 'nationalPension', true);
    setupInputEvent('nationalHealth', 'nationalHealth', true);
    setupInputEvent('otherSocial', 'otherSocial', true);
    // 小規模企業共済等掛金控除
    setupInputEvent('iDeCoAmount', 'iDeCoAmount', true);
    setupInputEvent('mutualAidAmount', 'mutualAidAmount', true);

    // ボタンイベント
    setupButtonEvents();
}

/**
 * 入力フィールドのイベントセットアップ
 * @param {string} fieldId - フィールドID
 * @param {string} stateKey - 状態管理キー
 * @param {boolean} isNumber - 数値フィールドか
 */
function setupInputEvent(fieldId, stateKey, isNumber = false) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    // debounce処理
    let debounceTimer;

    input.addEventListener('input', (e) => {
        let value = e.target.value;

        // 数値フィールドの場合はサニタイズ
        if (isNumber) {
            value = sanitizeNumberInput(value);
            e.target.value = value;
        }

        // 状態を更新
        AppState.formData[stateKey] = value;

        // debounce処理で計算実行
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            calculateAll();
            saveToStorage();
        }, 300);
    });

    // フォーカスアウト時のバリデーション
    input.addEventListener('blur', () => {
        validateField(fieldId, stateKey, isNumber);
    });
}

/**
 * チェックボックスのイベントセットアップ
 * @param {string} checkboxId - チェックボックスID
 * @param {string} sectionId - 表示/非表示を切り替えるセクションID
 */
function setupCheckboxEvent(checkboxId, sectionId) {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;

    checkbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        AppState.formData[checkboxId] = checked;

        // 関連セクションの表示切り替え
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.toggle('hidden', !checked);
            }
        }

        calculateAll();
        saveToStorage();
    });
}

/**
 * ボタンイベントのセットアップ
 */
function setupButtonEvents() {
    // 印刷ボタン
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }

    // データ保存ボタン
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            saveToStorage();
            showNotification('データを保存しました', 'success');
        });
    }

    // データクリアボタン
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (confirm('すべての入力データをクリアしますか？')) {
                clearAllData();
                showNotification('データをクリアしました', 'info');
            }
        });
    }

    // CSVエクスポートボタン
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            exportToCSV();
        });
    }
}

/**
 * フィールドのバリデーション
 * @param {string} fieldId - フィールドID
 * @param {string} stateKey - 状態管理キー
 * @param {boolean} isNumber - 数値フィールドか
 */
function validateField(fieldId, stateKey, isNumber) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const value = AppState.formData[stateKey];
    let validation = { valid: true, error: null };

    // バリデーション実行
    if (isNumber) {
        validation = validateNumber(value, true);
    } else if (fieldId.includes('BirthDate')) {
        validation = validateDate(value, false);
    } else if (fieldId.includes('Name')) {
        validation = validateName(value, false);
    }

    // エラー表示の更新
    updateFieldError(fieldId, validation.error);

    // エラーがある場合は入力欄を赤枠に
    if (!validation.valid) {
        input.classList.add('error');
    } else {
        input.classList.remove('error');
    }
}

/**
 * フィールドエラーの表示更新
 * @param {string} fieldId - フィールドID
 * @param {string} error - エラーメッセージ
 */
function updateFieldError(fieldId, error) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    // 既存のエラーメッセージを削除
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // 新しいエラーメッセージを追加
    if (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = error;
        errorDiv.setAttribute('role', 'alert');
        formGroup.appendChild(errorDiv);
    }
}

/**
 * すべての計算を実行
 */
function calculateAll() {
    calculateBasicDeduction();
    calculateSpouseDeduction();
    calculateSpecificDependentDeduction();
    calculateIncomeAdjustmentDeduction();
    // Phase 3: 保険料控除
    calculateLifeInsurance();
    calculateEarthquakeInsurance();
    calculateSocialInsurance();
    calculateSmallEnterprise();
}

/**
 * 基礎控除の計算と表示
 */
function calculateBasicDeduction() {
    const { annualSalary, otherIncome } = AppState.formData;

    if (!annualSalary) {
        hideResultSection('basic-result');
        return;
    }

    // 給与所得の計算
    const salaryIncome = calculateSalaryIncome(parseFormattedNumber(annualSalary));
    const totalIncome = calculateTotalIncome(salaryIncome, parseFormattedNumber(otherIncome));

    // 基礎控除額と区分の判定
    const basicDeduction = calculateBasicDeduction(totalIncome);
    const category = calculateBasicDeductionCategory(totalIncome);

    // 結果を状態に保存
    AppState.results.basic = {
        salaryIncome,
        totalIncome,
        basicDeduction,
        category
    };

    // 結果を表示
    displayBasicResult();
}

/**
 * 基礎控除の結果表示
 */
function displayBasicResult() {
    const result = AppState.results.basic;
    if (!result) return;

    const resultSection = document.getElementById('basic-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    const html = `
        <div class="result-title">
            <span>✓</span> 計算結果
        </div>
        <div class="result-item">
            <span class="result-label">給与所得金額</span>
            <span class="result-value">${formatNumber(result.salaryIncome)}円</span>
        </div>
        <div class="result-item">
            <span class="result-label">合計所得金額</span>
            <span class="result-value">${formatNumber(result.totalIncome)}円</span>
        </div>
        <div class="result-item">
            <span class="result-label">基礎控除額</span>
            <span class="result-value">${formatNumber(result.basicDeduction)}円</span>
        </div>
        <div class="result-highlight">
            <div class="result-highlight-title">申告書への記入内容</div>
            <div class="result-highlight-value">区分: ${result.category}</div>
            <div class="alert alert-info mt-2">
                「給与所得者の基礎控除申告書」の該当欄に「${result.category}」と記入してください。
            </div>
        </div>
    `;

    resultSection.innerHTML = html;
}

/**
 * 配偶者控除等の計算と表示
 */
function calculateSpouseDeduction() {
    const { hasSpouse, spouseSalary, spouseOtherIncome, spouseBirthDate } = AppState.formData;

    if (!hasSpouse || !spouseSalary) {
        hideResultSection('spouse-result');
        return;
    }

    const ownTotalIncome = AppState.results.basic?.totalIncome || 0;
    const spouseSalaryIncome = calculateSalaryIncome(parseFormattedNumber(spouseSalary));
    const spouseTotalIncome = calculateTotalIncome(spouseSalaryIncome, parseFormattedNumber(spouseOtherIncome));

    const result = calculateSpouseDeduction(ownTotalIncome, spouseTotalIncome, spouseBirthDate);

    // 結果を状態に保存
    AppState.results.spouse = {
        spouseSalaryIncome,
        spouseTotalIncome,
        ...result
    };

    // 結果を表示
    displaySpouseResult();
}

/**
 * 配偶者控除等の結果表示
 */
function displaySpouseResult() {
    const result = AppState.results.spouse;
    if (!result) return;

    const resultSection = document.getElementById('spouse-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 計算結果
        </div>
        <div class="result-item">
            <span class="result-label">配偶者の給与所得金額</span>
            <span class="result-value">${formatNumber(result.spouseSalaryIncome)}円</span>
        </div>
        <div class="result-item">
            <span class="result-label">配偶者の合計所得金額</span>
            <span class="result-value">${formatNumber(result.spouseTotalIncome)}円</span>
        </div>
    `;

    if (result.deduction > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">${result.type}</span>
                <span class="result-value">${formatNumber(result.deduction)}円</span>
            </div>
            <div class="result-highlight">
                <div class="result-highlight-title">申告書への記入内容</div>
                <div class="result-highlight-value">${result.type}: ${formatNumber(result.deduction)}円</div>
                <div class="alert alert-info mt-2">
                    「配偶者控除等申告書」に配偶者の情報と控除額を記入してください。
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-warning">
                ${result.message || '配偶者控除等の適用はありません'}
            </div>
        `;
    }

    resultSection.innerHTML = html;
}

/**
 * 特定親族特別控除の計算と表示
 */
function calculateSpecificDependentDeduction() {
    const { hasSpecificDependent, dependentSalary, dependentBirthDate } = AppState.formData;

    if (!hasSpecificDependent || !dependentSalary || !dependentBirthDate) {
        hideResultSection('dependent-result');
        return;
    }

    const ownTotalIncome = AppState.results.basic?.totalIncome || 0;
    const dependentSalaryIncome = calculateSalaryIncome(parseFormattedNumber(dependentSalary));

    const result = calculateSpecificDependentDeduction(ownTotalIncome, dependentSalaryIncome, dependentBirthDate);

    // 結果を状態に保存
    AppState.results.dependent = {
        dependentSalaryIncome,
        ...result
    };

    // 結果を表示
    displayDependentResult();
}

/**
 * 特定親族特別控除の結果表示
 */
function displayDependentResult() {
    const result = AppState.results.dependent;
    if (!result) return;

    const resultSection = document.getElementById('dependent-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 計算結果
        </div>
        <div class="result-item">
            <span class="result-label">特定親族の所得金額</span>
            <span class="result-value">${formatNumber(result.dependentSalaryIncome)}円</span>
        </div>
    `;

    if (result.eligible && result.deduction > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">特定親族特別控除額</span>
                <span class="result-value">${formatNumber(result.deduction)}円</span>
            </div>
            <div class="result-highlight">
                <div class="result-highlight-title">申告書への記入内容</div>
                <div class="result-highlight-value">控除額: ${formatNumber(result.deduction)}円</div>
                <div class="alert alert-info mt-2">
                    「特定親族特別控除申告書」に特定親族の情報と控除額を記入してください。
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-warning">
                ${result.message || '特定親族特別控除の適用はありません'}
            </div>
        `;
    }

    resultSection.innerHTML = html;
}

/**
 * 所得金額調整控除の計算と表示
 */
function calculateIncomeAdjustmentDeduction() {
    const { hasIncomeAdjustment, annualSalary, hasSpecialDisabled, hasYoungDependent } = AppState.formData;

    if (!hasIncomeAdjustment || !annualSalary) {
        hideResultSection('adjustment-result');
        return;
    }

    const result = calculateIncomeAdjustmentDeduction(
        parseFormattedNumber(annualSalary),
        hasSpecialDisabled,
        hasYoungDependent
    );

    // 結果を状態に保存
    AppState.results.adjustment = result;

    // 結果を表示
    displayAdjustmentResult();
}

/**
 * 所得金額調整控除の結果表示
 */
function displayAdjustmentResult() {
    const result = AppState.results.adjustment;
    if (!result) return;

    const resultSection = document.getElementById('adjustment-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 計算結果
        </div>
    `;

    if (result.eligible && result.deduction > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">所得金額調整控除額</span>
                <span class="result-value">${formatNumber(result.deduction)}円</span>
            </div>
            <div class="result-highlight">
                <div class="result-highlight-title">申告書への記入内容</div>
                <div class="result-highlight-value">控除額: ${formatNumber(result.deduction)}円</div>
                <div class="alert alert-info mt-2">
                    「所得金額調整控除申告書」に該当する要件と控除額を記入してください。
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-warning">
                ${result.message || '所得金額調整控除の適用はありません'}
            </div>
        `;
    }

    resultSection.innerHTML = html;
}

/**
 * 結果セクションを非表示
 * @param {string} sectionId - セクションID
 */
function hideResultSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('hidden');
    }
}

/**
 * LocalStorageにデータを保存
 */
function saveToStorage() {
    try {
        const dataToSave = {
            formData: AppState.formData,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('保存エラー:', error);
    }
}

/**
 * LocalStorageからデータを読み込み
 */
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            AppState.formData = { ...AppState.formData, ...data.formData };

            // フォームに値を復元
            restoreFormValues();
        }
    } catch (error) {
        console.error('読み込みエラー:', error);
    }
}

/**
 * フォームの値を復元
 */
function restoreFormValues() {
    Object.keys(AppState.formData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            const value = AppState.formData[key];

            if (element.type === 'checkbox') {
                element.checked = value;
                // チェックボックスのchangeイベントを発火
                element.dispatchEvent(new Event('change'));
            } else {
                element.value = value || '';
            }
        }
    });
}

/**
 * すべてのデータをクリア
 */
function clearAllData() {
    // 状態をリセット
    Object.keys(AppState.formData).forEach(key => {
        if (typeof AppState.formData[key] === 'boolean') {
            AppState.formData[key] = false;
        } else {
            AppState.formData[key] = '';
        }
    });

    AppState.results = {};

    // フォームをクリア
    document.querySelectorAll('input').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
        input.classList.remove('error');
    });

    // エラーメッセージをクリア
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // 結果を非表示
    document.querySelectorAll('.result-section').forEach(section => {
        section.classList.add('hidden');
    });

    // LocalStorageをクリア
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * CSVエクスポート
 */
function exportToCSV() {
    const { formData, results } = AppState;

    let csv = '項目,値\n';
    csv += `氏名,${formData.name}\n`;
    csv += `年間給与収入,${formData.annualSalary}\n`;
    csv += `その他の所得,${formData.otherIncome}\n`;

    if (results.basic) {
        csv += `給与所得金額,${results.basic.salaryIncome}\n`;
        csv += `合計所得金額,${results.basic.totalIncome}\n`;
        csv += `基礎控除額,${results.basic.basicDeduction}\n`;
        csv += `区分,${results.basic.category}\n`;
    }

    if (formData.hasSpouse && results.spouse) {
        csv += `\n配偶者氏名,${formData.spouseName}\n`;
        csv += `配偶者生年月日,${formData.spouseBirthDate}\n`;
        csv += `配偶者の所得,${results.spouse.spouseTotalIncome}\n`;
        csv += `${results.spouse.type},${results.spouse.deduction}\n`;
    }

    // BOM付きでダウンロード
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `年末調整_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('CSVファイルをダウンロードしました', 'success');
}

/**
 * 通知メッセージの表示
 * @param {string} message - メッセージ
 * @param {string} type - タイプ（success, info, warning, error）
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// アニメーション用のスタイルを追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// 保険料控除の計算と表示（Phase 3）
// ============================================

/**
 * 生命保険料控除の計算と表示
 */
function calculateLifeInsurance() {
    const { generalNewAmount, generalOldAmount, medicalNewAmount, pensionNewAmount, pensionOldAmount } = AppState.formData;

    // 入力がない場合は非表示
    if (!generalNewAmount && !generalOldAmount && !medicalNewAmount && !pensionNewAmount && !pensionOldAmount) {
        hideResultSection('life-insurance-result');
        return;
    }

    const data = {
        generalNewAmount: parseFormattedNumber(generalNewAmount),
        generalOldAmount: parseFormattedNumber(generalOldAmount),
        medicalNewAmount: parseFormattedNumber(medicalNewAmount),
        pensionNewAmount: parseFormattedNumber(pensionNewAmount),
        pensionOldAmount: parseFormattedNumber(pensionOldAmount)
    };

    const result = calculateLifeInsuranceDeduction(data);

    AppState.results.lifeInsurance = result;

    displayLifeInsuranceResult();
}

/**
 * 生命保険料控除の結果表示
 */
function displayLifeInsuranceResult() {
    const result = AppState.results.lifeInsurance;
    if (!result) return;

    const resultSection = document.getElementById('life-insurance-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 生命保険料控除の計算結果
        </div>
    `;

    if (result.generalTotal > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">一般生命保険料控除</span>
                <span class="result-value">${formatNumber(result.generalTotal)}円</span>
            </div>
        `;
    }

    if (result.medicalNew > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">介護医療保険料控除</span>
                <span class="result-value">${formatNumber(result.medicalNew)}円</span>
            </div>
        `;
    }

    if (result.pensionTotal > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">個人年金保険料控除</span>
                <span class="result-value">${formatNumber(result.pensionTotal)}円</span>
            </div>
        `;
    }

    html += `
        <div class="result-highlight">
            <div class="result-highlight-title">生命保険料控除合計額</div>
            <div class="result-highlight-value">${formatNumber(result.total)}円</div>
            <div class="alert alert-info mt-2">
                保険料控除申告書の生命保険料控除欄に記入してください。（上限12万円）
            </div>
        </div>
    `;

    resultSection.innerHTML = html;
}

/**
 * 地震保険料控除の計算と表示
 */
function calculateEarthquakeInsurance() {
    const { earthquakeAmount, oldLongTermAmount } = AppState.formData;

    if (!earthquakeAmount && !oldLongTermAmount) {
        hideResultSection('earthquake-insurance-result');
        return;
    }

    const result = calculateEarthquakeInsuranceDeduction(
        parseFormattedNumber(earthquakeAmount),
        parseFormattedNumber(oldLongTermAmount)
    );

    AppState.results.earthquakeInsurance = result;

    displayEarthquakeInsuranceResult();
}

/**
 * 地震保険料控除の結果表示
 */
function displayEarthquakeInsuranceResult() {
    const result = AppState.results.earthquakeInsurance;
    if (!result) return;

    const resultSection = document.getElementById('earthquake-insurance-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 地震保険料控除の計算結果
        </div>
    `;

    if (result.earthquake > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">地震保険料控除</span>
                <span class="result-value">${formatNumber(result.earthquake)}円</span>
            </div>
        `;
    }

    if (result.oldLongTerm > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">旧長期損害保険料控除</span>
                <span class="result-value">${formatNumber(result.oldLongTerm)}円</span>
            </div>
        `;
    }

    html += `
        <div class="result-highlight">
            <div class="result-highlight-title">地震保険料控除合計額</div>
            <div class="result-highlight-value">${formatNumber(result.total)}円</div>
            <div class="alert alert-info mt-2">
                保険料控除申告書の地震保険料控除欄に記入してください。（上限5万円）
            </div>
        </div>
    `;

    resultSection.innerHTML = html;
}

/**
 * 社会保険料控除の計算と表示
 */
function calculateSocialInsurance() {
    const { nationalPension, nationalHealth, otherSocial } = AppState.formData;

    if (!nationalPension && !nationalHealth && !otherSocial) {
        hideResultSection('social-insurance-result');
        return;
    }

    const result = calculateSocialInsuranceDeduction(
        parseFormattedNumber(nationalPension),
        parseFormattedNumber(nationalHealth),
        parseFormattedNumber(otherSocial)
    );

    AppState.results.socialInsurance = result;

    displaySocialInsuranceResult();
}

/**
 * 社会保険料控除の結果表示
 */
function displaySocialInsuranceResult() {
    const result = AppState.results.socialInsurance;
    if (!result || result.total === 0) return;

    const resultSection = document.getElementById('social-insurance-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 社会保険料控除の計算結果
        </div>
    `;

    if (result.nationalPension > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">国民年金保険料</span>
                <span class="result-value">${formatNumber(result.nationalPension)}円</span>
            </div>
        `;
    }

    if (result.nationalHealth > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">国民健康保険料</span>
                <span class="result-value">${formatNumber(result.nationalHealth)}円</span>
            </div>
        `;
    }

    if (result.otherSocial > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">その他社会保険料</span>
                <span class="result-value">${formatNumber(result.otherSocial)}円</span>
            </div>
        `;
    }

    html += `
        <div class="result-highlight">
            <div class="result-highlight-title">社会保険料控除合計額</div>
            <div class="result-highlight-value">${formatNumber(result.total)}円</div>
            <div class="alert alert-info mt-2">
                保険料控除申告書の社会保険料控除欄に記入してください。（全額控除）
            </div>
        </div>
    `;

    resultSection.innerHTML = html;
}

/**
 * 小規模企業共済等掛金控除の計算と表示
 */
function calculateSmallEnterprise() {
    const { iDeCoAmount, mutualAidAmount } = AppState.formData;

    if (!iDeCoAmount && !mutualAidAmount) {
        hideResultSection('small-enterprise-result');
        return;
    }

    const result = calculateSmallEnterpriseDeduction(
        parseFormattedNumber(iDeCoAmount),
        parseFormattedNumber(mutualAidAmount)
    );

    AppState.results.smallEnterprise = result;

    displaySmallEnterpriseResult();
}

/**
 * 小規模企業共済等掛金控除の結果表示
 */
function displaySmallEnterpriseResult() {
    const result = AppState.results.smallEnterprise;
    if (!result || result.total === 0) return;

    const resultSection = document.getElementById('small-enterprise-result');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    let html = `
        <div class="result-title">
            <span>✓</span> 小規模企業共済等掛金控除の計算結果
        </div>
    `;

    if (result.iDeCo > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">iDeCo掛金</span>
                <span class="result-value">${formatNumber(result.iDeCo)}円</span>
            </div>
        `;
    }

    if (result.mutualAid > 0) {
        html += `
            <div class="result-item">
                <span class="result-label">小規模企業共済掛金</span>
                <span class="result-value">${formatNumber(result.mutualAid)}円</span>
            </div>
        `;
    }

    html += `
        <div class="result-highlight">
            <div class="result-highlight-title">小規模企業共済等掛金控除合計額</div>
            <div class="result-highlight-value">${formatNumber(result.total)}円</div>
            <div class="alert alert-info mt-2">
                保険料控除申告書の小規模企業共済等掛金控除欄に記入してください。（全額控除）
            </div>
        </div>
    `;

    resultSection.innerHTML = html;
}

// DOMContentLoadedイベントでアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initApp);
