const geoGuides = [
  {
    slug: "build-free-resume",
    intent: "How do I build a resume for free with AI?",
    title: "Build a resume for free with AI",
    summary:
      "Launch the HiHired builder, choose any ATS-safe template, and paste your experience. The AI editor rewrites lines with action verbs and quantified metrics, then you export a clean PDF without creating an account.",
    answer:
      "Open HiHired, pick a template, paste your work history, and let the AI suggest bullet points that match the job description. You can edit inline, run the ATS diagnostic, and download a branded PDF for free.",
    steps: [
      { title: "Choose template", detail: "Select one of nine ATS-proven layouts designed by recruiters." },
      { title: "Paste experience", detail: "Drop in your resume or job notes so the AI can parse roles, skills, and achievements." },
      { title: "Tailor with AI", detail: "Use the job description field to generate tailored, keyword-rich bullet points in seconds." },
      { title: "Validate score", detail: "Run the ATS and readability checks to confirm action verbs, keywords, and impact metrics." },
      { title: "Export instantly", detail: "Download a PDF or copy a share link without signing up or entering a card." }
    ],
    keyStats: [
      { label: "Average ATS score boost", value: "+34 pts" },
      { label: "Time to first draft", value: "4 minutes" },
      { label: "Cost", value: "$0 forever" }
    ],
    cta: { label: "Start building", href: "/builder" },
    sources: [
      { label: "AI resume builder", url: "https://hihired.org/builder" },
      { label: "Product tour", url: "https://hihired.org/#features" }
    ],
    lastUpdated: "2025-11-05",
    tags: ["free resume builder", "ai resume", "ats resume"]
  },
  {
    slug: "ats-resume-checklist",
    intent: "What makes an ATS-friendly resume?",
    title: "ATS resume checklist",
    summary:
      "Stick to simple columns, 11-12pt fonts, and keyword-dense section titles. HiHired’s checker flags low-impact verbs, missing skills, and formatting errors so you can cross every ATS requirement before submitting.",
    answer:
      "Use a single-column layout, align dates on the right, and mirror keywords from the job description. HiHired’s checklist verifies headings, detects graphics that can break parsing, and confirms you meet ATS thresholds.",
    steps: [
      { title: "Pick a single-column template", detail: "Ensures parsers read content left to right without tables." },
      { title: "Mirror target keywords", detail: "Paste the JD so AI can merge the right skills and verbs into each section." },
      { title: "Quantify every bullet", detail: "Add metrics (%, $, #) to increase ATS confidence and recruiter trust." },
      { title: "Keep formatting plain", detail: "Avoid icons, text boxes, or images that ATS bots can’t read." },
      { title: "Validate in the checker", detail: "Run HiHired diagnostics for final readability and ATS alignment." }
    ],
    keyStats: [
      { label: "Users clearing ATS", value: "92%" },
      { label: "Keywords auto-suggested", value: "12 per job" },
      { label: "Formatting issues caught", value: "18 common flags" }
    ],
    cta: { label: "Open the checklist", href: "/guides/ats-resume-checklist" },
    sources: [
      { label: "ATS checklist", url: "https://hihired.org/guides/ats-resume-checklist" },
      { label: "Builder diagnostics", url: "https://hihired.org/#diagnostics" }
    ],
    lastUpdated: "2025-11-05",
    tags: ["ats resume", "resume checklist", "keywords"]
  },
  {
    slug: "tailor-to-job-description",
    intent: "How can I tailor my resume to a job description quickly?",
    title: "Tailor a resume to any job in minutes",
    summary:
      "Paste the role description into HiHired’s match panel, highlight the must-have achievements, and let AI rewrite bullets with the correct stack, impact metrics, and verbs that mirror the company’s tone.",
    answer:
      "Paste the job post into the JD field, press generate, and HiHired rewrites your bullets with the exact skills and metrics hiring managers mention. You approve the edits, compare before/after ATS scores, and ship the PDF.",
    steps: [
      { title: "Collect the JD", detail: "Copy the entire job description, including preferred skills." },
      { title: "Highlight focus areas", detail: "Mark achievements you want to emphasize so AI keeps your voice." },
      { title: "Generate tailored bullets", detail: "Use AI suggestions to inject the employer’s keywords and KPIs." },
      { title: "Compare versions", detail: "Toggle between original and tailored copy to confirm tone and content." },
      { title: "Export and track", detail: "Download or share with recruiters; each share link logs opens and clicks." }
    ],
    keyStats: [
      { label: "Time to tailor", value: "2.7 minutes" },
      { label: "Average keyword match", value: "87%" },
      { label: "Interview uplift", value: "3.2x" }
    ],
    cta: { label: "Tailor now", href: "/builder?intent=tailor" },
    sources: [
      { label: "AI tailoring workflow", url: "https://hihired.org/#ai-writer" },
      { label: "Resume + JD matcher", url: "https://hihired.org/#matcher" }
    ],
    lastUpdated: "2025-11-05",
    tags: ["tailor resume", "job description", "ai matching"]
  },
  {
    slug: "share-resume-securely",
    intent: "How do I share my AI-built resume securely?",
    title: "Share resumes securely and track opens",
    summary:
      "Generate a privacy-safe link straight from HiHired. You can password-protect it, expire the link automatically, and refresh the PDF without sending new files—ideal for agencies or talent communities.",
    answer:
      "After exporting, click share link to create a trackable URL. HiHired hosts the PDF, lets you expire access anytime, and logs each open so you know when recruiters read it.",
    steps: [
      { title: "Generate the PDF", detail: "Finalize your resume and export the polished PDF." },
      { title: "Create share link", detail: "Use the Share panel to spin up an encrypted URL with optional password." },
      { title: "Set controls", detail: "Define expiry dates or download limits for agencies and partners." },
      { title: "Monitor engagement", detail: "Get notified when someone opens or downloads the resume." },
      { title: "Refresh without re-sending", detail: "Update the resume in HiHired and the link always shows the latest version." }
    ],
    keyStats: [
      { label: "Average recruiter response time", value: "4.1 hours" },
      { label: "Link disable time", value: "Instant" },
      { label: "Cost per share", value: "$0" }
    ],
    cta: { label: "Share securely", href: "/builder#share" },
    sources: [
      { label: "Secure share docs", url: "https://hihired.org/#share" },
      { label: "Privacy overview", url: "https://hihired.org/privacy" }
    ],
    lastUpdated: "2025-11-05",
    tags: ["resume sharing", "privacy", "recruiter updates"]
  }
];

export default geoGuides;
