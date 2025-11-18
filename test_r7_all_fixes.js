/**
 * 令和7年版の全修正内容を検証するテストスクリプト
 * 問題3〜7の修正を検証
 */

const fs = require('fs');
eval(fs.readFileSync('./calculator.js', 'utf8'));

console.log('=== 令和7年版 全修正内容の検証 ===\n');

let totalTests = 0;
let passedTests = 0;

function test(name, actual, expected) {
    totalTests++;
    const passed = actual === expected;
    if (passed) passedTests++;
    const status = passed ? '✓' : '✗';
    console.log(`${status} ${name}`);
    if (!passed) {
        console.log(`  期待値: ${expected}, 実際: ${actual}`);
    }
    return passed;
}

// ==========================================
// 問題3: 配偶者控除の所得要件（48万→58万円）
// ==========================================
console.log('【問題3: 配偶者控除の所得要件】');
console.log('根拠：国税庁タックスアンサー No.1191\n');

// 配偶者の所得が58万円以下の場合、配偶者控除
const case3_1 = calculateSpouseDeduction(5000000, 580000, null);
test('配偶者所得58万円→配偶者控除適用', case3_1.type, '配偶者控除');
test('配偶者所得58万円→控除額38万円', case3_1.deduction, 380000);

// 配偶者の所得が58万円超の場合、配偶者特別控除
const case3_2 = calculateSpouseDeduction(5000000, 580001, null);
test('配偶者所得58万円超→配偶者特別控除適用', case3_2.type, '配偶者特別控除');

// 配偶者の所得が95万円の場合、配偶者特別控除（最大額）
const case3_3 = calculateSpouseDeduction(5000000, 950000, null);
test('配偶者所得95万円→配偶者特別控除38万円', case3_3.deduction, 380000);

console.log('');

// ==========================================
// 問題4: 配偶者控除額（38万/48万円に修正）
// ==========================================
console.log('【問題4: 配偶者控除額】');
console.log('根拠：国税庁タックスアンサー No.1191\n');

// 本人所得900万円以下、一般の配偶者
const case4_1 = calculateSpouseDeduction(5000000, 500000, null);
test('本人所得900万以下・一般配偶者→38万円', case4_1.deduction, 380000);

// 本人所得900万円以下、老人配偶者（70歳以上）
const case4_2 = calculateSpouseDeduction(5000000, 500000, '1954/01/01');
test('本人所得900万以下・老人配偶者→48万円', case4_2.deduction, 480000);

// 本人所得900万円超〜950万円以下、一般の配偶者
const case4_3 = calculateSpouseDeduction(9200000, 500000, null);
test('本人所得920万・一般配偶者→26万円', case4_3.deduction, 260000);

// 本人所得900万円超〜950万円以下、老人配偶者
const case4_4 = calculateSpouseDeduction(9200000, 500000, '1954/01/01');
test('本人所得920万・老人配偶者→32万円', case4_4.deduction, 320000);

// 本人所得950万円超〜1,000万円以下、一般の配偶者
const case4_5 = calculateSpouseDeduction(9700000, 500000, null);
test('本人所得970万・一般配偶者→13万円', case4_5.deduction, 130000);

// 本人所得950万円超〜1,000万円以下、老人配偶者
const case4_6 = calculateSpouseDeduction(9700000, 500000, '1954/01/01');
test('本人所得970万・老人配偶者→16万円', case4_6.deduction, 160000);

console.log('');

// ==========================================
// 問題5: 配偶者特別控除テーブル（令和7年版）
// ==========================================
console.log('【問題5: 配偶者特別控除テーブル】');
console.log('根拠：国税庁タックスアンサー No.1195\n');

// 配偶者所得58万円超〜95万円以下（本人900万円以下）
const case5_1 = calculateSpouseDeduction(5000000, 900000, null);
test('配偶者所得90万円・本人所得500万→38万円', case5_1.deduction, 380000);

// 配偶者所得95万円超〜100万円以下（本人900万円以下）
const case5_2 = calculateSpouseDeduction(5000000, 980000, null);
test('配偶者所得98万円・本人所得500万→36万円', case5_2.deduction, 360000);

// 配偶者所得100万円超〜105万円以下（本人900万円以下）
const case5_3 = calculateSpouseDeduction(5000000, 1020000, null);
test('配偶者所得102万円・本人所得500万→31万円', case5_3.deduction, 310000);

// 配偶者所得130万円超〜133万円以下（本人900万円以下）
const case5_4 = calculateSpouseDeduction(5000000, 1310000, null);
test('配偶者所得131万円・本人所得500万→3万円', case5_4.deduction, 30000);

// 配偶者所得58万円超〜95万円以下（本人900万円超〜950万円以下）
const case5_5 = calculateSpouseDeduction(9200000, 900000, null);
test('配偶者所得90万円・本人所得920万→26万円', case5_5.deduction, 260000);

// 配偶者所得58万円超〜95万円以下（本人950万円超〜1,000万円以下）
const case5_6 = calculateSpouseDeduction(9700000, 900000, null);
test('配偶者所得90万円・本人所得970万→13万円', case5_6.deduction, 130000);

console.log('');

// ==========================================
// 問題6: 特定親族特別控除（25万→63万円）
// ==========================================
console.log('【問題6: 特定親族特別控除】');
console.log('根拠：国税庁タックスアンサー No.1177\n');

// 特定親族の所得58万円超〜85万円以下（最大額63万円）
const case6_1 = calculateSpecificDependentDeduction(5000000, 800000, '2005/04/01');
test('特定親族所得80万円→63万円', case6_1.deduction, 630000);

// 特定親族の所得85万円超〜90万円以下
const case6_2 = calculateSpecificDependentDeduction(5000000, 880000, '2005/04/01');
test('特定親族所得88万円→61万円', case6_2.deduction, 610000);

// 特定親族の所得90万円超〜95万円以下
const case6_3 = calculateSpecificDependentDeduction(5000000, 920000, '2005/04/01');
test('特定親族所得92万円→51万円', case6_3.deduction, 510000);

// 特定親族の所得120万円超〜123万円以下（最小額3万円）
const case6_4 = calculateSpecificDependentDeduction(5000000, 1220000, '2005/04/01');
test('特定親族所得122万円→3万円', case6_4.deduction, 30000);

// 特定親族の所得58万円以下（通常の扶養控除）
const case6_5 = calculateSpecificDependentDeduction(5000000, 580000, '2005/04/01');
test('特定親族所得58万円以下→控除なし', case6_5.deduction, 0);
test('特定親族所得58万円以下→通常の扶養控除適用メッセージ', case6_5.eligible, false);

// 特定親族の所得123万円超（控除なし）
const case6_6 = calculateSpecificDependentDeduction(5000000, 1230001, '2005/04/01');
test('特定親族所得123万円超→控除なし', case6_6.deduction, 0);

console.log('');

// ==========================================
// 問題7: 所得金額調整控除（Math.floor→Math.ceil）
// ==========================================
console.log('【問題7: 所得金額調整控除】');
console.log('根拠：国税庁タックスアンサー No.1411\n');

// 給与収入900万円の場合
const case7_1 = calculateIncomeAdjustmentDeduction(9000000, true, false);
const expected7_1 = Math.ceil((9000000 - 8500000) * 0.1);
test('給与収入900万円→控除額5万円', case7_1.deduction, expected7_1);
console.log(`  計算式: (900万 - 850万) × 10% = ${expected7_1.toLocaleString()}円（切り上げ）`);

// 給与収入1,000万円の場合（上限）
const case7_2 = calculateIncomeAdjustmentDeduction(10000000, true, false);
const expected7_2 = Math.ceil((10000000 - 8500000) * 0.1);
test('給与収入1,000万円→控除額15万円', case7_2.deduction, expected7_2);
console.log(`  計算式: (1,000万 - 850万) × 10% = ${expected7_2.toLocaleString()}円（上限15万円）`);

// 給与収入1,200万円の場合（1,000万円上限適用）
const case7_3 = calculateIncomeAdjustmentDeduction(12000000, true, false);
const expected7_3 = Math.ceil((10000000 - 8500000) * 0.1);
test('給与収入1,200万円→控除額15万円（1,000万円上限）', case7_3.deduction, expected7_3);
console.log(`  計算式: (1,000万（上限） - 850万) × 10% = ${expected7_3.toLocaleString()}円`);

// 端数の切り上げテスト（例: 860万円の場合）
const case7_4 = calculateIncomeAdjustmentDeduction(8600000, true, false);
const expected7_4 = Math.ceil((8600000 - 8500000) * 0.1);
test('給与収入860万円→端数切り上げ', case7_4.deduction, expected7_4);
console.log(`  計算式: (860万 - 850万) × 10% = 10,000円（切り上げ）`);

console.log('');

// ==========================================
// 統合テスト
// ==========================================
console.log('【統合テスト】\n');

// ケース1: 年収400万円、配偶者あり（配偶者所得50万円）
const salary1 = calculateSalaryIncome(4000000);
const basicDeduction1 = calculateBasicDeduction(salary1);
const spouseDeduction1 = calculateSpouseDeduction(salary1, 500000, null);
console.log('ケース1: 年収400万円、配偶者所得50万円');
console.log(`  給与所得: ${salary1.toLocaleString()}円`);
console.log(`  基礎控除: ${basicDeduction1.toLocaleString()}円`);
console.log(`  配偶者控除: ${spouseDeduction1.deduction.toLocaleString()}円（${spouseDeduction1.type}）`);
test('ケース1・給与所得', salary1, 2760000);
test('ケース1・基礎控除', basicDeduction1, 880000);
test('ケース1・配偶者控除', spouseDeduction1.deduction, 380000);
console.log('');

// ケース2: 年収600万円、配偶者あり（配偶者所得100万円）
const salary2 = calculateSalaryIncome(6000000);
const basicDeduction2 = calculateBasicDeduction(salary2);
const spouseDeduction2 = calculateSpouseDeduction(salary2, 1000000, null);
console.log('ケース2: 年収600万円、配偶者所得100万円');
console.log(`  給与所得: ${salary2.toLocaleString()}円`);
console.log(`  基礎控除: ${basicDeduction2.toLocaleString()}円`);
console.log(`  配偶者特別控除: ${spouseDeduction2.deduction.toLocaleString()}円（${spouseDeduction2.type}）`);
test('ケース2・給与所得', salary2, 4360000);
test('ケース2・基礎控除', basicDeduction2, 680000);
test('ケース2・配偶者特別控除', spouseDeduction2.deduction, 360000);
console.log('');

// ケース3: 年収1,000万円、特定親族あり（所得80万円）、所得金額調整控除適用
const salary3 = calculateSalaryIncome(10000000);
const basicDeduction3 = calculateBasicDeduction(salary3);
const specificDependent3 = calculateSpecificDependentDeduction(salary3, 800000, '2005/04/01');
const incomeAdjustment3 = calculateIncomeAdjustmentDeduction(10000000, false, true);
console.log('ケース3: 年収1,000万円、特定親族所得80万円、23歳未満扶養親族あり');
console.log(`  給与所得: ${salary3.toLocaleString()}円`);
console.log(`  基礎控除: ${basicDeduction3.toLocaleString()}円`);
console.log(`  特定親族特別控除: ${specificDependent3.deduction.toLocaleString()}円`);
console.log(`  所得金額調整控除: ${incomeAdjustment3.deduction.toLocaleString()}円`);
test('ケース3・給与所得', salary3, 8050000);
test('ケース3・基礎控除', basicDeduction3, 580000);
test('ケース3・特定親族特別控除', specificDependent3.deduction, 630000);
test('ケース3・所得金額調整控除', incomeAdjustment3.deduction, 150000);
console.log('');

// ==========================================
// テスト結果サマリー
// ==========================================
console.log('=== テスト結果サマリー ===');
console.log(`合格: ${passedTests}/${totalTests}`);
console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log('\n✓ 全てのテストに合格しました！');
} else {
    console.log(`\n✗ ${totalTests - passedTests}件のテストが失敗しました。`);
    process.exit(1);
}
