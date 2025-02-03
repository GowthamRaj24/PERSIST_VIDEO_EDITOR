import { useState, useEffect } from 'react';
import Backend_Url from './BackendUrl';

const ScriptDisplay = ({ generatedScript, onClipSelect, selectedClips }) => {
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [videoDetails, setVideoDetails] = useState({});
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

  const [segments, setSegments] = useState(cleanAndParseScript(generatedScript));

useEffect(() => {
  setSegments(cleanAndParseScript(generatedScript));
}, [generatedScript]);

const handleTimeChange = (index, type, value) => {
  const newSegments = [...segments];
  newSegments[index][type === 'start' ? 'startTime' : 'endTime'] = parseFloat(value);
  setSegments(newSegments);
  
  if (isClipSelected(segments[index])) {
    const updatedClip = newSegments[index];
    onClipSelect(updatedClip);
  }
};


  useEffect(() => {
    const fetchVideoDetails = async () => {
      const segments = cleanAndParseScript(generatedScript);
      if (!segments.length) return;

      // Get unique video IDs
      const uniqueVideoIds = [...new Set(segments.map(segment => segment.videoId))];
      
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${uniqueVideoIds.join(',')}&key=AIzaSyB0dBhQyAojhOYsWesVHOKGtZWmnOpi2V0`
        );
        const data = await response.json();
        
        if (data.items) {
          const newVideoDetails = {};
          data.items.forEach(item => {
            newVideoDetails[item.id] = {
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.default.url
            };
          });
          setVideoDetails(newVideoDetails);
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
      }
    };

    fetchVideoDetails();
  }, [generatedScript]);

  const formatTime = (timeStr) => {
    const time = parseFloat(timeStr);
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownloadClip = async (videoId, startTime = null, endTime = null) => {
    const button = document.getElementById(`download-${videoId}`);
    const originalContent = button.innerHTML;

    try {
      button.disabled = true;
      button.innerHTML = 'Downloading...';

      let url = `${Backend_Url}/download-clip?videoId=${videoId}`;
      if (startTime !== null && endTime !== null) {
        url += `&startTime=${startTime}&endTime=${endTime}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = startTime && endTime 
        ? `clip-${videoId}-${startTime}-${endTime}.mp4` 
        : `video-${videoId}.mp4`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      button.innerHTML = 'Downloaded!';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalContent;
      }, 2000);

      return true;
    } catch (error) {
      console.error('Download failed:', error);
      button.innerHTML = 'Failed';
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalContent;
      }, 2000);
      return false;
    }
  };




  const handlePlayVideo = (videoId, startTime) => {
    setActiveVideoId(`${videoId}-${startTime}`);
  };

  const isClipSelected = (segment) => {
    if (!selectedClips || !selectedClips.length) return false;
    return selectedClips.some(
      clip => clip.videoId === segment.videoId && 
      clip.startTime === segment.startTime && 
      clip.endTime === segment.endTime
    );
  };

  

  return (
    <div className="h-full overflow-y-auto bg-gray-800/30 rounded-xl p-6">
      <div className="space-y-8">
        {segments.map((segment, index) => {
          const selected = isClipSelected(segment);
          return (
<div 
  key={index} 
  onClick={() => onClipSelect(segment)}
  className={`bg-gray-900/50 p-6 rounded-xl border transition-all shadow-lg group cursor-pointer
    ${selected ? 'border-purple-500 bg-purple-900/20' : 'border-red-500 hover:border-red-700 bg-red-900/10'}`}
>
  <div className="flex flex-col gap-4 mb-6">
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className={`px-4 py-2 rounded-full ${selected ? 'bg-purple-500/20' : 'bg-red-500/10'}`}>
          <span className={`font-semibold ${selected ? 'text-purple-400' : 'text-red-400'}`}>
            Segment {index + 1}
          </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-300 font-medium">
                        {videoDetails[segment.videoId]?.title || 'Loading...'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {segment.videoId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-gray-800/50 rounded-full">
                      <span className="text-xs font-medium text-gray-400">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVideo(segment.videoId, segment.startTime);
                      }}
                      className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span className="font-medium">Play Clip</span>
                    </button>

                    <input 
  type="number" 
  value={segment.startTime}
  min="0"
  step="0.1"
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
  className="w-16 px-2 py-1 text-xs bg-gray-900 text-gray-300 rounded-lg border border-gray-700"
/>

<input 
  type="number" 
  value={segment.endTime}
  min="0"
  step="0.1"
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
  className="w-16 px-2 py-1 text-xs bg-gray-900 text-gray-300 rounded-lg border border-gray-700"
/>

                    <button 
                      id={`download-${segment.videoId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const startTime = document.getElementById(`start-${segment.videoId}`).value;
                        const endTime = document.getElementById(`end-${segment.videoId}`).value;
                        handleDownloadClip(segment.videoId, startTime, endTime);
                      }}
                      className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                        />
                      </svg>
                      <span className="font-medium">Download</span>
                    </button>
                  </div>
                </div>

                {activeVideoId === `${segment.videoId}-${segment.startTime}` && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${segment.videoId}?start=${Math.floor(parseFloat(segment.startTime))}&end=${Math.floor(parseFloat(segment.endTime))}&autoplay=1`}
                      title={`Segment ${index + 1}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

<div className="relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full transition-colors
        ${selected ? 'bg-purple-500' : 'bg-red-500/20 group-hover:bg-red-500/40'}`}
      />
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScriptDisplay;
