const ScriptDisplay = ({ generatedScript }) => {
    const formatTime = (timeStr) => {
      const time = parseFloat(timeStr);
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
  
    // Clean and parse the string response
    const cleanAndParseScript = (script) => {
      if (!script) return [];
      const cleanScript = script.replace(/```json|\```/g, '').trim();
      try {
        return JSON.parse(cleanScript);
      } catch (error) {
        console.log('Parsing info:', error);
        return [];
      }
    };
  
    const segments = cleanAndParseScript(generatedScript);
  
    return (
      <div className="h-[600px] overflow-y-auto custom-scrollbar bg-gray-800/30 rounded-xl p-6">
        <div className="space-y-8">
          {segments.map((segment, index) => (
            <div 
              key={index} 
              className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all shadow-lg group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 px-4 py-2 rounded-full">
                    <span className="text-blue-400 font-semibold">
                      Segment {index + 1}
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-gray-800/50 rounded-full">
                    <span className="text-xs font-medium text-gray-400">
                      {segment.videoId}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => window.open(`https://youtube.com/watch?v=${segment.videoId}&t=${Math.floor(parseFloat(segment.startTime))}`, '_blank')}
                    className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span className="font-medium hidden sm:inline">Watch</span>
                  </button>
                </div>
              </div>
  
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/20 rounded-full group-hover:bg-blue-500/40 transition-colors"></div>
                <div className="pl-6">
                  <p className="text-gray-300 leading-relaxed">
                    {segment.transcriptText}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      Duration: {(parseFloat(segment.endTime) - parseFloat(segment.startTime)).toFixed(2)}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default ScriptDisplay;
  