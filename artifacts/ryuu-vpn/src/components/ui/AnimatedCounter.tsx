import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  suffix = "", 
  decimals = 0,
  className = "" 
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const current = value * easeOutExpo;
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {displayValue.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}{suffix}
    </motion.span>
  );
}
