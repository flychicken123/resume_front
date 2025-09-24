from pathlib import Path
path = Path("src/App.css")
text = path.read_text()
old = ".preview.industry-manager .section-content {\n  padding-left: 12pt;\n  display: block;\n}\n\n"
new = ".preview.industry-manager .section-content {\n  display: flex;\n  align-items: flex-start;\n  gap: 6pt;\n  padding-left: 12pt;\n  margin-bottom: 4pt;\n}\n\n.preview.industry-manager .section-content-marker {\n  color: #39A5B7;\n  font-size: 0.85em;\n  line-height: 1.2;\n  margin-top: 2pt;\n}\n\n.preview.industry-manager .section-content-body {\n  flex: 1;\n}\n\n.preview.industry-manager .section-item {\n  display: flex;\n  align-items: flex-start;\n  gap: 6pt;\n  margin-bottom: 4pt;\n}\n\n.preview.industry-manager .section-item-marker {\n  color: #39A5B7;\n  font-size: 0.75em;\n  line-height: 1.2;\n  margin-top: 2pt;\n}\n\n.preview.industry-manager .section-item-body {\n  flex: 1;\n}\n\n"
if old not in text:
    raise SystemExit('original section-content block not found')
path.write_text(text.replace(old, new, 1))
