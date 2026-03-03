import { describe, it, expect } from 'vitest'
import { detectListItems } from '../smartTaskParser'

describe('smartTaskParser', () => {
  describe('列表项识别', () => {
    it('应该识别数字列表（1. 格式）', () => {
      const text = `任务描述：
1. 第一步
2. 第二步
3. 第三步`

      const items = detectListItems(text)

      expect(items).toHaveLength(3)
      expect(items[0]).toBe('第一步')
      expect(items[1]).toBe('第二步')
      expect(items[2]).toBe('第三步')
    })

    it('应该识别数字列表（1、格式）', () => {
      const text = `1、准备材料
2、开始制作
3、完成验收`

      const items = detectListItems(text)

      expect(items).toHaveLength(3)
      expect(items[0]).toBe('准备材料')
    })

    it('应该识别破折号列表', () => {
      const text = `- 任务A
- 任务B
- 任务C`

      const items = detectListItems(text)

      expect(items).toHaveLength(3)
      expect(items[0]).toBe('任务A')
    })

    it('应该识别星号列表', () => {
      const text = `* 项目1
* 项目2
* 项目3`

      const items = detectListItems(text)

      expect(items).toHaveLength(3)
    })

    it('应该识别圆点列表', () => {
      const text = `• 步骤一
• 步骤二
• 步骤三`

      const items = detectListItems(text)

      expect(items).toHaveLength(3)
    })

    it('应该过滤空行和空白项', () => {
      const text = `1. 有效项

2. 另一个有效项
3. `

      const items = detectListItems(text)

      expect(items).toHaveLength(2)
    })

    it('应该在少于2项时返回空数组', () => {
      const text = '1. 只有一项'

      const items = detectListItems(text)

      expect(items).toHaveLength(0)
    })

    it('应该处理混合格式', () => {
      const text = `1. 第一项
- 第二项
* 第三项`

      const items = detectListItems(text)

      expect(items.length).toBeGreaterThanOrEqual(2)
    })
  })
})
