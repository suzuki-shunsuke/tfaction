/**
 * Business logic for generate-config-out action.
 * This module contains pure functions that can be tested without mocking.
 */

export type WriteMode = "append" | "write";

/**
 * Filters generated Terraform content by removing comments and empty lines.
 *
 * @param content - The raw content from terraform plan -generate-config-out
 * @returns Filtered content with comments and empty lines removed, always ending with a newline
 */
export const filterGeneratedContent = (content: string): string => {
  const filteredLines = content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Skip comments (lines starting with #) and empty lines
      return trimmed.length > 0 && !trimmed.startsWith("#");
    })
    .join("\n");

  return filteredLines + "\n";
};

/**
 * Determines whether to append to an existing file or write a new file.
 *
 * @param targetFileExists - Whether the target file already exists
 * @returns The write mode: "append" if file exists, "write" if creating new
 */
export const getWriteMode = (targetFileExists: boolean): WriteMode => {
  return targetFileExists ? "append" : "write";
};

/**
 * Prepares content for writing based on the write mode.
 * When appending, adds a leading newline to separate from existing content.
 *
 * @param content - The filtered content to write
 * @param mode - The write mode (append or write)
 * @returns The content ready to be written to the file
 */
export const prepareContentForWrite = (
  content: string,
  mode: WriteMode,
): string => {
  return mode === "append" ? "\n" + content : content;
};

/**
 * Generates a temporary file name for the terraform-generated config.
 *
 * @param runId - The GitHub Actions run ID
 * @param timestamp - A timestamp string (e.g., "20240115103045")
 * @returns The temporary file name with .tf extension
 */
export const generateTempFileName = (
  runId: string,
  timestamp: string,
): string => {
  return `generated_${runId}_${timestamp}.tf`;
};

/**
 * Formats a Date object into a timestamp string suitable for file names.
 * Format: YYYYMMDDHHMMSS
 *
 * @param date - The date to format
 * @returns A timestamp string without separators
 */
export const formatTimestamp = (date: Date): string => {
  return date
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\..+/, "");
};
