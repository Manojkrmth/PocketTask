'use client';

import React, { useEffect, useRef } from 'react';

const AdComponent: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adContainerRef.current && adContainerRef.current.children.length === 0) {
      const script1 = document.createElement('script');
      script1.innerHTML = `
        atOptions = {
          'key' : 'b31c5dc255761c9f094798ba3a76e1c2',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      adContainerRef.current.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://www.highperformanceformat.com/b31c5dc255761c9f094798ba3a76e1c2/invoke.js';
      script2.async = true;
      adContainerRef.current.appendChild(script2);
    }

    // Cleanup function to remove scripts when the component unmounts
    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={adContainerRef} style={{ width: '300px', height: '250px' }}></div>;
};

export default AdComponent;
