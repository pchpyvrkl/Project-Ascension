/* Shared mutable UI state that several view modules need to read/write.
   A single object is used (instead of module-level `let` exports) so every
   importer always sees the current value without reassignment issues. */
export const ui = {
  calCursor: new Date(),
  activeTaskId: null,
  activeDayStr: null,
};
