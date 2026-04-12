import { useNavigate } from 'react-router-dom';
import {
  Container, Title, Text, Button, Group, Stack, SimpleGrid,
  Accordion, ThemeIcon, Paper, Box,
} from '@mantine/core';
import {
  IconSparkles, IconUpload, IconPencil, IconTarget,
  IconLayout, IconChecklist, IconRobot, IconBriefcase,
  IconSearch, IconRocket,
} from '@tabler/icons-react';
import Navbar from '../components/Navbar';
import classes from './HomePage.module.css';

const companies = ['Google', 'Amazon', 'Microsoft', 'Netflix', 'Salesforce', 'Stripe'];

const steps = [
  {
    num: '1',
    title: 'Build your resume',
    desc: 'Upload an existing resume or start fresh. Our AI analyzes your experience and rewrites bullet points using proven frameworks that recruiters love.',
  },
  {
    num: '2',
    title: 'Discover matching jobs',
    desc: 'Our AI scans 35,000+ job postings daily using vector embeddings to surface roles that match your skills, experience, and career goals.',
  },
  {
    num: '3',
    title: 'Apply & track',
    desc: 'For each role you target, AI generates an optimized, ATS-friendly resume tailored to the job description. Track every application in one place.',
  },
];

const features = [
  { icon: IconUpload, color: 'blue', title: 'Resume Import', desc: 'Upload your existing resume in any format. Our parser extracts and structures your data instantly.' },
  { icon: IconPencil, color: 'orange', title: 'AI Bullet Writing', desc: 'Transform vague descriptions into powerful, quantified achievements that pass ATS filters.' },
  { icon: IconTarget, color: 'teal', title: 'AI Job Matching', desc: 'Semantic search finds jobs you\'re qualified for — even ones you wouldn\'t think to search for.' },
  { icon: IconLayout, color: 'violet', title: 'ATS-Optimized Templates', desc: 'Every template is tested against major ATS systems to ensure your resume gets through.' },
  { icon: IconChecklist, color: 'pink', title: 'Application Tracking', desc: 'Kanban board to manage every application from saved → applied → interview → offer.' },
  { icon: IconRobot, color: 'cyan', title: 'AI Copilot', desc: 'Chat with our AI for resume advice, interview prep, salary negotiation tips, and more.' },
];

const faqs = [
  { q: 'Is HiHired really free?', a: 'Yes! You can build and download one resume completely free. Premium plans unlock unlimited resumes, AI job matching, and application tracking.' },
  { q: 'How does the AI rewrite my bullet points?', a: 'Our AI uses the XYZ and STAR frameworks to transform your experience into quantified, action-driven bullet points that recruiters and ATS systems prefer.' },
  { q: 'Will my resume pass ATS systems?', a: 'Absolutely. Every template is rigorously tested against major ATS platforms including Workday, Greenhouse, Lever, and iCIMS.' },
  { q: 'How does job matching work?', a: 'We use vector embeddings to semantically match your skills and experience against 35,000+ daily job postings, surfacing roles with the highest fit score.' },
  { q: 'Can I customize the AI suggestions?', a: 'Of course. Every AI suggestion is editable. Think of it as a smart first draft — you always have final say over your resume content.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <Box className={classes.hero}>
        <Container size="lg">
          <Stack align="center" gap={0}>
            <div className={classes.heroBadge}>
              <IconSparkles size={16} />
              AI-Powered Resume Builder
            </div>
            <h1 className={classes.heroTitle}>
              Land more interviews with a resume{' '}
              <span className={classes.heroHighlight}>powered by AI for each job</span>
            </h1>
            <p className={classes.heroSubtitle}>
              Our AI reads the job description, rewrites your bullet points to match, and formats
              everything in an ATS-friendly template — so you can apply in minutes, not hours.
            </p>
            <Group>
              <Button size="lg" color="orange" onClick={() => navigate('/builder')}>
                Build Your Resume Free →
              </Button>
              <Button size="lg" variant="default">
                See How It Works
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* TRUSTED BY */}
      <Box className={classes.trusted}>
        <Container size="lg">
          <div className={classes.trustedLabel}>Trusted by professionals from</div>
          <div className={classes.trustedLogos}>
            {companies.map((name) => (
              <span key={name} className={classes.trustedName}>{name}</span>
            ))}
          </div>
        </Container>
      </Box>

      {/* HOW IT WORKS */}
      <Box className={classes.sectionAlt}>
        <Container size="lg">
          <div className={classes.sectionTitle}>How it works</div>
          <p className={classes.sectionSubtitle}>
            AI guides you from resume to offer — three steps, zero guesswork.
          </p>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
            {steps.map((step) => (
              <Paper key={step.num} className={classes.stepCard} shadow="xs" radius="md">
                <div className={classes.stepNumber}>{step.num}</div>
                <Text fw={700} size="lg" mb={8}>{step.title}</Text>
                <Text size="sm" c="dimmed">{step.desc}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* FEATURES */}
      <Box className={classes.section}>
        <Container size="lg">
          <div className={classes.sectionTitle}>What you get</div>
          <p className={classes.sectionSubtitle}>
            Stop wrestling with formatting and wording. Let AI handle the heavy lifting while you
            focus on landing interviews.
          </p>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {features.map((f) => (
              <div key={f.title} className={classes.featureCard}>
                <ThemeIcon size={44} radius="md" color={f.color} variant="light" mb={12}>
                  <f.icon size={22} />
                </ThemeIcon>
                <Text fw={700} mb={4}>{f.title}</Text>
                <Text size="sm" c="dimmed">{f.desc}</Text>
              </div>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box className={classes.sectionAlt}>
        <Container size="sm">
          <div className={classes.sectionTitle}>Frequently asked questions</div>
          <p className={classes.sectionSubtitle}>
            Everything you need to know about HiHired.
          </p>
          <Accordion variant="separated">
            {faqs.map((faq, i) => (
              <Accordion.Item key={i} value={`faq-${i}`}>
                <Accordion.Control>{faq.q}</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed">{faq.a}</Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </Box>

      {/* FINAL CTA */}
      <Box className={classes.ctaSection}>
        <Container size="sm">
          <Title order={2} c="white" ta="center" mb={8}>
            Ready to land your next role?
          </Title>
          <Text c="dimmed" ta="center" mb={24}>
            Join thousands of job seekers who&apos;ve already upgraded their resume game.
          </Text>
          <Group justify="center">
            <Button size="lg" color="orange" onClick={() => navigate('/builder')}>
              Get Started Free →
            </Button>
          </Group>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box className={classes.footer}>
        <Container size="lg">
          <div className={classes.footerLinks}>
            <a href="#" className={classes.footerLink}>About</a>
            <a href="#" className={classes.footerLink}>Blog</a>
            <a href="#" className={classes.footerLink}>Pricing</a>
            <a href="#" className={classes.footerLink}>Privacy</a>
            <a href="#" className={classes.footerLink}>Terms</a>
          </div>
          <Text size="xs" c="dimmed">© 2025 HiHired. All rights reserved.</Text>
        </Container>
      </Box>
    </>
  );
}
