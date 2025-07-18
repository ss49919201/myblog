interface TagListProps {
  tags: string[];
  selectedTag?: string;
  onTagClick?: (tag: string) => void;
  showAll?: boolean;
}

export default function TagList({ tags, selectedTag, onTagClick, showAll = false }: TagListProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {showAll && (
        <button
          onClick={() => onTagClick?.('')}
          style={{
            padding: '4px 8px',
            margin: '2px',
            backgroundColor: selectedTag === '' ? '#0070f3' : '#f0f0f0',
            color: selectedTag === '' ? 'white' : '#333',
            border: 'none',
            borderRadius: '12px',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          すべて
        </button>
      )}
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagClick?.(tag)}
          style={{
            padding: '4px 8px',
            margin: '2px',
            backgroundColor: selectedTag === tag ? '#0070f3' : '#f0f0f0',
            color: selectedTag === tag ? 'white' : '#333',
            border: 'none',
            borderRadius: '12px',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}