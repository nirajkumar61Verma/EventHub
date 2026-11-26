export const eventCategories = {
  "Personal & family": [
    "Wedding",
    "Birthday",
    "Engagement",
    "Anniversary",
    "Baby shower",
    "Graduation",
    "Family celebration",
    "Housewarming / Griha Pravesh",
    "Naming ceremony / Annaprashan",
    "Mundan / first haircut",
    "Thread ceremony / Upanayan",
  ],
  "Office & corporate": [
    "Corporate event",
    "Office Diwali celebration",
    "Retirement",
    "Farewell",
  ],
  "Public & community": [
    "Community event",
    "Festival celebration",
    "Diwali celebration",
    "Holi celebration",
    "Navratri / Durga Puja celebration",
    "Eid celebration",
    "Christmas celebration",
  ],
  "Political & campaign": [
    "Political rally",
    "Campaign meeting",
    "Town hall / public outreach",
  ],
  "Religious & cultural": [
    "Puja / religious ceremony",
  ],
  Other: ["Other"],
} as const;

export type EventCategory = keyof typeof eventCategories;
export const eventCategoryNames = Object.keys(eventCategories) as EventCategory[];
export const eventTypes = Object.values(eventCategories).flat() as string[];
