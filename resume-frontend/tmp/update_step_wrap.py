from pathlib import Path
path = Path("src/components/StepPreview.jsx")
text = path.read_text()
old = "  const wrapSectionContent = (content) => {\n    if (!content) return content;\n    if (!isIndustryManager) return content;\n    return <div className=\"section-content\">{content}</div>;\n  };"
new = "  const wrapSectionContent = (content) => {\n    if (!content) return content;\n    if (!isIndustryManager) return content;\n    return (\n      <div className=\"section-content\">\n        <span className=\"section-content-marker\">▪</span>\n        <div className=\"section-content-body\">{content}</div>\n      </div>\n    );\n  };"
if old not in text:
    raise SystemExit('wrapSectionContent block not found')
path.write_text(text.replace(old, new, 1))
