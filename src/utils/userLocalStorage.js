/**
 * 用户隔离的localStorage工具
 * 确保不同用户的数据完全隔离
 */

import { Preferences } from '@capacitor/preferences'

// 获取当前登录用户
async function getCurrentUser() {
  const { value } = await Preferences.get({ key: 'currentUser' })
  return value || 'guest'
}

/**
 * 获取用户隔离的localStorage数据
 * @param {string} key - 原始key
 * @returns {string|null}
 */
export async function getUserLocalStorage(key) {
  const username = await getCurrentUser()
  const userKey = `${key}_${username}`
  return localStorage.getItem(userKey)
}

/**
 * 设置用户隔离的localStorage数据
 * @param {string} key - 原始key
 * @param {string} value - 值
 */
export async function setUserLocalStorage(key, value) {
  const username = await getCurrentUser()
  const userKey = `${key}_${username}`
  localStorage.setItem(userKey, value)
}

/**
 * 删除用户隔离的localStorage数据
 * @param {string} key - 原始key
 */
export async function removeUserLocalStorage(key) {
  const username = await getCurrentUser()
  const userKey = `${key}_${username}`
  localStorage.removeItem(userKey)
}

/**
 * 同步版本：获取用户隔离的localStorage数据
 * @param {string} key - 原始key
 * @param {string} username - 用户名
 * @returns {string|null}
 */
export function getUserLocalStorageSync(key, username) {
  if (!username) return null
  const userKey = `${key}_${username}`
  return localStorage.getItem(userKey)
}

/**
 * 同步版本：设置用户隔离的localStorage数据
 * @param {string} key - 原始key
 * @param {string} value - 值
 * @param {string} username - 用户名
 */
export function setUserLocalStorageSync(key, value, username) {
  if (!username) return
  const userKey = `${key}_${username}`
  localStorage.setItem(userKey, value)
}
