import EditorPage from '../../../md-editor/page';

export default function Editor() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-geist-sans), sans-serif'
      }}>
        <h1>このページは開発環境でのみ利用可能です</h1>
      </div>
    );
  }

  return <EditorPage />;
}