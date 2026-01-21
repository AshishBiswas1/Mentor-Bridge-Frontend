// Monaco Editor theme configuration for dark and light themes
export const monacoThemeDark = {
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

export const monacoThemeLight = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    { token: 'keyword', foreground: '1e40af' },
    { token: 'string', foreground: '0d9488' },
    { token: 'number', foreground: 'd97706' },
    { token: 'regexp', foreground: 'dc2626' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#0f172a',
    'editorLineNumber.foreground': '#94a3b8',
    'editorLineNumber.activeForeground': '#475569',
    'editor.selectionBackground': '#2563eb30',
    'editor.inactiveSelectionBackground': '#2563eb15',
    'editorCursor.foreground': '#2563eb',
    'editor.lineHighlightBackground': '#f1f5f920',
  },
};

// For backwards compatibility
export const monacoTheme = monacoThemeDark;