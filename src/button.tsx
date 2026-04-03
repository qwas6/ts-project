import React from 'react';

export enum ButtonVariant {
  Primary = 'primary',
  Reset = 'reset'
}

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = ButtonVariant.Primary }) => {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
};

export default Button;