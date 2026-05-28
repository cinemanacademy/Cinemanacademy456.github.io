export type Unit = "cm" | "in";

export type Garment = "shirt" | "trousers" | "jacket" | "dress";

export interface MeasurementField {
  key: string;
  label: string;
  hint: string;
  garments: Garment[];
  /** rough realistic ranges in centimetres, used for soft validation */
  min: number;
  max: number;
}

export const GARMENTS: { id: Garment; label: string; emoji: string }[] = [
  { id: "shirt", label: "Shirt", emoji: "👔" },
  { id: "trousers", label: "Trousers", emoji: "👖" },
  { id: "jacket", label: "Jacket", emoji: "🧥" },
  { id: "dress", label: "Dress", emoji: "👗" },
];

export const FIELDS: MeasurementField[] = [
  { key: "neck", label: "Neck", hint: "Around the base of the neck", garments: ["shirt", "jacket", "dress"], min: 25, max: 55 },
  { key: "chest", label: "Chest / Bust", hint: "Fullest part of the chest", garments: ["shirt", "jacket", "dress"], min: 60, max: 160 },
  { key: "waist", label: "Waist", hint: "Natural waistline", garments: ["shirt", "trousers", "jacket", "dress"], min: 50, max: 150 },
  { key: "hips", label: "Hips", hint: "Fullest part of the hips", garments: ["trousers", "dress"], min: 60, max: 160 },
  { key: "shoulder", label: "Shoulder", hint: "Seam to seam across the back", garments: ["shirt", "jacket", "dress"], min: 30, max: 60 },
  { key: "sleeve", label: "Sleeve length", hint: "Shoulder to wrist", garments: ["shirt", "jacket", "dress"], min: 40, max: 80 },
  { key: "bicep", label: "Bicep", hint: "Around the fullest part of the arm", garments: ["shirt", "jacket"], min: 20, max: 55 },
  { key: "inseam", label: "Inseam", hint: "Crotch to ankle", garments: ["trousers"], min: 50, max: 100 },
  { key: "outseam", label: "Outseam", hint: "Waist to ankle", garments: ["trousers"], min: 70, max: 130 },
  { key: "thigh", label: "Thigh", hint: "Around the fullest part", garments: ["trousers"], min: 35, max: 90 },
  { key: "height", label: "Height", hint: "Standing, without shoes", garments: ["shirt", "trousers", "jacket", "dress"], min: 120, max: 220 },
];

export const CM_PER_IN = 2.54;

export function toUnit(valueCm: number, unit: Unit): number {
  return unit === "cm" ? valueCm : valueCm / CM_PER_IN;
}

export function fromUnit(value: number, unit: Unit): number {
  return unit === "cm" ? value : value * CM_PER_IN;
}

export interface SavedRecord {
  id: string;
  name: string;
  garment: Garment;
  unit: Unit;
  notes: string;
  values: Record<string, number>; // stored in cm
  createdAt: number;
}
