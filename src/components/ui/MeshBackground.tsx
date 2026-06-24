export default function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px] animate-float" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-400/8 blur-[120px] animate-float-delayed" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-amber-400/8 blur-[100px] animate-float" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  )
}
