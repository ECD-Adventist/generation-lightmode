import { Mail } from "lucide-react";

const brands = {
  whatsapp: ["whatsapp", "FFFFFF"],
  facebook: ["facebook", "FFFFFF"],
  youtube: ["youtube", "FFFFFF"],
  instagram: ["instagram", "FFFFFF"],
  tiktok: ["tiktok", "FFFFFF"],
  x: ["x", "FFFFFF"],
  telegram: ["telegram", "FFFFFF"],
  linkedin: ["linkedin", "FFFFFF"],
};

export default function BrandIcon({ brand }) {
  if (brand === "email") {
    return <Mail className="w-4 h-4 text-white" />;
  }

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