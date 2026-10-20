import type { IconType } from "react-icons";
import {
  LuArmchair,
  LuChefHat,
  LuFactory,
  LuLayers,
  LuMicroscope,
  LuPackage,
  LuServer,
  LuTruck,
  LuWarehouse,
} from "react-icons/lu";

const ICONS: Record<string, IconType> = {
  machinery: LuFactory,
  electronics: LuServer,
  vehicles: LuTruck,
  furniture: LuArmchair,
  "raw-materials": LuLayers,
  "medical-lab": LuMicroscope,
  "restaurant-equipment": LuChefHat,
  "warehouse-logistics": LuWarehouse,
};

export function categoryIcon(slug?: string | null): IconType {
  return (slug && ICONS[slug]) || LuPackage;
}

export function CategoryIcon({ slug, className }: { slug?: string | null; className?: string }) {
  const Icon = categoryIcon(slug);
  return <Icon className={className} aria-hidden />;
}
