import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`bg-white rounded-lg overflow-hidden shadow ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;