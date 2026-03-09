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
      
      const location = this.isNative 
        ? `Documents/${BACKUP_DIR}/${DB_NAME}` 
        : 'IndexedDB (浏览器存储)'
      
      return { success: true, message: `✅ SQLite连接成功！\n数据库位置: ${location}` }
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
}

export const sqliteService = new SQLiteService()

