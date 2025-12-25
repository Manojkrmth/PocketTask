'use client';

import React, { useEffect, useRef, memo } from 'react';
import { useInView } from 'react-intersection-observer';

const AdComponent: React.FC = memo(function AdComponent() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const adLoadedRef = useRef(false);

  useEffect(() => {
    if (inView && !adLoadedRef.current) {
      adLoadedRef.current = true;
      try {
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
        ref.current.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://www.highperformanceformat.com/b31c5dc255761c9f094798ba3a76e1c2/invoke.js';
        script2.async = true;
        ref.current.appendChild(script2);
      } catch (e) {
        console.error("Ad script injection failed:", e);
      }
    }
  }, [inView, ref]);

  return <div ref={ref} style={{ width: '300px', height: '250px' }}></div>;
});

export default AdComponent;
