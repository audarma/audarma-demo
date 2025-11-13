'use client';

import { useViewTranslation } from 'audarma';
import React, { CSSProperties } from 'react';

interface TranslatedTextProps {
  id: string;
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}

export function TranslatedText({ id, text, as: Component = 'span', className, style }: TranslatedTextProps) {
  const { text: translated } = useViewTranslation('ui', id, text);
  return <Component className={className} style={style}>{translated}</Component>;
}
