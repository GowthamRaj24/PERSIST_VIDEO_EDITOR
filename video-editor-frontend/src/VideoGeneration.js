import { useState } from 'react';
import Backend_Url from './BackendUrl';

// Toast notification component
export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {message}
    </div>
  );
};

export const VideoClipSelector = ({ transcripts, onClipSelect, selectedClips }) => {
  return (
    <div className="space-y-4">
      {Object.entries(transcripts).map(([videoId, segments]) => (
        <div key={videoId} className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4">Video Segments</h3>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <label key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedClips.some(clip => 
                    clip.videoId === videoId && 
                    clip.startTime === segment.startTime && 
                    clip.endTime === segment.endTime
                  )}
                  onChange={() => onClipSelect({
                    videoId,
                    startTime: segment.startTime,
                    endTime: segment.endTime,
                    text: segment.text
                  })}
                  className="form-checkbox h-5 w-5 text-purple-500"
                />
                <span className="text-gray-300">
                  {segment.startTime}s - {segment.endTime}s: {segment.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Video generation progress component
export const VideoGenerationProgress = ({ progress, status }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">{status}</span>
          <span className="text-gray-300">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Main video generation handler
export const useVideoGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [showToast, setShowToast] = useState({ visible: false, message: '', type: 'success' });

  const generateVideo = async (selectedClips) => {
    if (selectedClips.length === 0) {
      showToastMessage('Please select at least one clip', 'error');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Initializing video generation...');
    
    try {
      // Step 1: Request video generation
      const response = await fetch(`${Backend_Url}/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clips: selectedClips })
      });

      if (!response.ok) throw new Error('Failed to initiate video generation');
      
      const { jobId } = await response.json();

      // Step 2: Poll for progress
      const pollProgress = async () => {
        const progressResponse = await fetch(`${Backend_Url}/video/status/${jobId}`);
        const { progress: currentProgress, status: currentStatus, downloadUrl: finalUrl } = await progressResponse.json();

        setProgress(currentProgress);
        setStatus(currentStatus);

        if (currentProgress < 100 && !finalUrl) {
          setTimeout(pollProgress, 2000);
        } else {
          setDownloadUrl(finalUrl);
          setIsGenerating(false);
          showToastMessage('Video generated successfully!', 'success');
        }
      };

      await pollProgress();

    } catch (error) {
      console.error('Video generation failed:', error);
      setIsGenerating(false);
      showToastMessage('Failed to generate video: ' + error.message, 'error');
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setShowToast({ visible: true, message, type });
    setTimeout(() => {
      setShowToast({ visible: false, message: '', type: 'success' });
    }, 5000);
  };

  const handleDownload = async () => {
    if (!downloadUrl) {
      showToastMessage('No video available to download', 'error');
      return;
    }

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-video.mp4';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      showToastMessage('Failed to download video', 'error');
    }
  };

  return {
    isGenerating,
    progress,
    status,
    downloadUrl,
    showToast,
    generateVideo,
    handleDownload,
    setShowToast
  };
};

export default {
  VideoClipSelector,
  VideoGenerationProgress,
  Toast,
  useVideoGeneration
};
