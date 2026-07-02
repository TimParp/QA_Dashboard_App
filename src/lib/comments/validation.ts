export const MAX_COMMENT_LENGTH = 5000;

export function validateCommentBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "Comment cannot be empty";
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`;
  }
  return null;
}
