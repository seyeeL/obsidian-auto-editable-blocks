var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __hasOwnProp = Object.prototype.hasOwnProperty
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
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
var __toCommonJS = mod => __copyProps(__defProp({}, '__esModule', { value: true }), mod)

// main.ts
var main_exports = {}
__export(main_exports, {
  default: () => AutoEditableBlocksPlugin
})
module.exports = __toCommonJS(main_exports)
var import_obsidian = require('obsidian')
var DEFAULT_SETTINGS = {
  enableOnStartup: true,
  delay: 200
}
var AutoEditableBlocksPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings()
    const statusBarItem = this.addStatusBarItem()
    statusBarItem.setText('Auto Editable: ON')
    this.addSettingTab(new AutoEditableBlocksSettingTab(this.app, this))

    const handleActiveView = view => {
      if (!view || !view.editMode) return
      setTimeout(() => {
        try {
          if (typeof view.isEditingBlock === 'undefined') {
            view.isEditingBlock = true
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

    const getActiveMarkdownView = () => {
      const activeLeaf = this.app.workspace.activeLeaf
      if (activeLeaf && activeLeaf.view && activeLeaf.view.getViewType() === 'markdown') {
        return activeLeaf.view
      }
      return null
    }

    this.registerEvent(
      this.app.workspace.on('file-open', () => {
        const view = getActiveMarkdownView()
        if (view) {
          handleActiveView(view)
        }
      })
    )

    if (this.settings.enableOnStartup) {
      const view = getActiveMarkdownView()
      if (view) {
        handleActiveView(view)
      }
    }

    this.addCommand({
      id: 'toggle-auto-editable',
      name: 'Toggle Auto Editable Blocks',
      callback: () => {
        this.settings.enableOnStartup = !this.settings.enableOnStartup
        this.saveSettings()
        statusBarItem.setText(`Auto Editable: ${this.settings.enableOnStartup ? 'ON' : 'OFF'}`)
        if (this.settings.enableOnStartup) {
          const view = getActiveMarkdownView()
          if (view) {
            handleActiveView(view)
          }
        }
      }
    })
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }
  async saveSettings() {
    await this.saveData(this.settings)
  }
}
var AutoEditableBlocksSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin)
    this.plugin = plugin
  }
  display() {
    const { containerEl } = this
    containerEl.empty()
    containerEl.createEl('h2', { text: 'Auto Editable Blocks Settings' })
    new import_obsidian.Setting(containerEl)
      .setName('Enable on startup')
      .setDesc('Automatically enable auto-editable blocks when Obsidian starts')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableOnStartup).onChange(async value => {
          this.plugin.settings.enableOnStartup = value
          await this.plugin.saveSettings()
        })
      )
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
