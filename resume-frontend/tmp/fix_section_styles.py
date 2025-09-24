from pathlib import Path
path = Path('src/components/LivePreview.jsx')
text = path.read_text()
replacements = {
    "gap: px": "gap: ${2 * scaleFactor}px",
    "fontSize: px": "fontSize: ${5.5 * scaleFactor}px",
    "marginTop: px": "marginTop: ${0.5 * scaleFactor}px",
    "fontSize: px": "fontSize: ${4.5 * scaleFactor}px"
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text)
