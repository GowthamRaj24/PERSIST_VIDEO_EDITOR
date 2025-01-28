import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScriptDisplay from './ScriptDisplay';
import Backend_Url from './BackendUrl';


const AIVideoEditor = () => {
  const [finalGeneratedContent , setFinalGeneratedContent] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
const [isApplyingModifications, setIsApplyingModifications] = useState(false);
  const [activeStep, setActiveStep] = useState('input');
  const [videoSource, setVideoSource] = useState('youtube');
  const [videoInput, setVideoInput] = useState('');
  const [topic, setTopic] = useState('');
  const [gotDetails, setgotDetails] = useState({});
  
  // Add these to your component
const [activeVideo, setActiveVideo] = useState(null);


const [scriptOptions, setScriptOptions] = useState({
  tone: 'professional',
  length: 'medium',
  style : 'narrative'
});
const [targetLanguage, setTargetLanguage] = useState('es');
const [generatedScript, setGeneratedScript] = useState("");
const [customPrompt, setCustomPrompt] = useState('');

// Add supported languages constant
const supportedLanguages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

// Handler functions
const handleGenerateScript = async () => {
  setIsGeneratingScript(true);
  try {
    const contentOn = {};
  for (const [videoId] of Object.entries(generatedContent.transcripts)) {
    console.log('Generating script for video:', videoId);
    contentOn[videoId] = generatedContent.transcripts[videoId].map(segment => ({
      text: segment.text,
      start: (segment.startTime),
      end: (segment.endTime)
    }))
  }

  
  console.log('Generated content:', contentOn);

      const response = await fetch(Backend_Url + '/script/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             gotDetails : contentOn,
              topic: generatedContent.transcripts,
              customPrompt : customPrompt,
              customization : {
                  tone: scriptOptions.tone,
                  length: scriptOptions.length,
                  style: scriptOptions.style,
              }
          })
      });
      const result = await response.json();
      
      console.log("-------");
      console.log(result.data.script);
      setFinalGeneratedContent(result.data.script)


  } catch (error) {
      console.error('Script generation failed:', error);
  }
  finally {
    setIsGeneratingScript(false);
  }
};



const handleCopyToClipboard = () => {
  navigator.clipboard.writeText(generatedScript);
  alert('Script copied to clipboard');
};

const handleCustomModification = async () => {
  try {
      const response = await fetch(Backend_Url+'/script/customize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              script: generatedScript,
              customPrompt
          })
      });
      const result = await response.json();
      setGeneratedScript(result.data);
  } catch (error) {
      console.error('Custom modification failed:', error);
  }
};

const handleFinish = () => {
  console.log('Script generation completed');
};


  const [customization, setCustomization] = useState({
    tone: 'professional',
    length: 'default',
    style: 'narrative',
    format: 'standard',
    targetAudience: 'general'
  });
  const [targetLanguages, setTargetLangcuages] = useState([]);
  const [generatedContent, setGeneratedContent] = useState({
    transcripts: [],
    script: '',
    translations: {}
  });
  const [loading, setLoading] = useState(false);

const handleRemoveVideo = (videoId) => {
  setgotDetails(prevDetails => ({
      ...prevDetails,
      videos: prevDetails.videos.filter(video => video.id !== videoId)
  }));
};

const handleGenerateAllTranscripts = async () => {
    setLoading(true);
    try {
        if (videoSource === 'external') {
            const response = await fetch(`${Backend_Url}/transcript/drive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: videoInput })
            });
            
            const result = await response.json();
            if (result.success) {
                setGeneratedContent(prev => ({
                    ...prev,
                    transcripts: { external: result.data }
                }));
                setShowToast({
                    visible: true,
                    message: 'External video transcript generated successfully!'
                });
                setActiveStep('customize');
            }
        } else {
            const transcripts = {};
            for (const video of gotDetails.videos) {
                console.log('Generating transcript for video:', video.id);
                const response = await fetch(`${Backend_Url}/transcript/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoId: video.id,
                        title: video.title
                    })
                });

                const result = await response.json();
                if (result.success) {
                    transcripts[video.id] = result.data;
                }
            }

            setGeneratedContent(prev => ({
                ...prev,
                transcripts
            }));

            setShowToast({
                visible: true,
                message: 'Transcripts generated successfully!'
            });

            setActiveStep('customize');
        }
    } catch (error) {
        setShowToast({
            visible: true,
            message: 'Error generating transcripts: ' + error.message
        });
    } finally {
        setLoading(false);
    }
};


  const videoSources = [
    { id: 'youtube', label: 'YouTube Video' },
    { id: 'playlist', label: 'YouTube Playlist' },
    { id: 'external', label: 'External URL' }
  ];

const [showToast, setShowToast] = useState({ visible: false, message: '' });


const handleGenerateTranscript = () => {
  
}

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            setShowToast({
                visible: true,
                message: 'File size should be less than 100MB'
            });
            return;
        }
        
        if (!file.type.startsWith('video/')) {
            setShowToast({
                visible: true,
                message: 'Please upload a valid video file'
            });
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            setVideoInput(e.target.result);
        };
        reader.readAsDataURL(file);
    }
};


  const customizationOptions = {
    tone: ['professional', 'casual', 'formal', 'friendly'],
    length: ['short', 'default', 'extended'],
    style: ['narrative', 'educational', 'conversational', 'dramatic'],
    format: ['standard', 'interview', 'storytelling', 'tutorial'],
    targetAudience: ['general', 'technical', 'business', 'academic']
  };

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
        let videoProcessingEndpoint;
        switch(videoSource) {
            case 'youtube':
                videoProcessingEndpoint = '/video/youtube';
                break;
            case 'playlist':
                videoProcessingEndpoint = '/video/playlist';
                break;
            case 'local':
                videoProcessingEndpoint = '/video/upload';
                break;
            case 'external':
                videoProcessingEndpoint = '/transcript/drive';
                break;
        }

        if (videoSource === 'external') {
            if (!videoInput) {
                setShowToast({
                    visible: true,
                    message: 'Please provide a valid external video URL'
                });
                return;
            }
            
            const transcripts = {};
                const response = await fetch(Backend_Url+'/transcript/drive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoUrl: videoInput
                    })
                });
                const result = await response.json();
                transcripts["videoId"] = result.data;

                console.log(transcripts);
            
      
            setGeneratedContent(prev => ({
                ...prev,
                transcripts
            }));

            console.log(generatedContent.transcripts);
            setShowToast({
                visible: true,
                message: 'Transcripts generated successfully!'
            });
            setActiveStep('customize');
        }

        else{

        const videoData = await fetch(Backend_Url+`${videoProcessingEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoUrl: videoInput,
                topic: topic
            })
        });

        console.log(videoData)
        const videoResult = await videoData.json();
        
        // Normalize the data structure for both single video and playlist
        const normalizedVideos = videoSource === 'playlist' 
            ? videoResult.videos 
            : [videoResult.video];

        setgotDetails({
            videos: normalizedVideos,
            type: videoSource
        });

        setActiveStep('transcribe');
      }

    } catch (error) {
        setShowToast({
            visible: true,
            message: 'Error: ' + error.message
        });
    } finally {
        setLoading(false);
    }
  
};



  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.8),rgba(17,24,39,0.5))]" />
      </div>
  
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Persist Video Script Studio
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            Makes Video Editing Easier and Faster
          </p>
        </motion.header>
  
        {/* Main Card */}
        <motion.div
          layout
          className="max-w-4xl mx-auto"
        >
          {/* Progress Steps */}
          <div className="flex justify-between mb-8 px-4">
            {['Input', 'Transcribe', 'Customize', 'Translate'].map((step, index) => (
              <div key={step} className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                    ${activeStep === step.toLowerCase() 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-800 text-gray-400'}`}
                >
                  {index + 1}
                </motion.div>
                {index < 3 && (
                  <div className="w-24 h-0.5 mx-2 bg-gray-800" />
                )}
              </div>
            ))}
          </div>
  
          {/* Content Card */}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-700/30">
            <AnimatePresence mode="wait">
              {/* Input Step */}
              {activeStep === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Source Selection */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {videoSources.map(source => (
                      <motion.button
                        key={source.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setVideoSource(source.id)}
                        className={`p-4 rounded-xl transition-all duration-200
                          ${videoSource === source.id
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}`}
                      >
                        {source.label}
                      </motion.button>
                    ))}
                  </div>
  
                  {/* Input Fields */}
                  <div className="space-y-6">
                    {videoSource === 'local' ? (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                      >
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          id="video-upload"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="video-upload" className="cursor-pointer">
                          <div className="text-purple-400 hover:text-purple-300">
                            Drop your video here or click to browse
                          </div>
                        </label>
                      </motion.div>
                    ) : (
                      <input
                        type="url"
                        value={videoInput}
                        onChange={(e) => setVideoInput(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-900/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                        placeholder={`Enter ${videoSource} URL`}
                      />
                    )}
  
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-900/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all h-32 resize-none"
                      placeholder="Describe your desired video topic and style..."
                    />
                  </div>
  
                            <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              await handleGenerate();
                              if (videoSource === 'external') {
                              setActiveStep('customize');
                              }
                            }}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-medium text-lg relative overflow-hidden group"
                            >
                            {loading ? (
                              <div className="flex items-center justify-center gap-3">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                              </div>
                            ) : (
                              <span className="relative z-10">Get Details</span>
                            )}
                            </motion.button>
                          </motion.div>
                          )}
                    
                          
{activeStep === 'transcribe' && (
    <motion.div
        key="transcribe"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
    >
        <div className="grid grid-cols-1 gap-8">
            {gotDetails.videos?.map((video, index) => (
                <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.2 }
                    }}
                    className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700/50 relative group"
                >
                    {/* Remove Button */}
                    <button
                        onClick={() => handleRemoveVideo(video.id)}
                        className="absolute top-2 right-2 z-10 bg-red-500/80 hover:bg-red-500 
                                 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Video Section */}
                    <div className="aspect-video w-full">
                        <iframe
                            src={`https://www.youtube.com/embed/${video.id}`}
                            title={video.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>

                    {/* Video Info */}
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                            <h3 className="text-xl font-semibold text-white">
                                {video.title}
                            </h3>
                            {video.duration && (
                                <span className="text-sm text-gray-400 whitespace-nowrap">
                                    {video.duration}
                                </span>
                            )}
                        </div>

                        {/* Video Description */}
                        {video.description && (
                            <p className="text-gray-400 text-sm line-clamp-3">
                                {video.description}
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateAllTranscripts}
              className="w-full py-4 bg-purple-500 hover:bg-purple-600 
                   text-white rounded-xl transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Transcripts...
                </div>
              ) : (
                'Generate Transcripts for Selected Videos'
              )}
            </motion.button>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveStep('input')}
                    className="px-6 py-3 bg-gray-700 rounded-xl text-gray-300 hover:bg-gray-600"
                >
                    Back
                </motion.button>
                
                {/* <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveStep('customize')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white"
                    disabled={!Object.keys(generatedContent.transcripts).length}
                >
                    Continue to Customize
                </motion.button> */}
            </div>
        </div>
    </motion.div>
)}

{/* Transcript Step */}
{activeStep === 'customize' && (
    <motion.div
        key="transcripts"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
    >
        {/* Video Navigation - Only show for YouTube videos */}
        {videoSource !== 'external' && (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {gotDetails.videos?.map((video, index) => (
                    <motion.button
                        key={video.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveVideo(video.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all ${
                            activeVideo === video.id 
                                ? 'bg-purple-500 text-white' 
                                : !generatedContent.transcripts[video.id]
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Video {index + 1}
                    </motion.button>
                ))}
            </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
            {/* Video and Details Section - Only for YouTube */}
            {videoSource !== 'external' && (
                <div className="col-span-12 lg:col-span-5 space-y-4">
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                        <iframe
                            src={`https://www.youtube.com/embed/${activeVideo}`}
                            className="w-full h-full"
                            allowFullScreen
                        />
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                            {gotDetails.videos.find(v => v.id === activeVideo)?.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {gotDetails.videos.find(v => v.id === activeVideo)?.description}
                        </p>
                    </div>
                </div>
            )}

{/* Transcript Timeline */}
<div className={`col-span-12 ${videoSource === 'external' ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
    <div className="bg-gray-800/50 rounded-xl p-6 h-[600px] overflow-y-auto custom-scrollbar">
        {videoSource === 'external' 
            ? generatedContent.data?.map((segment, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex gap-4 pb-6"
                >
                    <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-gray-700 group-last:hidden" />
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-purple-500" />
                        </div>
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-sm text-gray-500 whitespace-nowrap">
                            {(segment.startTime)}s - {(segment.endTime)}s
                        </div>
                    </div>
                    <div className="flex-1 bg-gray-900/50 rounded-xl p-4 ml-4 hover:bg-gray-900/70 transition-colors">
                        <p className="text-gray-300">{segment.text}</p>
                    </div>
                </motion.div>
            ))
            : generatedContent.transcripts[activeVideo]?.map((segment, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex gap-4 pb-6"
                >
                    <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-gray-700 group-last:hidden" />
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-purple-500" />
                        </div>
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-sm text-gray-500 whitespace-nowrap">
                            {segment.startTime}s - {segment.endTime}s
                        </div>
                    </div>
                    <div className="flex-1 bg-gray-900/50 rounded-xl p-4 ml-4 hover:bg-gray-900/70 transition-colors">
                        <p className="text-gray-300">{segment.text}</p>
                    </div>
                </motion.div>
            ))
        }
    </div>
</div>
</div>
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveStep('transcribe')}
                className="px-6 py-3 bg-gray-700 rounded-xl text-gray-300 hover:bg-gray-600"
            >
                Back
            </motion.button>
            
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveStep('translate')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white"
            >
                Continue to Customize
            </motion.button>
        </div>
    </motion.div>
)}


{activeStep === 'translate' && (
    <motion.div
        key="translate"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
    >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Script Options</h3>
                <div className="grid grid-cols-2 gap-4">
                    <select 
                        onChange={(e) => setScriptOptions(prev => ({...prev, tone: e.target.value}))}
                        className="bg-gray-800 text-gray-300 rounded-lg p-2"
                    >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="formal">Formal</option>
                        <option value="friendly">Friendly</option>
                        <option value="neutral">Neutral</option>
                    </select>
                    <select 
                        onChange={(e) => setScriptOptions(prev => ({...prev, length: e.target.value}))}
                        className="bg-gray-800 text-gray-300 rounded-lg p-2"
                    >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                    </select>
                    <select 
                        onChange={(e) => setScriptOptions(prev => ({...prev, style: e.target.value}))}
                        className="bg-gray-800 text-gray-300 rounded-lg p-2"
                    >
                        <option value="narrative">Narrative</option>
                        <option value="educational">Educational</option>
                        <option value="conversational">Conversational</option>
                        <option value="dramatic">Dramatic</option>
                    </select>
                </div>
                
                <button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                    {isGeneratingScript ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        'Generate Script'
                    )}
                </button>
            </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Generated Script</h3>
                <button
                    onClick={handleCopyToClipboard}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                </button>
            </div>

            <div className="h-[400px] overflow-y-auto custom-scrollbar">
                <ScriptDisplay generatedScript={finalGeneratedContent} />
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Custom Modifications</h3>
            <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom instructions to modify the script..."
                className="w-full h-32 bg-gray-800 text-gray-300 rounded-lg p-4 resize-none"
            />
            <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
            >
                {isGeneratingScript ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Applying Changes...</span>
                    </>
                ) : (
                    'Apply Custom Modifications'
                )}
            </button>
        </div>

        <div className="flex justify-between pt-6">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveStep('customize')}
                className="px-6 py-3 bg-gray-700 rounded-xl text-gray-300 hover:bg-gray-600"
            >
                Back
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white"
            >
                Finish
            </motion.button>
        </div>
    </motion.div>
)}




            </AnimatePresence>
          </div>
        </motion.div>
      </div>
  
      {/* Toast Notifications */}
      <AnimatePresence>
        {showToast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-purple-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  
};

export default AIVideoEditor;
