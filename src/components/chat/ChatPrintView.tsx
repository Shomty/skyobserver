import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';

export interface ChatPrintMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPrintViewProps {
  title: string;
  subjectName?: string | null;
  date?: string;
  messages: ChatPrintMessage[];
}

/**
 * Screen-hidden, paper-optimized render of a conversation. Portalled to <body>
 * and revealed only during printing by the `.print-root` rules in index.css —
 * see the comment there for why it cannot live inside the app shell. Rendered
 * on a white background with dark text so "Save as PDF" produces a clean,
 * readable document regardless of app theme.
 */
function ChatPrintView({ title, subjectName, date, messages }: ChatPrintViewProps) {
  const content = (
    <div id="chat-print-root" className="hidden print:block print-root" style={{ padding: 24 }}>
      <header style={{ borderBottom: '2px solid #d4af37', paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#b8860b', fontWeight: 700 }}>
          Vedic Sky Observer · Jyotish AI
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 0', color: '#111' }}>{title}</h1>
        <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
          {subjectName ? `Subject: ${subjectName}` : 'Your Chart'}
          {date ? ` · ${date}` : ''}
        </div>
      </header>

      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        return (
          <div key={i} style={{ marginBottom: 16, breakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontWeight: 700,
                color: isUser ? '#555' : '#b8860b',
                marginBottom: 4,
              }}
            >
              {isUser ? 'You' : 'Jyotish AI'}
            </div>
            {isUser ? (
              <p style={{ margin: 0, color: '#111', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none" style={{ color: '#111' }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return createPortal(content, document.body);
}

export default ChatPrintView;
