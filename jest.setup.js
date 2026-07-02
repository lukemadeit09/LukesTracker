// Shared Jest setup for the whole suite.
//
// App.js wraps the tree in SafeAreaProvider (react-native-safe-area-context).
// SafeAreaProvider never resolves real safe-area insets in a Jest/jsdom-less
// RN test environment (no native layout event ever fires), which means any
// component depending on useSafeAreaInsets() (via App.js's <Root />) hangs
// with zero-size / unset insets and children never mount as expected.
//
// react-native-safe-area-context ships an official Jest mock that provides
// static inset values and mounts children synchronously. Wire it in here so
// every test file gets it for free.
// The shipped mock module is authored as `export default { ... }`, which
// Babel's CJS interop surfaces as `{ default: {...} }` when required directly
// — so consumers doing named imports (`import { SafeAreaProvider } from
// 'react-native-safe-area-context'`, as App.js does) would get `undefined`.
// Unwrap `.default` (falling back to the module itself) so named imports work.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock && mock.default ? mock.default : mock;
});
