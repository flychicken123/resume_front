import re
from pathlib import Path
path = Path('front/resume-frontend/src/components/LivePreview.jsx')
text = path.read_text()

start = text.find('  const renderBulletLine = (line, key, styles) => {')
if start == -1:
    raise SystemExit('renderBulletLine not found')
brace = 0
end = None
for i in range(start, len(text)):
    ch = text[i]
    if ch == '{':
        brace += 1
    elif ch == '}':
        brace -= 1
        if brace == 0:
            if text[i+1:i+3] == ');':
                end = i + 3
            elif text[i+1:i+2] == ';':
                end = i + 2
            else:
                end = i + 1
            break
if end is None:
    raise SystemExit('renderBulletLine end not found')

new_fn = """  const renderBulletLine = (line, key, styles) => {\n    if (!line || !line.trim()) return null;\n    const cleaned = line.trim().replace(/^[\\u2022\\u25AA-]+\\s*/, '');\n    if (!cleaned) return null;\n\n    if (data.selectedFormat === 'industry-manager') {\n      const bulletStyle = { listStyle: 'none', display: 'flex', alignItems: 'flex-start', gap: '6px', ...(styles.bullet || {}) };\n      return (\n        <li key={key} style={bulletStyle}>\n          <span style={styles.bulletMarker || { color: '#39A5B7', marginRight: '6px' }}>▪</span>\n          <span style={styles.bulletText || { flex: 1 }}>{cleaned}</span>\n        </li>\n      );\n    }\n\n    return (\n      <div key={key} style={styles.bullet}>\n        • {cleaned}\n      </div>\n    );\n  };\n\n  const renderBulletCollection = (rawLines = [], keyPrefix, styles) => {\n    const lines = rawLines\n      .map((line) => (line || '').trim())\n      .filter(Boolean);\n    if (!lines.length) return null;\n\n    if (data.selectedFormat === 'industry-manager') {\n      const listStyle = styles.bulletList || { listStyle: 'none', margin: '4px 0 0', padding: 0 };\n      return (\n        <ul style={listStyle}>\n          {lines.map((line, idx) => renderBulletLine(line, ${keyPrefix}-, styles))}\n        </ul>\n      );\n    }\n\n    return (\n      <div style={{ marginTop: '2px' }}>\n        {lines.map((line, idx) => renderBulletLine(line, ${keyPrefix}-, styles))}\n      </div>\n    );\n  };\n\n"""
text = text[:start] + new_fn + text[end:]

pattern_string = re.compile(r"const descriptionLines = lines\\.slice\\(1\\);\s*const descriptionContent = descriptionLines\\.filter\\(\\(line\\) => line\\.trim\\(\\)\\)\\.length > 0\s*\?\s*\(\s*<div style=\\{\\{ marginTop: '2px' \\}\\}>\s*\\{descriptionLines\\.map\\(\\(line, lineIdx\\) =>\s*renderBulletLine\\(line, \\-\\, styles\\)\s*\\)\\}\\s*</div>\s*\)\s*:\s*null;", re.S)
text, count = pattern_string.subn("const descriptionLines = lines.slice(1);\n        const descriptionContent = renderBulletCollection(descriptionLines, string-, styles);", text, count=1)
if count == 0:
    raise SystemExit('Failed to update string description block')

text = re.sub(r"{exp.description && \(\s*<div style=\\{\\{ marginTop: '2px' \\}\\}>\s*\\{exp.description.split\('\\\\n'\).map\((?:.|\n)*?\)\\}\s*</div>\s*\) }", "{exp.description && renderBulletCollection(exp.description.split('\\n'), exp-, styles)}", text)

text = re.sub(r"{project.description.split\('\\\\n'\).filter\(point => point.trim\(\)\).map\((?:.|\n)*?\)}", "{project.description.split('\\n').filter(point => point.trim()).map((point, pointIdx) => renderBulletLine(point, project--, styles))}", text)

text = text.replace("          skillText: { flex: 1 },\n          item: { marginTop: ${3 * scaleFactor}px }\n        };", "          skillText: { flex: 1 },\n          bulletList: { listStyle: 'none', margin: ${2 * scaleFactor}px 0 0, padding: 0 },\n          item: { marginTop: ${3 * scaleFactor}px }\n        };", 1)

path.write_text(text)
