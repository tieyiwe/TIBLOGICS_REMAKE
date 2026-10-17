// Five stars, filled up to `rating`. Server or client. The label is read out
// once for the whole row ("Rated 5 out of 5").
const PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

export default function Stars({ rating, label, size = 18 }: { rating: number; label: string; size?: number }) {
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-0.5" data-rating={rating}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d={PATH} fill={n <= rating ? "#F5A524" : "#D2DCE8"} />
        </svg>
      ))}
    </span>
  );
}
