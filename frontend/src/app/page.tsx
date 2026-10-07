export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 bg-gray-900 p-10 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            PATCHPILOT X
          </h1>
          <p className="text-gray-400 text-lg">AI Software Engineering Agent</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="repoUrl" className="text-sm font-medium text-gray-300">
              Repository URL
            </label>
            <input
              id="repoUrl"
              type="text"
              placeholder="https://github.com/azriel-gershom/PatchPilot-X.git"
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="changeRequest" className="text-sm font-medium text-gray-300">
              Change Request
            </label>
            <textarea
              id="changeRequest"
              rows={4}
              placeholder="Describe the bug or feature you want to patch..."
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200 resize-none transition-colors"
            ></textarea>
          </div>

          <button
            disabled
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
          >
            RUN PATCHPILOT
          </button>
        </div>
      </div>
    </div>
  );
}
