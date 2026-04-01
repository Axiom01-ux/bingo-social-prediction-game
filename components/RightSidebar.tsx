
import React, { useState, useEffect, useCallback } from 'react';
import { Prediction } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface TrendingVideo {
  id: string;
  title: string;
  category: 'News' | 'Entertainment' | 'Politics' | 'Finance' | 'Sports' | 'Tech';
  views: string;
  thumbnail: string;
  url: string;
  embedUrl?: string;
  source: 'YouTube' | 'BBC';
}

interface RightSidebarProps {
  trendingPredictions: Prediction[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  trendingPredictions
}) => {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const getEmbedUrl = (url: string, source: 'YouTube' | 'BBC') => {
    if (source === 'YouTube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
    }
    // BBC embedding is more restricted, usually requires their specific player or is just a link
    // For now, we'll return the URL as is if it's already an embed link, or null
    return url.includes('embed') ? url : null;
  };

  const fetchTrendingVideos = useCallback(async (predictions: Prediction[]) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      setPlayingVideoId(null);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const topics = predictions.slice(0, 4).map(p => p.question).join("\n- ");
      
      const prompt = `Find the most RECENT, BREAKING, or LIVE news and social commentary videos from YouTube or BBC News for the following trending social prediction topics:\n- ${topics}\n\nPrioritize "Live" streams, "Breaking News", or videos uploaded within the last few hours. For each topic, provide one high-quality video. Return the result as a JSON array of objects with the following fields: title, category (one of: News, Entertainment, Politics, Finance, Sports, Tech), views (estimate like "1.2M"), thumbnail (use a relevant picsum seed URL if you can't find one), url (direct link to the video), and source ("YouTube" or "BBC").`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                views: { type: Type.STRING },
                thumbnail: { type: Type.STRING },
                url: { type: Type.STRING },
                source: { type: Type.STRING, enum: ["YouTube", "BBC"] }
              },
              required: ["title", "category", "views", "thumbnail", "url", "source"]
            }
          }
        },
      });

      const text = response.text;
      if (text) {
        const parsedVideos = JSON.parse(text);
        setVideos(parsedVideos.map((v: Omit<TrendingVideo, 'id' | 'embedUrl'>, i: number) => {
          const source = v.source;
          return {
            ...v,
            id: `v-${i}-${Date.now()}`,
            embedUrl: getEmbedUrl(v.url, source)
          };
        }));
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch trending videos:", error);
      setVideos([
        {
          id: 'fallback-1',
          title: predictions[0]?.question || 'Latest Social Trends',
          category: 'News',
          views: '500K',
          thumbnail: `https://picsum.photos/seed/${predictions[0]?.id || 'market'}/320/180`,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          source: 'YouTube'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (trendingPredictions.length > 0 && videos.length === 0) {
      fetchTrendingVideos(trendingPredictions);
    }

    // Real-time sync: refresh videos every 5 minutes to keep it "live"
    const interval = setInterval(() => {
      if (trendingPredictions.length > 0) {
        fetchTrendingVideos(trendingPredictions);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [trendingPredictions, videos.length, fetchTrendingVideos]);

  return (
    <div className="flex flex-col h-screen sticky top-0 p-6 space-y-8 w-full max-w-[350px] border-l border-neutral-900 overflow-y-auto">
      {/* Trending Videos Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black text-white italic flex items-center gap-2">
            <i className="fa-solid fa-play text-brand-500"></i>
            Trending Stories
          </h2>
          {isLoading ? (
            <i className="fa-solid fa-circle-notch fa-spin text-brand-400 text-xs"></i>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest animate-pulse">Live Sync</span>
              {lastUpdated && (
                <span className="text-[8px] text-neutral-600 font-medium">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {videos.length > 0 ? (
            videos.map((video) => (
              <div 
                key={video.id} 
                className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] overflow-hidden hover:border-brand-500/30 transition-all group"
              >
                {/* Embed for the playing video, or if it has an embedUrl and is clicked */}
                {(playingVideoId === video.id && video.embedUrl) ? (
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      src={`${video.embedUrl}?autoplay=1`}
                      title={video.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideoId(null);
                      }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
                    >
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => video.embedUrl ? setPlayingVideoId(video.id) : window.open(video.url, '_blank')}
                    className="cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={video.thumbnail.startsWith('http') ? video.thumbnail : `https://picsum.photos/seed/${video.id}/320/180`} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white backdrop-blur-sm">
                        {video.views} views
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center shadow-xl shadow-brand-500/20">
                          <i className="fa-solid fa-play text-white ml-1"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      video.category === 'News' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      video.category === 'Entertainment' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                      video.category === 'Politics' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {video.category}
                    </span>
                    <span className="text-[9px] font-bold text-neutral-600 flex items-center gap-1">
                      <i className={`fa-brands ${video.source === 'YouTube' ? 'fa-youtube text-red-600' : 'fa-bbc text-white'}`}></i>
                      {video.source}
                    </span>
                  </div>
                  <div 
                    onClick={() => video.embedUrl ? setPlayingVideoId(video.id) : window.open(video.url, '_blank')}
                    className="text-sm font-bold text-white leading-snug group-hover:text-brand-400 transition-colors line-clamp-2 cursor-pointer"
                  >
                    {video.title}
                  </div>
                </div>
              </div>
            ))
          ) : !isLoading && (
            <div className="py-8 text-center bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
              <p className="text-neutral-500 text-xs">Syncing with hot stories...</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => fetchTrendingVideos(trendingPredictions)}
          disabled={isLoading}
          className="w-full py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-[11px] font-black text-neutral-400 uppercase tracking-widest hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Refresh stories'}
        </button>
      </div>

    </div>
  );
};

export default RightSidebar;
