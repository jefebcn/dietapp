'use client';
import Link from 'next/link';
export default function InsightsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight:'100dvh', background:'#F3F6F0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24, textAlign:'center' }}>
      <span style={{ fontSize:52 }}>📊</span>
      <h2 style={{ fontSize:20, fontWeight:800, color:'#1C1917' }}>Errore nel caricamento</h2>
      <p style={{ fontSize:14, color:'#6B7280', maxWidth:280 }}>Impossibile caricare Insights. Riprova o torna alla home.</p>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
        <button onClick={reset} style={{ padding:'10px 20px', borderRadius:99, background:'#F97316', color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer' }}>Riprova</button>
        <Link href="/dashboard" style={{ padding:'10px 20px', borderRadius:99, background:'#fff', border:'1.5px solid #E5EBE0', color:'#1C1917', fontWeight:700, fontSize:14, textDecoration:'none' }}>Home</Link>
      </div>
    </div>
  );
}
