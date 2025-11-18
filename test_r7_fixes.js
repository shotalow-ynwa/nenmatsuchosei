/**
 * 令和7年版の修正を検証するテストスクリプト
 */

// calculator.jsを読み込む（Node.js環境でテスト）
const fs = require('fs');
eval(fs.readFileSync('./calculator.js', 'utf8'));

console.log('=== 令和7年版 修正内容の検証 ===\n');

// ==========================================
// 1. 給与所得控除のテスト（最低保障額65万円）
// ==========================================
console.log('【1. 給与所得控除の検証】');
console.log('根拠：国税庁「令和7年度税制改正Q&A」1-3\n');

const salaryTests = [
    { salary: 600000, expectedDeduction: 650000, expectedIncome: 0 },
    { salary: 1000000, expectedDeduction: 650000, expectedIncome: 350000 },
    { salary: 1625000, expectedDeduction: 650000, expectedIncome: 975000 },
    { salary: 1700000, expectedDeduction: 580000, expectedIncome: 1120000 },
    { salary: 3000000, expectedDeduction: 980000, expectedIncome: 2020000 },
    { salary: 9000000, expectedDeduction: 1950000, expectedIncome: 7050000 },
];

salaryTests.forEach(test => {
    const income = calculateSalaryIncome(test.salary);
    const deduction = test.salary - income;
    const status = income === test.expectedIncome ? '✓' : '✗';

    console.log(`${status} 給与収入: ${test.salary.toLocaleString()}円`);
    console.log(`  控除額: ${deduction.toLocaleString()}円 (期待値: ${test.expectedDeduction.toLocaleString()}円)`);
    console.log(`  給与所得: ${income.toLocaleString()}円 (期待値: ${test.expectedIncome.toLocaleString()}円)`);
    console.log('');
});

// ==========================================
// 2. 基礎控除テーブルのテスト
// ==========================================
console.log('\n【2. 基礎控除テーブルの検証】');
console.log('根拠：国税庁「令和7年分の年末調整のための算出所得税額の速算表」\n');

const basicDeductionTests = [
    { totalIncome: 1000000, expected: 950000 },     // 132万円以下
    { totalIncome: 1320000, expected: 950000 },     // 132万円ちょうど
    { totalIncome: 2000000, expected: 880000 },     // 132万円超〜336万円以下
    { totalIncome: 4000000, expected: 680000 },     // 336万円超〜489万円以下
    { totalIncome: 5000000, expected: 630000 },     // 489万円超〜655万円以下
    { totalIncome: 10000000, expected: 580000 },    // 655万円超〜2,350万円以下
    { totalIncome: 23500000, expected: 580000 },    // 2,350万円ちょうど
    { totalIncome: 23600000, expected: 480000 },    // 2,350万円超〜2,400万円以下
    { totalIncome: 24000000, expected: 480000 },    // 2,400万円ちょうど
    { totalIncome: 24100000, expected: 320000 },    // 2,400万円超〜2,450万円以下
    { totalIncome: 24500000, expected: 320000 },    // 2,450万円ちょうど
    { totalIncome: 24600000, expected: 160000 },    // 2,450万円超〜2,500万円以下
    { totalIncome: 25000000, expected: 160000 },    // 2,500万円ちょうど
    { totalIncome: 25100000, expected: 0 },         // 2,500万円超
    { totalIncome: 30000000, expected: 0 },         // 2,500万円超
];

basicDeductionTests.forEach(test => {
    const deduction = calculateBasicDeduction(test.totalIncome);
    const status = deduction === test.expected ? '✓' : '✗';

    console.log(`${status} 合計所得: ${test.totalIncome.toLocaleString()}円 → 基礎控除: ${deduction.toLocaleString()}円 (期待値: ${test.expected.toLocaleString()}円)`);
});

// ==========================================
// 3. 統合テスト（給与所得→基礎控除）
// ==========================================
console.log('\n【3. 統合テスト（給与収入→給与所得→基礎控除）】\n');

const integratedTests = [
    { salary: 1000000, expectedSalaryIncome: 350000, expectedBasicDeduction: 950000 },
    { salary: 3000000, expectedSalaryIncome: 2020000, expectedBasicDeduction: 880000 },
    { salary: 5000000, expectedSalaryIncome: 3560000, expectedBasicDeduction: 880000 },
    { salary: 10000000, expectedSalaryIncome: 8050000, expectedBasicDeduction: 580000 },
];

integratedTests.forEach(test => {
    const salaryIncome = calculateSalaryIncome(test.salary);
    const basicDeduction = calculateBasicDeduction(salaryIncome);

    const salaryStatus = salaryIncome === test.expectedSalaryIncome ? '✓' : '✗';
    const basicStatus = basicDeduction === test.expectedBasicDeduction ? '✓' : '✗';

    console.log(`給与収入: ${test.salary.toLocaleString()}円`);
    console.log(`  ${salaryStatus} 給与所得: ${salaryIncome.toLocaleString()}円 (期待値: ${test.expectedSalaryIncome.toLocaleString()}円)`);
    console.log(`  ${basicStatus} 基礎控除: ${basicDeduction.toLocaleString()}円 (期待値: ${test.expectedBasicDeduction.toLocaleString()}円)`);
    console.log('');
});

console.log('=== 検証完了 ===');
