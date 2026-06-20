export default function LookbookPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-4">
      <div className="text-center">
        <span className="text-xs tracking-[0.2em] text-[#D4AF37] uppercase font-bold mb-3 block">COLLECTIONS</span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 tracking-wider mb-4">GR STYLES LOOKBOOK</h1>
        <div className="w-12 h-[2px] bg-[#D4AF37] mx-auto mb-6" />
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Our editorial style sheets and seasonal collections are currently being curated by our styling directors.
        </p>
      </div>
    </div>
  );
}
