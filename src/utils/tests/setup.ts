import { mock } from 'bun:test'
import { mockReactNative } from './react-native-mock'
import { storageMock } from './storage-mocks'

const SRC_ROOT = new URL('../../', import.meta.url).pathname

// React Native's global; expo reads it when its modules load (false skips dev-only HMR setup).
;(globalThis as { __DEV__?: boolean }).__DEV__ ??= false

mockReactNative()

// Register shared mocks first so sticky Bun mock.module always has complete exports.
mock.module(`${SRC_ROOT}utils/storage.ts`, () => storageMock)
mock.module('@/utils/storage', () => storageMock)
