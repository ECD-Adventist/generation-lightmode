const brands = {
  whatsapp: ["whatsapp", "25D366"],
  facebook: ["facebook", "1877F2"],
  youtube: ["youtube", "FF0000"],
  instagram: ["instagram", "E4405F"],
  tiktok: ["tiktok", "FFFFFF"],
  x: ["x", "FFFFFF"],
  telegram: ["telegram", "26A5E4"],
};

export default function BrandIcon({ brand }) {
  const config = brands[brand];
  if (!config) return null;

  return (
    <img
      src={`https://cdn.simpleicons.org/${config[0]}/${config[1]}`}
      alt=""
      className="w-4 h-4 object-contain shrink-0"
      loading="lazy"
    />
  );
}