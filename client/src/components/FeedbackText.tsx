'use client';

interface FeedbackTextProps {
  text: string;
  className?: string;
}

export function FeedbackText({ text, className = '' }: FeedbackTextProps) {
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/---+/g, '')
    .trim();

  return (
    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${className}`}>
      {clean}
    </p>
  );
}
