import { CSSProperties } from 'react';

/**
 * 共通スタイル定数
 *
 * 頻繁に使用されるインラインスタイルを定数として定義
 */

/**
 * タイトルシーンの説明文スタイル
 */
export const TITLE_DESCRIPTION_STYLE: CSSProperties = {
  fontSize: 12,
  opacity: 0.8,
  marginTop: 6,
  marginBottom: 8
};

/**
 * マップ情報パネルのエリア情報スタイル
 */
export const AREA_INFO_STYLE: CSSProperties = {
  textAlign: 'center',
  padding: '4px 0',
  fontSize: '14px',
  fontWeight: 'bold'
};

/**
 * マップ情報パネルのクリア条件バナー基本スタイル
 */
export const CLEAR_CONDITION_BASE_STYLE: CSSProperties = {
  textAlign: 'center',
  padding: '6px',
  fontSize: '13px',
  color: 'white',
  fontWeight: 'bold',
  borderRadius: '4px',
  margin: '4px auto',
  maxWidth: '90%'
};

/**
 * 中央揃えスタイル
 */
export const CENTER_TEXT_STYLE: CSSProperties = {
  textAlign: 'center'
};

/**
 * 説明文用の小さいフォントスタイル
 */
export const SMALL_TEXT_STYLE: CSSProperties = {
  fontSize: 12,
  opacity: 0.8
};

/**
 * ヘルプテキスト用スタイル（設定画面等で頻繁に使用）
 */
export const HELP_TEXT_STYLE: CSSProperties = {
  display: 'block',
  opacity: 0.8
};

/**
 * マージン付きヘルプテキスト用スタイル
 */
export const HELP_TEXT_WITH_MARGIN_STYLE: CSSProperties = {
  display: 'block',
  opacity: 0.8,
  marginBottom: 8
};
