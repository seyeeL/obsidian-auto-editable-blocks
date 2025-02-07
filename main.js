// 定义一些辅助函数，用于处理对象属性和模块导出
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __hasOwnProp = Object.prototype.hasOwnProperty

// 导出函数：将所有属性导出到目标对象
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}

// 复制属性函数：将属性从一个对象复制到另一个对象
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        })
  }
  return to
}

// 将模块转换为 CommonJS 格式
var __toCommonJS = mod => __copyProps(__defProp({}, '__esModule', { value: true }), mod)

// 主模块文件
var main_exports = {}
__export(main_exports, {
  default: () => AutoEditableBlocksPlugin
})
module.exports = __toCommonJS(main_exports)

// 导入 Obsidian API
var import_obsidian = require('obsidian')

// 默认插件设置
var DEFAULT_SETTINGS = {
  enableOnStartup: true, // 启动时是否启用
  delay: 200 // 处理延迟时间（毫秒）
}

// 自动可编辑块插件主类
var AutoEditableBlocksPlugin = class extends import_obsidian.Plugin {
  // 插件加载时的初始化
  async onload() {
    // 加载设置
    await this.loadSettings()

    // 添加状态栏项目
    const statusBarItem = this.addStatusBarItem()
    statusBarItem.setText('Auto Editable: ON')

    // 添加设置选项卡
    this.addSettingTab(new AutoEditableBlocksSettingTab(this.app, this))

    // 处理活动视图的函数
    const handleActiveView = view => {
      // 如果视图不存在或不在编辑模式，则返回
      if (!view || !view.editMode) return

      // 延迟处理块
      setTimeout(() => {
        try {
          // 检查是否已经处理过该视图
          if (typeof view.isEditingBlock === 'undefined') {
            view.isEditingBlock = true
            // 遍历所有块并使其可编辑
            view.editMode._children.forEach(block => {
              try {
                block.editable = true
                block.showEditor()
              } catch (error) {
                console.error('Error showing editor for block:', error)
              }
            })
          }
        } catch (error) {
          console.error('Error handling view:', error)
        }
      }, this.settings.delay)
    }

    // 获取当前活动的 Markdown 视图
    const getActiveMarkdownView = () => {
      const activeLeaf = this.app.workspace.activeLeaf
      if (activeLeaf && activeLeaf.view && activeLeaf.view.getViewType() === 'markdown') {
        return activeLeaf.view
      }
      return null
    }

    // 注册文件打开事件监听器
    this.registerEvent(
      this.app.workspace.on('file-open', () => {
        const view = getActiveMarkdownView()
        if (view) {
          handleActiveView(view)
        }
      })
    )

    // 如果设置为启动时启用，则处理当前视图
    if (this.settings.enableOnStartup) {
      const view = getActiveMarkdownView()
      if (view) {
        handleActiveView(view)
      }
    }

    // 添加切换命令
    this.addCommand({
      id: 'toggle-auto-editable',
      name: 'Toggle Auto Editable Blocks',
      callback: () => {
        // 切换启用状态
        this.settings.enableOnStartup = !this.settings.enableOnStartup
        this.saveSettings()
        // 更新状态栏显示
        statusBarItem.setText(`Auto Editable: ${this.settings.enableOnStartup ? 'ON' : 'OFF'}`)
        // 如果启用，则处理当前视图
        if (this.settings.enableOnStartup) {
          const view = getActiveMarkdownView()
          if (view) {
            handleActiveView(view)
          }
        }
      }
    })
  }

  // 加载插件设置
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  // 保存插件设置
  async saveSettings() {
    await this.saveData(this.settings)
  }
}

// 插件设置选项卡类
var AutoEditableBlocksSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  // 显示设置界面
  display() {
    const { containerEl } = this
    containerEl.empty()

    // 创建设置标题
    containerEl.createEl('h2', { text: 'Auto Editable Blocks Settings' })

    // 添加启动时启用选项
    new import_obsidian.Setting(containerEl)
      .setName('Enable on startup')
      .setDesc('Automatically enable auto-editable blocks when Obsidian starts')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableOnStartup).onChange(async value => {
          this.plugin.settings.enableOnStartup = value
          await this.plugin.saveSettings()
        })
      )

    // 添加处理延迟设置选项
    new import_obsidian.Setting(containerEl)
      .setName('Processing delay (ms)')
      .setDesc('Delay before processing blocks after file open (in milliseconds)')
      .addText(text =>
        text
          .setPlaceholder('200')
          .setValue(String(this.plugin.settings.delay))
          .onChange(async value => {
            const delay = Number(value)
            if (!isNaN(delay) && delay >= 0) {
              this.plugin.settings.delay = delay
              await this.plugin.saveSettings()
            }
          })
      )
  }
}
