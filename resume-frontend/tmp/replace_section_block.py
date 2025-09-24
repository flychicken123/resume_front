from pathlib import Path
path = Path("src/components/LivePreview.jsx")
lines = path.read_text().splitlines()
start = None
end = None
for idx, line in enumerate(lines):
    if line.strip().startswith('sectionContentInner:'):
        start = idx
    if start is not None and line.strip().startswith('company: {'):
        end = idx
        break
if start is None or end is None:
    raise SystemExit('block bounds not found')
new_block = [
    "          sectionContentInner: {",
    "            display: 'flex',",
    "            alignItems: 'flex-start',",
    "            gap: `${2 * scaleFactor}px`",
    "          },",
    "          sectionContentMarker: {",
    "            color: '#39A5B7',",
    "            fontSize: `${5.5 * scaleFactor}px`,",
    "            lineHeight: '1.2',",
    "            marginTop: `${0.5 * scaleFactor}px`",
    "          },",
    "          sectionContentBody: {",
    "            flex: 1",
    "          },",
    "          sectionItem: {",
    "            display: 'flex',",
    "            alignItems: 'flex-start',",
    "            gap: `${2 * scaleFactor}px`,",
    "            marginBottom: `${2 * scaleFactor}px`",
    "          },",
    "          sectionItemMarker: {",
    "            color: '#39A5B7',",
    "            fontSize: `${4.5 * scaleFactor}px`,",
    "            lineHeight: '1.2',",
    "            marginTop: `${0.5 * scaleFactor}px`",
    "          },",
    "          sectionItemBody: {",
    "            flex: 1",
    "          },"
]
lines[start:end] = new_block
path.write_text('\n'.join(lines) + '\n')
