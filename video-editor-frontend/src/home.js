import { useState } from 'react';
import { motion } from 'framer-motion';
import Backend_Url from './BackendUrl';

const Home = () => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [videos, setVideos] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {

      const playlistResponse = await fetch(Backend_Url + '/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl })
      });
      const playlistData = await playlistResponse.json();
      setVideos(playlistData.data);

      const scriptResponse = await fetch(Backend_Url+'/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl, topic })
      });
      const scriptData = await scriptResponse.json();
      setTranscript(scriptData.data.script);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
            Video Script Generator
          </h1>
          <p className="mt-4 text-gray-300 text-xl">
            Transform YouTube playlists into customized video scripts
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-8 bg-gray-800/50 p-8 rounded-2xl backdrop-blur-sm shadow-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <label className="block text-gray-300 mb-2 text-lg">YouTube Playlist URL</label>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="https://www.youtube.com/playlist?list=..."
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-lg">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter your topic..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : 'Generate Script'}
            </button>
          </motion.form>

          {videos.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16"
            >
              <h2 className="text-3xl font-bold text-white mb-8">Playlist Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <motion.a
                    key={video.videoId}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gray-800/50 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                    whileHover={{ y: -5 }}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold line-clamp-2">{video.title}</h3>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {transcript && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16 bg-gray-800/50 p-8 rounded-2xl backdrop-blur-sm"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Generated Script</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{transcript}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;