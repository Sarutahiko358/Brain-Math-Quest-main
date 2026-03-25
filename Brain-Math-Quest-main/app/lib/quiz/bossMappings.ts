import { QuizType } from './types';

// Library mode boss default quiz type mappings per area
// Keep processor-friendly types; avoid FRACTION_COMPARE in early areas
export function getLibraryBossQuizTypes(areaId: number): QuizType[] | null {
    switch (areaId) {
        case 1:
            // 数の門: 基礎混合（和・比較・順序・最大最小・穴埋め）
            return ['SUM', 'COMPARE', 'ORDER', 'MAX_MIN', 'MISSING'];
        case 2:
            // 加算の草原: 足し算系中心
            return ['SUM', 'ORDER_SUM', 'PAIR'];
        case 3:
            // 減算の森: 比較や差・範囲差
            return ['COMPARE', 'PAIR_DIFF', 'RANGE_DIFF', 'MISSING'];
        case 4:
            // 乗算の山: かけ算系を含む比較/最大最小(式)・因数ペア
            return ['COMPARE', 'MAX_MIN_EXPR', 'FACTOR_PAIR'];
        case 5:
            // 除算の谷: 余りや公約数など（軽めの数論）
            return ['MODULO', 'COMMON_DIVISOR', 'DIVISOR_COUNT'];
        case 6:
            // 四則の神殿: 四則混合（比較・式比較・順序/最大最小(式)）
            return ['SUM', 'COMPARE', 'COMPARE_EXPR', 'ORDER_SUM', 'MAX_MIN_EXPR'];
        default:
            return null;
    }
}
