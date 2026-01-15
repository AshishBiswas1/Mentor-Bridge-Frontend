// Monaco Editor theme configuration for better integration with our dark theme
export const monacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    { token: 'keyword', foreground: '2563eb' },
    { token: 'string', foreground: '14b8a6' },
    { token: 'number', foreground: 'f59e0b' },
    { token: 'regexp', foreground: 'ef4444' },
  ],
  colors: {
    'editor.background': '#020617',
    'editor.foreground': '#f1f5f9',
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#cbd5e1',
    'editor.selectionBackground': '#2563eb40',
    'editor.inactiveSelectionBackground': '#2563eb20',
    'editorCursor.foreground': '#2563eb',
    'editor.lineHighlightBackground': '#1e293b40',
  },
};