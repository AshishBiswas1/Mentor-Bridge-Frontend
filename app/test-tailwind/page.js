export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white mb-4">Tailwind CSS Test Page</h1>
        
        {/* Colors Test */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Color Tests</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-600 text-white p-4 rounded-lg text-center">Blue 600</div>
            <div className="bg-blue-500 text-white p-4 rounded-lg text-center">Blue 500</div>
            <div className="bg-blue-700 text-white p-4 rounded-lg text-center">Blue 700</div>
            <div className="bg-slate-800 text-white p-4 rounded-lg text-center">Slate 800</div>
            <div className="bg-slate-700 text-white p-4 rounded-lg text-center">Slate 700</div>
            <div className="bg-slate-600 text-white p-4 rounded-lg text-center">Slate 600</div>
          </div>
        </div>

        {/* Typography Test */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Typography Tests</h2>
          <p className="text-slate-300 text-lg mb-2">Large text - slate-300</p>
          <p className="text-slate-400 mb-2">Normal text - slate-400</p>
          <p className="text-slate-500 text-sm">Small text - slate-500</p>
        </div>

        {/* Button Tests */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Button Tests</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-blue-500/30">
              Primary Button
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold border border-white/30 backdrop-blur-sm transition-all">
              Secondary Button
            </button>
            <button className="text-white hover:bg-white/10 px-6 py-3 rounded-full font-semibold transition-all">
              Ghost Button
            </button>
          </div>
        </div>

        {/* Spacing Test */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Spacing Tests</h2>
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded">Padding 4</div>
            <div className="bg-slate-800 p-6 rounded">Padding 6</div>
            <div className="bg-slate-800 p-8 rounded">Padding 8</div>
          </div>
        </div>

        {/* Flexbox Test */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Flexbox Tests</h2>
          <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg mb-4">
            <span className="text-white">Left Item</span>
            <span className="text-white">Center Item</span>
            <span className="text-white">Right Item</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-slate-800 p-3 rounded text-white">Stack Item 1</div>
            <div className="bg-slate-800 p-3 rounded text-white">Stack Item 2</div>
            <div className="bg-slate-800 p-3 rounded text-white">Stack Item 3</div>
          </div>
        </div>

        {/* Responsive Test */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Responsive Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-600 p-4 rounded text-white text-center">Responsive Box 1</div>
            <div className="bg-blue-600 p-4 rounded text-white text-center">Responsive Box 2</div>
            <div className="bg-blue-600 p-4 rounded text-white text-center">Responsive Box 3</div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-blue-500 hover:text-blue-400 underline">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
