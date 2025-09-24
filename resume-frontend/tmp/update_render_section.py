from pathlib import Path
path = Path("src/components/LivePreview.jsx")
text = path.read_text()
old = "        {isIndustryManager && content ? (\n          <div style={styles.sectionContent || { paddingLeft: '12pt' }}>\n            {content}\n          </div>\n        ) : content}"
new = "        {isIndustryManager && content ? (\n          <div style={styles.sectionContent || { paddingLeft: '12pt' }}>\n            <div style={styles.sectionContentInner || { display: 'flex', alignItems: 'flex-start', gap: '6px' }}>\n              <span style={styles.sectionContentMarker || { color: '#39A5B7', fontSize: '10px', lineHeight: '1.2', marginTop: '2px' }}>▪</span>\n              <div style={styles.sectionContentBody || { flex: 1 }}>{content}</div>\n            </div>\n          </div>\n        ) : content}"
if old not in text:
    raise SystemExit('renderSection block not found')
path.write_text(text.replace(old, new, 1))
