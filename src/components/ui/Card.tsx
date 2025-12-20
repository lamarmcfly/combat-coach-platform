import { ReactNode, MouseEventHandler } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
