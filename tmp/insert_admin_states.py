from pathlib import Path
path = Path("src/pages/AdminMembershipPage.jsx")
text = path.read_text()
marker = "  const [selectedPlans, setSelectedPlans] = useState({});\n  const [updating, setUpdating] = useState({});\n  const [searchTerm, setSearchTerm] = useState('');\n"
if marker not in text:
    raise SystemExit('state marker not found')
addition = "  const [selectedPlans, setSelectedPlans] = useState({});\n  const [updating, setUpdating] = useState({});\n  const [searchTerm, setSearchTerm] = useState('');\n  const [jobCompanies, setJobCompanies] = useState([]);\n  const [jobLoading, setJobLoading] = useState(false);\n  const [jobError, setJobError] = useState('');\n  const [jobMessage, setJobMessage] = useState('');\n  const [newCompany, setNewCompany] = useState({\n    name: '',\n    website_url: '',\n    careers_url: '',\n    ats_provider: 'greenhouse',\n    external_identifier: '',\n    sync_interval_minutes: 180,\n  });\n"
text = text.replace(marker, addition, 1)
path.write_text(text)
