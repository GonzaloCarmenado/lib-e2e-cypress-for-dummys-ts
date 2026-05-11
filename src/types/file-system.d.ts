/**
 * Extensions for the File System Access API not yet fully covered
 * by TypeScript's lib.dom.d.ts.
 */

/** Async-iterator methods on FileSystemDirectoryHandle (not in TS < 5.8 dom.iterable). */
interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  keys(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

/** queryPermission / requestPermission are non-standard API extensions. */
interface FileSystemHandleWithPermission extends FileSystemHandle {
  queryPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

/** showDirectoryPicker is not yet typed in TypeScript's DOM lib for all versions. */
interface Window {
  showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}
