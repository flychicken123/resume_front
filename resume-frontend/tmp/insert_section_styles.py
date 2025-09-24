from pathlib import Path
path = Path('src/components/LivePreview.jsx')
lines = path.read_text().splitlines()
for idx, line in enumerate(lines):
    if 'sectionContent:' in line and 'bulletIndent' in lines[idx + 1]:
        upcoming = lines[idx+1:idx+12]
        if any('sectionContentInner' in l for l in upcoming):
            break
        insert = [
            "          sectionContentInner: {",
            "            display: 'flex',",
            "            alignItems: 'flex-start',",
            "            gap: ${2 * scaleFactor}px",
            "          },",
            "          sectionContentMarker: {",
            "            color: '#39A5B7',",
            "            fontSize: ${5.5 * scaleFactor}px,",
            "            lineHeight: '1.2',",
            "            marginTop: ${0.5 * scaleFactor}px",
            "          },",
            "          sectionContentBody: {",
            "            flex: 1",
            "          },",
            "          sectionItem: {",
            "            display: 'flex',",
            "            alignItems: 'flex-start',",
            "            gap: ${2 * scaleFactor}px,",
            "            marginBottom: ${2 * scaleFactor}px",
            "          },",
            "          sectionItemMarker: {",
            "            color: '#39A5B7',",
            "            fontSize: ${4.5 * scaleFactor}px,",
            "            lineHeight: '1.2',",
            "            marginTop: ${0.5 * scaleFactor}px",
            "          },",
            "          sectionItemBody: {",
            "            flex: 1",
            "          },"
        ]
        lines[idx+3:idx+3] = insert
        break
path.write_text('\n'.join(lines) + '\n')
