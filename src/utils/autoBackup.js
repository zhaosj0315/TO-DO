import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
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
    
    // 在 Web 环境下使用 Blob，在原生环境下使用 base64
    if (Capacitor.getPlatform() === 'web') {
      // Web 环境：使用浏览器下载
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // 原生环境：使用 Filesystem API
      await Filesystem.writeFile({
        path: `TODO-App-backups/${fileName}`,
        data: content,
        directory: Directory.Documents,
        recursive: true
      });
    }
    
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
  const platform = Capacitor.getPlatform();
  
  try {
    let backupData;
    
    if (platform === 'web') {
      // Web端：从localStorage读取
      const backupsStr = localStorage.getItem('backupFiles') || '[]';
      const backups = JSON.parse(backupsStr);
      const backup = backups.find(b => b.name === fileName);
      
      if (!backup || !backup.data) {
        throw new Error('备份文件不存在');
      }
      
      backupData = backup.data;
    } else {
      // 移动端：从文件系统读取
      const { data } = await Filesystem.readFile({
        path: `TODO-App-backups/${fileName}`,
        directory: Directory.Documents
      });
      backupData = JSON.parse(data);
    }
    
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
  const platform = Capacitor.getPlatform();
  
  try {
    if (platform === 'web') {
      // Web端：从localStorage读取
      const backupsStr = localStorage.getItem('backupFiles') || '[]';
      const backups = JSON.parse(backupsStr);
      return backups.sort((a, b) => b.name.localeCompare(a.name)); // 最新的在前
    } else {
      // 移动端：从文件系统读取
      const { files } = await Filesystem.readdir({
        path: 'TODO-App-backups',
        directory: Directory.Documents
      });
      
      // 只过滤 .json 文件，不限制文件名前缀
      return files
        .filter(f => f.name.endsWith('.json'))
        .map(f => ({ name: f.name, type: f.type, size: f.size, uri: f.uri }))
        .sort((a, b) => b.name.localeCompare(a.name)); // 最新的在前
    }
  } catch (error) {
    console.error('读取备份列表失败:', error);
    return [];
  }
}

// 手动备份（JSON + Excel）
export async function manualBackup() {
  try {
    const timestamp = Date.now();
    const today = getTodayDate();
    const data = await getAllData();
    
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      // Web 环境：使用浏览器下载
      // 1. 下载 JSON 格式
      const jsonContent = JSON.stringify(data, null, 2);
      const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
      const jsonFileName = `TODO-App_backup_${today}_${timestamp}.json`;
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = jsonFileName;
      jsonLink.click();
      URL.revokeObjectURL(jsonUrl);
      
      // 2. 下载 Excel 格式
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
      
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const excelFileName = `TODO-App_backup_${today}_${timestamp}.xlsx`;
      const excelUrl = URL.createObjectURL(excelBlob);
      const excelLink = document.createElement('a');
      excelLink.href = excelUrl;
      excelLink.download = excelFileName;
      excelLink.click();
      URL.revokeObjectURL(excelUrl);
      
      return { 
        success: true, 
        jsonFile: jsonFileName, 
        excelFile: excelFileName,
        taskCount: excelData.length
      };
    } else {
      // 移动端环境：使用 Filesystem API
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
    }
  } catch (error) {
    console.error('手动备份失败:', error);
    return { success: false, error: error.message };
  }
}


// 删除备份文件
export async function deleteBackup(fileName) {
  const platform = Capacitor.getPlatform();
  
  try {
    if (platform === 'web') {
      // Web端：从localStorage删除
      const backupsStr = localStorage.getItem('backupFiles') || '[]';
      const backups = JSON.parse(backupsStr);
      const filtered = backups.filter(b => b.name !== fileName);
      localStorage.setItem('backupFiles', JSON.stringify(filtered));
      return { success: true };
    } else {
      // 移动端：删除文件
      await Filesystem.deleteFile({
        path: `backups/${fileName}`,
        directory: Directory.Documents
      });
      return { success: true };
    }
  } catch (error) {
    console.error('删除备份失败:', error);
    return { success: false, error: error.message };
  }
}
