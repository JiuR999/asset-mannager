/**
 * 液态悬浮底栏风格切换。
 * - glass：静态悬浮胶囊 + 磨砂玻璃，选中项为独立高亮块
 * - liquid：在悬浮胶囊基础上，选中指示器呈液态 blob，随切换流动形变
 * 改这一行即可预览两种效果，选走后固化。
 */
export type NavStyle = 'glass' | 'liquid'

export const NAV_STYLE: NavStyle = 'glass'