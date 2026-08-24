const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-purple/30 border-t-brand-pink" />
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
};

export default LoadingSpinner;