/**
 * 终端输出清洗配置。
 *
 * 作用：
 * - 集中维护 ANSI 转义序列、不可见控制字符等终端输出清洗规则。
 * - 保证终端输出在页面展示时不会夹带异常控制字符。
 */

/** ANSI escape 序列正则，用于移除颜色、光标移动等控制片段。 */
export const ANSI_ESCAPE_PATTERN = String.raw`\x1B\[[0-9;?]*[ -/]*[@-~]`

/** OSC escape 序列正则，用于移除终端标题等不会在网页终端中直接展示的控制片段。 */
export const OSC_ESCAPE_PATTERN = String.raw`\x1B\][^\x07]*(?:\x07|\x1B\\)`

/** 残留终端控制文本正则，用于兜底移除浏览器显示出的 bracketed paste 和标题控制片段。 */
export const RESIDUAL_TERMINAL_CONTROL_PATTERN = String.raw`(?:\[\?2004[hl]|\]0;[^\n\x07\x1B]*?(?:\x07|(?=\x1B\[\?2004[hl])|(?=\[\?2004[hl])))`

/** 不可见控制字符正则，用于过滤非换行类控制字符。 */
export const CONTROL_CHAR_PATTERN = String.raw`[\x00-\x08\x0B-\x1F\x7F]`

/** Unicode replacement character，用于移除解码失败时产生的替换符。 */
export const REPLACEMENT_CHARACTER = String.fromCharCode(65533)
