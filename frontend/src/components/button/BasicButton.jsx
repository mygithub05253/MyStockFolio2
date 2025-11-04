import React from 'react';

const BasicButton = React.forwardRef(({ children, size = 'medium', shape = 'default', variant = 'black', color = 'white', className = '', ...rest }, ref) => {

  const sizeClasses = {
    small: 'w-16 h-8 py-4 px-0',
    medium: 'w-24 h-12 py-4 px-0',
    large: 'w-32 h-16 py-4 px-0',
    full: 'w-full aspect-[8/1] py-4 px-0',
  };

  const shapeClasses = {
    default: '',
    small: 'rounded-lg',
    large: 'rounded-xl',
    big: 'rounded-3xl',
    round: 'rounded-full',
  };

  const variantClasses = {
    black: 'bg-black',
  };

  const colorClasses = {
    white: 'text-white',
    black: 'text-gray-900',
  };

  const combinedClassName = `
    border-none cursor-pointer flex items-center justify-center 
    ${sizeClasses[size] || sizeClasses.medium} 
    ${shapeClasses[shape] || shapeClasses.default} 
    ${variantClasses[variant] || variantClasses.black} 
    ${colorClasses[color] || colorClasses.white} 
    ${className} 
  `;

  return (
    <button ref={ref} className={combinedClassName.trim()} {...rest}>
      {children}
    </button>
  );
});

export default BasicButton;