import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

const DB_NAME = 'todo_app.db'
const BACKUP_DIR = 'TODO-App-backups'

class SQLiteService {
  constructor() {
    this.sqlite = null
    this.db = null
    this.isNative = Capacitor.isNativePlatform()
  }

  // 初始化
  async init() {
    try {
      // Web平台：SQLite不支持，建议使用MySQL
      if (!this.isNative) {
        return { 
          success: false, 
          message: '❌ SQLite仅支持Android/iOS\n💡 网页端请使用MySQL远程备份' 
        }
      }
      
      // 确保备份目录存在（仅原生平台）
      if (this.isNative) {
        try {
          await Filesystem.mkdir({
            path: BACKUP_DIR,
            directory: Directory.Documents,
            recursive: true
          })
        } catch (e) {
          // 目录已存在，忽略错误
        }
      }

      // 创建SQLite连接
      this.sqlite = new SQLiteConnection(CapacitorSQLite)
      
      this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
      await this.db.open()
      await this.createTables()
      
      // Android数据库实际位置
      const location = this.isNative 
        ? `应用私有目录 (/data/data/com.todo.app/databases/${DB_NAME})` 
        : 'IndexedDB (浏览器存储)'
      
      return { success: true, message: `✅ SQLite连接成功！\n📁 数据库位置: ${location}\n💡 提示: Android数据库在应用私有目录，需root权限访问` }
    } catch (error) {
      console.error('SQLite初始化失败:', error)
      return { success: false, message: error.message }
    }
  }

  // 创建表
  async createTables() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        username TEXT,
        data TEXT
      );
    `)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY,
        username TEXT,
        data TEXT
      );
    `)
  }

  // 同步数据
  async sync(username, tasks, collections) {
    if (!this.db) {
      const initResult = await this.init()
      if (!initResult.success) {
        return initResult
      }
    }

    try {
      // 清空旧数据（分开执行）
      await this.db.execute(`DELETE FROM tasks WHERE username = '${username}'`)
      await this.db.execute(`DELETE FROM collections WHERE username = '${username}'`)

      // 逐条插入任务（最简单的方式）
      let successCount = 0
      for (const task of tasks) {
        try {
          await this.db.execute(`INSERT INTO tasks (id, username, data) VALUES (${task.id}, '${username}', 'task')`)
          successCount++
        } catch (e) {
          console.error(`插入任务${task.id}失败:`, e)
        }
      }

      // 逐条插入文件夹
      let collCount = 0
      for (const coll of (collections || [])) {
        try {
          await this.db.execute(`INSERT INTO collections (id, username, data) VALUES (${coll.id}, '${username}', 'coll')`)
          collCount++
        } catch (e) {
          console.error(`插入文件夹${coll.id}失败:`, e)
        }
      }

      return { 
        success: true, 
        message: `同步成功: ${successCount} 个任务, ${collCount} 个文件夹` 
      }
    } catch (error) {
      console.error('SQLite sync error:', error)
      return { success: false, message: error.message }
    }
  }

  // 导出数据库文件到Documents（用户可访问）
  async exportDatabase() {
    if (!this.isNative) {
      return { success: false, message: '❌ 仅支持Android/iOS平台' }
    }

    try {
      // 1. 导出数据库到临时位置
      const exportResult = await this.sqlite.exportToJson(DB_NAME)
      
      // 2. 保存到Documents目录
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `${DB_NAME}_${timestamp}.json`
      
      await Filesystem.writeFile({
        path: `${BACKUP_DIR}/${filename}`,
        data: JSON.stringify(exportResult.export, null, 2),
        directory: Directory.Documents,
        encoding: 'utf8'
      })

      // 3. 获取文件URI
      const fileUri = await Filesystem.getUri({
        path: `${BACKUP_DIR}/${filename}`,
        directory: Directory.Documents
      })

      return {
        success: true,
        message: `✅ 数据库已导出\n📁 位置: Documents/${BACKUP_DIR}/${filename}`,
        path: fileUri.uri
      }
    } catch (error) {
      console.error('导出数据库失败:', error)
      return { success: false, message: `❌ 导出失败: ${error.message}` }
    }
  }
}

export const sqliteService = new SQLiteService()

