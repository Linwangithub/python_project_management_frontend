/**
 * 终端控制字符配置。
 *
 * 作用：
 * - 集中维护 WebSocket 终端需要使用的控制字符。
 * - 避免业务代码中出现难以理解的转义字符字面量。
 */

/** Tab 补全候选项之间使用的内部分隔符。 */
export const TERMINAL_CANDIDATE_SEPARATOR = String.fromCharCode(1)

/** Tab 补全候选项在终端显示时使用的可见分隔符。 */
export const TERMINAL_CANDIDATE_DISPLAY_SEPARATOR = '  '

/** Ctrl+C 输入对应的控制字符。 */
export const TERMINAL_CTRL_C_INPUT = String.fromCharCode(3)

/** Ctrl+C 发送失败时在终端区域显示的兜底文本。 */
export const TERMINAL_CTRL_C_DISPLAY_TEXT = '^C'

/** 发送给远程终端的换行控制字符。 */
export const TERMINAL_NEWLINE_INPUT = String.fromCharCode(10)

/** 终端输出中的空行文本。 */
export const TERMINAL_BLANK_LINE = ''

/** 终端空行显示占位字符，保证空行在页面上有高度。 */
export const TERMINAL_EMPTY_LINE_PLACEHOLDER = String.fromCharCode(160)
