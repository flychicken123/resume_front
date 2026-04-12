import { Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import classes from './Navbar.module.css';

const NAV_LINKS = ['Home', 'Jobs', 'How It Works', 'Features', 'Guides', 'Contact', 'About Us'];

export default function Navbar() {
  return (
    <nav className={classes.navbar}>
      <Link to="/" className={classes.logo}>HiHired</Link>
      <div className={classes.links}>
        {NAV_LINKS.map((label) => (
          <a key={label} href="#" className={classes.link}>{label}</a>
        ))}
      </div>
      <div className={classes.actions}>
        <Link to="/builder">
          <Button className={classes.startFree}>Start Free</Button>
        </Link>
        <Button className={classes.loginBtn} variant="default">Login</Button>
      </div>
    </nav>
  );
}
