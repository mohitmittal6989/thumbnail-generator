import { useEffect, useState } from "react";
import { api } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ThumbnailCard from "../components/ThumbnailCard";

const Community = ({ setToast }) => {
  const [items, setItems] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await api.getCommunityFeed();
        setItems(data.thumbnails);
        setIdeas(data.trendingIdeas);
      } catch (error) {
        setToast({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [setToast]);

  const handleLike = async (id) => {
    try {
      const data = await api.likeThumbnail(id);
      setItems(
        items.map((item) => (item._id === id ? { ...item, likes: data.likes } : item))
      );
    } catch (error) {
      setToast({ type: "error", message: error.message });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
        <div className="glass-card rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-pink">Trending Ideas</p>
          <div className="mt-5 space-y-3">
            {ideas.map((idea) => (
              <div key={idea} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                {idea}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-cyan">Public Feed</p>
          <h1 className="mt-3 text-4xl font-black text-white">Latest creator thumbnails</h1>
          <p className="mt-3 text-slate-300">Explore what the community is generating right now.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading community feed..." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ThumbnailCard
              key={item._id}
              item={item}
              onLike={handleLike}
              showLike
              showAuthor
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;