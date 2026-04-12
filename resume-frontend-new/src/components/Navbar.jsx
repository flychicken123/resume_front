import { Button } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import classes from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/builder' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Guides', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'About Us', href: '#' },
];

export default function Navbar() {
  const navigate = useNavigate();

  const handleNavClick = (e, link) => {
    if (link.href === '/builder') {
      e.preventDefault();
      navigate('/builder');
    } else if (link.href === '/') {
      e.preventDefault();
      navigate('/');
    }
  };

  return (
    <nav className={classes.navbar}>
      <Link to="/" className={classes.logo}>HiHired</Link>
      <div className={classes.links}>
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={classes.link}
            onClick={(e) => handleNavClick(e, link)}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className={classes.actions}>
        <Link to="/builder">
          <Button className={classes.startFree}>Start Free</Button>
        </Link>
        <Button className={classes.loginBtn} variant="default" onClick={() => navigate('/builder')}>Login</Button>
      </div>
    </nav>
  );
}
