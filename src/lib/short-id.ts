/** 取 ID 去横杠后的尾部 6 位作为短编号 */
export function shortTaskId(id: string) {
	return id.replace(/-/g, '').slice(-6)
}
