import type { Metadata } from 'next';
import '../client/src/index.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '하노이타워',
  description: '교육용 하노이타워 퍼즐 게임',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
