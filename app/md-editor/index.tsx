'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('# マークダウンエディタ\n\nここにマークダウンを書いてください...\n\n## 機能\n\n- リアルタイムプレビュー\n- クリップボードコピー\n- 分割表示モード\n\n### コード例\n\n```javascript\nconst hello = () => {\n  console.log("Hello, World!");\n};\n```\n\n> これはblockquoteの例です。\n\n**太字** と *斜体* のテストです。');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      alert('クリップボードにコピーしました！');
    } catch (err) {
      console.error('コピーに失敗しました:', err);
      alert('コピーに失敗しました');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e1e5e9',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          マークダウンエディタ
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              backgroundColor: isPreviewMode ? '#0969da' : '#ffffff',
              color: isPreviewMode ? '#ffffff' : '#24292f',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isPreviewMode ? 'エディタ' : 'プレビュー'}
          </button>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '8px 16px',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#24292f',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            コピー
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0
      }}>
        {!isPreviewMode && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f6f8fa',
              borderBottom: '1px solid #e1e5e9',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              マークダウン
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '16px',
                fontSize: '14px',
                fontFamily: 'var(--font-geist-mono), Monaco, Menlo, monospace',
                resize: 'none',
                lineHeight: '1.5'
              }}
              placeholder="ここにマークダウンを入力してください..."
            />
          </div>
        )}

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: isPreviewMode ? 'none' : '1px solid #e1e5e9'
        }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f6f8fa',
            borderBottom: '1px solid #e1e5e9',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            プレビュー
          </div>
          <div style={{
            flex: 1,
            padding: '16px',
            overflow: 'auto',
            backgroundColor: '#ffffff'
          }}>
            <ReactMarkdown
              components={{
                h1: ({children}) => <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #e1e5e9', paddingBottom: '8px' }}>{children}</h1>,
                h2: ({children}) => <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', marginTop: '24px' }}>{children}</h2>,
                h3: ({children}) => <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', marginTop: '16px' }}>{children}</h3>,
                p: ({children}) => <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>{children}</p>,
                ul: ({children}) => <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>{children}</ul>,
                ol: ({children}) => <ol style={{ marginBottom: '16px', paddingLeft: '24px' }}>{children}</ol>,
                li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                code: ({children}) => <code style={{ backgroundColor: '#f6f8fa', padding: '2px 4px', borderRadius: '3px', fontFamily: 'var(--font-geist-mono), Monaco, Menlo, monospace', fontSize: '85%' }}>{children}</code>,
                pre: ({children}) => <pre style={{ backgroundColor: '#f6f8fa', padding: '16px', borderRadius: '6px', overflow: 'auto', marginBottom: '16px' }}>{children}</pre>,
                blockquote: ({children}) => <blockquote style={{ borderLeft: '4px solid #d0d7de', paddingLeft: '16px', marginBottom: '16px', color: '#656d76' }}>{children}</blockquote>
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}