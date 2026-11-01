export interface DiffResult {
  addedLines: number[];     // 1-based line numbers in current text
  modifiedLines: number[];  // 1-based line numbers in current text
  deletedLines: number[];   // 1-based line numbers where text was deleted
}

/**
 * Computes line-level diffs between original baseline content and modified editor content.
 * Returns 1-based line numbers for Monaco Editor gutter decorations.
 */
export function computeLineDiff(originalText: string, currentText: string): DiffResult {
  const result: DiffResult = {
    addedLines: [],
    modifiedLines: [],
    deletedLines: []
  };

  if (!originalText || originalText === currentText) {
    return result;
  }

  const origLines = originalText.split(/\r?\n/);
  const currLines = currentText.split(/\r?\n/);

  const origLen = origLines.length;
  const currLen = currLines.length;

  let prefix = 0;
  while (prefix < origLen && prefix < currLen && origLines[prefix] === currLines[prefix]) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < origLen - prefix &&
    suffix < currLen - prefix &&
    origLines[origLen - 1 - suffix] === currLines[currLen - 1 - suffix]
  ) {
    suffix++;
  }

  const origMidCount = origLen - prefix - suffix;
  const currMidCount = currLen - prefix - suffix;

  if (origMidCount === 0 && currMidCount > 0) {
    // Pure additions
    for (let i = 0; i < currMidCount; i++) {
      result.addedLines.push(prefix + 1 + i);
    }
  } else if (currMidCount === 0 && origMidCount > 0) {
    // Pure deletions
    result.deletedLines.push(Math.max(1, prefix));
  } else {
    // Modifications and additions/deletions
    const minCount = Math.min(origMidCount, currMidCount);
    for (let i = 0; i < minCount; i++) {
      result.modifiedLines.push(prefix + 1 + i);
    }

    if (currMidCount > origMidCount) {
      for (let i = minCount; i < currMidCount; i++) {
        result.addedLines.push(prefix + 1 + i);
      }
    } else if (origMidCount > currMidCount) {
      result.deletedLines.push(prefix + minCount);
    }
  }

  return result;
}
