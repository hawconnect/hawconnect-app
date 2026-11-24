import { mock } from 'bun:test'
import { mockReactNative } from './react-native-mock'
import { storageMock } from './storage-mocks'

const SRC_ROOT = new URL('../../', import.meta.url).pathname

mockReactNative()

// Register shared mocks first so sticky Bun mock.module always has complete exports.
mock.module(`${SRC_ROOT}utils/storage.ts`, () => storageMock)
mock.module('@/utils/storage', () => storageMock)
