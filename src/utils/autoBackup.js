import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';
import { taskToExcelRow } from './excelFormat';

/**
 * 自动备份系统
 * - 每天首次变动时备份
 * - 文件名格式: backup_YYYY-MM-DD.json
 * - 存储在 backups/ 目录
 */

// 获取今天的日期字符串
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

// 获取上次备份日期
async function getLastBackupDate() {
  const { value } = await Preferences.get({ key: 'lastBackupDate' });
  return value || '';
}

// 更新上次备份日期
async function setLastBackupDate(date) {
  await Preferences.set({ key: 'lastBackupDate', value: date });
}

// 获取所有需要备份的数据
async function getAllData() {
  const keys = ['users', 'currentUser', 'userInfo', 'phoneMapping', 'security', 'lastBackupDate'];
  const data = {};
  
  // 获取基础数据
  for (const key of keys) {
    const { value } = await Preferences.get({ key });
    if (value) data[key] = value;
  }
  
  // 获取所有用户的任务数据
  const { value: usersStr } = await Preferences.get({ key: 'users' });
  if (usersStr) {
    const users = JSON.parse(usersStr);
    for (const username in users) {
      const tasksKey = `tasks_${username}`;
      const deletedKey = `deletedTasks_${username}`;
      const notifiedKey = `notified_reminders_${username}`;
      
      const { value: tasks } = await Preferences.get({ key: tasksKey });
      const { value: deleted } = await Preferences.get({ key: deletedKey });
      const { value: notified } = await Preferences.get({ key: notifiedKey });
      
      if (tasks) data[tasksKey] = tasks;
      if (deleted) data[deletedKey] = deleted;
      if (notified) data[notifiedKey] = notified;
    }
  }
  
  return data;
}

// 执行备份（支持强制备份）
export async function performBackup(force = false) {
  try {
    const today = getTodayDate();
    const lastBackup = await getLastBackupDate();
    
    // 今天已备份过，且非强制备份，跳过
    if (!force && today === lastBackup) {
      return { success: true, skipped: true };
    }
    
    // 获取所有数据
    const data = await getAllData();
    const content = JSON.stringify(data, null, 2);
    
    // 保存到文件
    const timestamp = force ? `${today}_${Date.now()}` : today;
    const fileName = `TODO-App_backup_${timestamp}.json`;
    await Filesystem.writeFile({
      path: `TODO-App-backups/${fileName}`,
      data: content,
      directory: Directory.Documents,
      recursive: true
    });
    
    // 更新备份日期
    if (!force) {
      await setLastBackupDate(today);
    }
    
    return { success: true, fileName, date: today, forced: force };
  } catch (error) {
    console.error('备份失败:', error);
    return { success: false, error: error.message };
  }
}

// 恢复备份
export async function restoreBackup(fileName) {
  try {
    const { data } = await Filesystem.readFile({
      path: `TODO-App-backups/${fileName}`,
      directory: Directory.Documents
    });
    
    const backupData = JSON.parse(data);
    
    // 恢复所有数据
    for (const key in backupData) {
      await Preferences.set({ key, value: backupData[key] });
    }
    
    return { success: true };
  } catch (error) {
    console.error('恢复失败:', error);
    return { success: false, error: error.message };
  }
}

// 列出所有备份文件
export async function listBackups() {
  try {
    const { files } = await Filesystem.readdir({
      path: 'TODO-App-backups',
      directory: Directory.Documents
    });
    
    return files
      .filter(f => f.name.startsWith('TODO-App_backup_') && f.name.endsWith('.json'))
      .sort()
      .reverse(); // 最新的在前
  } catch (error) {
    return [];
  }
}

// 手动备份（JSON + Excel）
export async function manualBackup() {
  try {
    const timestamp = Date.now();
    const today = getTodayDate();
    const data = await getAllData();
    
    // 1. 保存JSON格式
    const jsonContent = JSON.stringify(data, null, 2);
    const jsonFileName = `TODO-App_backup_${today}_${timestamp}.json`;
    await Filesystem.writeFile({
      path: `TODO-App-backups/${jsonFileName}`,
      data: jsonContent,
      directory: Directory.Documents,
      recursive: true
    });
    
    // 2. 生成Excel格式
    const { value: usersStr } = await Preferences.get({ key: 'users' });
    const excelData = [];
    
    if (usersStr) {
      const users = JSON.parse(usersStr);
      for (const username in users) {
        const { value: tasksStr } = await Preferences.get({ key: `tasks_${username}` });
        if (tasksStr) {
          const tasks = JSON.parse(tasksStr);
          tasks.forEach(task => {
            excelData.push(taskToExcelRow({ ...task, user_id: username }, true));
          });
        }
      }
    }
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '任务数据');
    
    const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const excelFileName = `TODO-App_backup_${today}_${timestamp}.xlsx`;
    
    await Filesystem.writeFile({
      path: `TODO-App-backups/${excelFileName}`,
      data: excelBuffer,
      directory: Directory.Documents,
      recursive: true
    });
    
    return { 
      success: true, 
      jsonFile: jsonFileName, 
      excelFile: excelFileName,
      taskCount: excelData.length
    };
  } catch (error) {
    console.error('手动备份失败:', error);
    return { success: false, error: error.message };
  }
}
