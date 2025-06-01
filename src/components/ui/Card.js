// src/components/ui/Card.js
import React from 'react';
import './Card.css'; // dodamy styl do karty

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-container ${className}`} {...props}>
      {children}
    </div>
  );
};

export { Card };
