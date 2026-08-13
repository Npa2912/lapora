export type HeroSpec = {
  icon: "cpu" | "screen" | "weight" | "battery";
  label: string;
  value: string;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  images: string[];
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    screen: string;
  };
  isNew: boolean;
  rating: number;
  isFeaturedHero?: boolean;
  heroTagline?: string;
  heroBackground?: string;
  heroSpecs?: HeroSpec[];
};  