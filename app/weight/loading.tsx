export default function Loading() {
  return (
    <div style={{ minHeight:'100dvh', background:'#F3F6F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #E5EBE0', borderTopColor:'#F97316', animation:'spin 0.8s linear infinite' }}/>
        <p style={{ fontSize:13, color:'#9CA3AF', fontWeight:600 }}>Caricamento…</p>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
