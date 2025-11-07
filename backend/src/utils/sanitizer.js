import sanitizeHtml from 'sanitize-html';

export function sanitizeMessageContent(input) {
  return sanitizeHtml(input || '', {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}
