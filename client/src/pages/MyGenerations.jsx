import { useEffect, useState } from "react";
import { api } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ThumbnailCard from "../components/ThumbnailCard";

const MyGenerations = ({ setToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getMyThumbnails();
        setItems(data.thumbnails);
      } catch (error) {
        setToast({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setToast]);

  const handleDelete = async (id) => {
    try {
      await api.deleteThumbnail(id);
      setItems(items.filter((item) => item._id !== id));
      setToast({ type: "success", message: "Thumbnail deleted" });
    } catch (error) {
      setToast({ type: "error", message: error.message });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-pink">Library</p>
        <h1 className="mt-3 text-4xl font-black text-white">My Generations</h1>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your thumbnails..." />
      ) : items.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ThumbnailCard key={item._id} item={item} onDelete={handleDelete} showDelete />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-[32px] px-6 py-12 text-center text-slate-300">
          No thumbnails yet. Generate your first one from the studio page.
        </div>
      )}
    </div>
  );
};

export default MyGenerations;