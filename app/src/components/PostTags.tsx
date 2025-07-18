interface PostTagsProps {
  tags: string[];
}

export default function PostTags({ tags }: PostTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            display: 'inline-block',
            padding: '2px 6px',
            margin: '2px',
            backgroundColor: '#e6f3ff',
            color: '#0066cc',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '500'
          }}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}