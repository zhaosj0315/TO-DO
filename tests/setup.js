import { vi } from 'vitest'

// Mock Capacitor Preferences API
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }) => ({ value: null })),
    set: vi.fn(async () => ({})),
    remove: vi.fn(async () => ({})),
    clear: vi.fn(async () => ({})),
    keys: vi.fn(async () => ({ keys: [] }))
  }
}))

// Mock Capacitor LocalNotifications
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: vi.fn(async () => ({})),
    getPending: vi.fn(async () => ({ notifications: [] })),
    cancel: vi.fn(async () => ({})),
    requestPermissions: vi.fn(async () => ({ display: 'granted' }))
  }
}))

// Mock Capacitor Filesystem
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn(async () => ({ uri: 'file://test.json' })),
    readFile: vi.fn(async () => ({ data: '{}' })),
    deleteFile: vi.fn(async () => ({})),
    mkdir: vi.fn(async () => ({})),
    readdir: vi.fn(async () => ({ files: [] }))
  },
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
    External: 'EXTERNAL'
  },
  Encoding: {
    UTF8: 'utf8'
  }
}))

// Mock Capacitor Camera
vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: vi.fn(async () => ({ 
      dataUrl: 'data:image/png;base64,test',
      format: 'png'
    })),
    requestPermissions: vi.fn(async () => ({ camera: 'granted' }))
  },
  CameraResultType: {
    DataUrl: 'dataUrl',
    Uri: 'uri'
  },
  CameraSource: {
    Camera: 'CAMERA',
    Photos: 'PHOTOS'
  }
}))

// Mock Browser APIs
global.confirm = vi.fn(() => true)
global.alert = vi.fn()
global.prompt = vi.fn(() => 'test')

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
}
global.localStorage = localStorageMock
