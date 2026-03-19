export default function ContestLoading() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
        <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>Caricamento contest...</p>
      </div>
    </div>
  );
}
