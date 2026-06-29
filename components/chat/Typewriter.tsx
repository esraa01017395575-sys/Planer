import React, { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 10 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        const full = textRef.current;
        if (index >= full.length) {
          clearInterval(interval);
          return full;
        }
        const nextChar = full[index];
        index++;
        return prev + (nextChar !== undefined ? nextChar : "");
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};
