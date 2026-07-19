(function exposeSearchUtilities(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ScraaaperSearch = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  function interleaveResults(resultsBySource, sourceKeys) {
    const queues = Object.fromEntries(
      sourceKeys.map((key) => [key, [...(resultsBySource[key] || [])]])
    );
    const merged = [];
    let foundResult = true;
    while (foundResult) {
      foundResult = false;
      for (const key of sourceKeys) {
        if (queues[key].length) {
          merged.push(queues[key].shift());
          foundResult = true;
        }
      }
    }
    return merged;
  }

  return { interleaveResults };
}));
