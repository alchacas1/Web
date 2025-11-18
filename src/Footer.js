import React from 'react';
import './Footer.css';

const Footer = () => {
  const version = process.env.REACT_APP_VERSION || '0.1.0';

  return (
    <footer className="app-footer">
      <p>Versión {version}</p>
    </footer>
  );
};

export default Footer;
