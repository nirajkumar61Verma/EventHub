import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { indiaLocations, indianStates } from "../indiaLocations";
import QuoteConversation from "../components/QuoteConversation";
import {
  eventCategories,
  eventCategoryNames,
  type EventCategory,
} from "../eventCategories";

type Provider = {
  id: number;
  business_name: string;
  provider_type: string;
  category: string;
  city: string;
  state: string;
  starting_price: number;
  price_unit: string;
  offerings?: ProviderOffering[];
};

type ProviderOffering = {
  id?: number;
  title: string;
  category: string;
  price: number;
  price_unit: string;
  minimum_quantity: number | null;
  event_types: string[];
  all_events: boolean;
};

type ProviderEstimate = {
  amount: number | null;
  calculation: string;
};

type ProviderRate = {
  price: number;
  unit: string;
  minimumQuantity: number;
  title: string;
};

function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function providerRatesForService(
  provider: Provider,
  service: string,
  eventType: string,
): ProviderRate[] {
  const normalizedService = service.trim().toLowerCase();
  const offeringRates = (provider.offerings || [])
    .filter((offering) =>
      offering.category.trim().toLowerCase() === normalizedService
      && (offering.all_events || offering.event_types.includes(eventType)),
    )
    .map((offering) => ({
      price: Number(offering.price),
      unit: offering.price_unit,
      minimumQuantity: Number(offering.minimum_quantity || 0),
      title: offering.title,
    }))
    .filter((rate) => Number.isFinite(rate.price) && rate.price > 0);
  if (offeringRates.length) return offeringRates;
  if ((provider.provider_type || provider.category).trim().toLowerCase() !== normalizedService) {
    return [];
  }
  const price = Number(provider.starting_price);
  return Number.isFinite(price) && price > 0
    ? [{
        price,
        unit: provider.price_unit,
        minimumQuantity: 0,
        title: "Provider starting price",
      }]
    : [];
}

function estimateProviderPrice(
  rate: ProviderRate,
  days: number,
  guests: number,
): ProviderEstimate {
  const price = rate.price;
  const unit = rate.unit.trim().toLowerCase().replace(/^per\s+/, "");
  if (!Number.isFinite(price) || price <= 0) {
    return { amount: null, calculation: "No starting price provided" };
  }
  if (days <= 0) {
    return { amount: null, calculation: "Choose this provider's service in your schedule" };
  }
  if (["plate", "person", "guest"].includes(unit)) {
    if (!Number.isFinite(guests) || guests <= 0) {
      return { amount: null, calculation: "Add the guest count to estimate this rate" };
    }
    const quantity = Math.max(guests, rate.minimumQuantity);
    return {
      amount: price * quantity * days,
      calculation: `${rate.title}: ${formatRupees(price)} / ${unit} × ${quantity.toLocaleString("en-IN")} ${quantity === 1 ? "guest" : "guests"}${quantity > guests ? " minimum" : ""} × ${days} ${days === 1 ? "day" : "days"}`,
    };
  }
  if (unit === "day") {
    return {
      amount: price * days,
      calculation: `${formatRupees(price)} / day × ${days} ${days === 1 ? "day" : "days"}`,
    };
  }
  if (unit === "event" || unit === "package") {
    return {
      amount: price,
      calculation: `${formatRupees(price)} / ${unit} (counted once)`,
    };
  }
  if (unit === "hour") {
    return { amount: null, calculation: "Hourly rate; add service hours for an estimate" };
  }
  return { amount: null, calculation: `Unsupported pricing unit: ${rate.unit}` };
}

type ScheduledFunction = {
  id: string;
  date: string;
  name: string;
  services: string[];
};

type EventRequestPageProps = {
  api: (path: string, options?: any) => Promise<any>;
  initialProviderId?: number;
  eventId?: number;
  onBrowse: () => void;
};

const weddingStyles = [
  "Not decided yet",
  "Punjabi",
  "Marwari",
  "Rajasthani",
  "South Indian",
  "Gujarati",
  "Bengali",
  "Maharashtrian",
  "North Indian",
  "Assamese",
  "Odia",
  "Kashmiri",
  "Konkani",
  "Malayali / Kerala",
  "Tamil",
  "Telugu",
  "Kannada",
  "Sikh",
  "Muslim / Nikah",
  "Christian",
  "Jain",
  "Buddhist",
  "Tribal / regional",
  "Mixed traditions",
  "Other",
];

const functionSuggestions: Record<string, string[]> = {
  Wedding: ["Engagement / Sagai", "Mehndi", "Haldi", "Sangeet", "Baraat", "Wedding ceremony / Pheras", "Reception"],
  Birthday: ["Welcome", "Cake cutting", "Dinner", "Entertainment"],
  Engagement: ["Welcome", "Engagement / Sagai ceremony", "Ring exchange", "Family photos", "Dinner"],
  Anniversary: ["Welcome", "Celebration ceremony", "Dinner"],
  "Baby shower": ["Welcome", "Blessing ceremony", "Games and activities", "Gift opening", "Celebration meal"],
  Graduation: ["Graduation ceremony", "Photo session", "Celebration"],
  "Corporate event": ["Registration", "Opening session", "Main program", "Networking"],
  "Family celebration": ["Welcome", "Main celebration", "Dinner"],
  "Housewarming / Griha Pravesh": ["Griha Pravesh puja", "Havan", "Guest welcome", "Prasad / meal"],
  "Puja / religious ceremony": ["Guest welcome", "Puja / prayer", "Havan / aarti", "Prasad / community meal"],
  "Festival celebration": ["Venue setup", "Community gathering", "Cultural program", "Festival meal"],
  "Naming ceremony / Annaprashan": ["Welcome", "Naming / blessing ceremony", "Annaprashan", "Family photos", "Meal"],
  "Mundan / first haircut": ["Welcome", "Puja / blessings", "Mundan ceremony", "Family photos", "Meal"],
  "Thread ceremony / Upanayan": ["Welcome", "Puja / havan", "Thread ceremony", "Blessings", "Meal"],
  Retirement: ["Welcome", "Felicitations", "Speeches", "Memory sharing", "Meal"],
  Farewell: ["Welcome", "Speeches", "Cultural program", "Gifts and photos", "Meal"],
  "Community event": ["Registration", "Welcome", "Cultural program", "Community meal", "Closing"],
  "Political rally": ["Setup", "Public gathering", "Speeches", "Crowd coordination", "Closing"],
  "Campaign meeting": ["Registration", "Welcome", "Main address", "Questions and answers", "Closing"],
  "Town hall / public outreach": ["Registration", "Welcome", "Public discussion", "Questions and answers", "Closing"],
  Other: [],
};

const eventSuggestionAliases: Record<string, string> = {
  "Diwali celebration": "Festival celebration",
  "Office Diwali celebration": "Festival celebration",
  "Holi celebration": "Festival celebration",
  "Navratri / Durga Puja celebration": "Festival celebration",
  "Eid celebration": "Festival celebration",
  "Christmas celebration": "Festival celebration",
};

const commonServicesByEvent: Record<string, string[]> = {
  Wedding: [
    "Catering",
    "Photography",
    "Decoration",
    "Music & DJ",
    "Makeup",
    "Mehndi Art",
    "Florist",
    "Venue",
    "Wedding Planner",
    "Cakes & Desserts",
    "Entertainment",
    "Pandit / Priest",
    "Pandal & Tent",
    "Sound & Lighting",
    "Dhol / Baraat Band",
    "Bridal Wear & Styling",
    "Invitation Design & Printing",
    "Guest Transport",
    "Guest Accommodation",
    "Rangoli & Traditional Art",
    "Return Gifts & Favors",
  ],
  Birthday: [
    "Catering",
    "Cakes & Desserts",
    "Photography",
    "Decoration",
    "Entertainment",
    "Music & DJ",
    "Venue",
    "Pandal & Tent",
    "Sound & Lighting",
    "Party Rentals",
    "Return Gifts & Favors",
  ],
  Engagement: [
    "Catering",
    "Photography",
    "Decoration",
    "Makeup",
    "Music & DJ",
    "Venue",
    "Event Planner",
    "Pandit / Priest",
    "Pandal & Tent",
    "Invitation Design & Printing",
  ],
  Anniversary: [
    "Catering",
    "Photography",
    "Decoration",
    "Florist",
    "Music & DJ",
    "Venue",
    "Cakes & Desserts",
    "Event Planner",
  ],
  "Baby shower": [
    "Catering",
    "Photography",
    "Decoration",
    "Cakes & Desserts",
    "Venue",
    "Event Planner",
    "Return Gifts & Favors",
  ],
  Graduation: [
    "Photography",
    "Catering",
    "Venue",
    "Decoration",
    "Entertainment",
    "Sound & Lighting",
    "Event Planner",
  ],
  "Corporate event": [
    "Event Planner",
    "Venue",
    "Catering",
    "Photography",
    "Decoration",
    "Music & DJ",
    "Entertainment",
    "AV & Presentation",
    "Stage & Seating",
    "Guest Transport",
    "Security",
    "Power Backup",
  ],
  "Family celebration": [
    "Catering",
    "Photography",
    "Decoration",
    "Music & DJ",
    "Venue",
    "Cakes & Desserts",
    "Pandit / Priest",
    "Pandal & Tent",
    "Sound & Lighting",
  ],
  "Housewarming / Griha Pravesh": [
    "Pandit / Priest",
    "Puja Samagri",
    "Havan Setup",
    "Catering",
    "Photography",
    "Decoration",
    "Florist",
    "Pandal & Tent",
    "Sound & Lighting",
    "Guest Seating & Rentals",
  ],
  "Puja / religious ceremony": [
    "Pandit / Priest",
    "Puja Samagri",
    "Havan Setup",
    "Catering",
    "Photography",
    "Florist",
    "Pandal & Tent",
    "Sound & Lighting",
    "Guest Seating & Rentals",
    "Guest Transport",
  ],
  "Festival celebration": [
    "Catering",
    "Decoration",
    "Pandal & Tent",
    "Sound & Lighting",
    "Music & DJ",
    "Entertainment",
    "Security",
    "Power Backup",
    "Guest Seating & Rentals",
    "Photography",
  ],
  "Naming ceremony / Annaprashan": [
    "Catering",
    "Cakes & Desserts",
    "Photography",
    "Decoration",
    "Pandit / Priest",
    "Puja Samagri",
    "Florist",
    "Venue",
    "Return Gifts & Favors",
  ],
  "Mundan / first haircut": [
    "Pandit / Priest",
    "Puja Samagri",
    "Catering",
    "Photography",
    "Decoration",
    "Florist",
    "Venue",
    "Guest Transport",
  ],
  "Thread ceremony / Upanayan": [
    "Pandit / Priest",
    "Puja Samagri",
    "Havan Setup",
    "Catering",
    "Photography",
    "Decoration",
    "Florist",
    "Pandal & Tent",
    "Guest Seating & Rentals",
  ],
  Retirement: [
    "Event Planner",
    "Venue",
    "Catering",
    "Photography",
    "Decoration",
    "AV & Presentation",
    "Music & DJ",
    "Cakes & Desserts",
    "Gifts & Mementos",
  ],
  Farewell: [
    "Event Planner",
    "Venue",
    "Catering",
    "Photography",
    "Decoration",
    "AV & Presentation",
    "Music & DJ",
    "Entertainment",
    "Gifts & Mementos",
  ],
  "Community event": [
    "Event Planner",
    "Venue",
    "Catering",
    "Pandal & Tent",
    "Sound & Lighting",
    "Stage & Seating",
    "Entertainment",
    "Security",
    "Power Backup",
    "Guest Transport",
    "Photography",
  ],
  "Political rally": [
    "Event Planner",
    "Venue",
    "Pandal & Tent",
    "Sound & Lighting",
    "AV & Presentation",
    "Stage & Seating",
    "Security",
    "Power Backup",
    "Guest Transport",
    "Catering",
    "Photography",
    "Anchor / Emcee",
  ],
  "Campaign meeting": [
    "Event Planner",
    "Venue",
    "AV & Presentation",
    "Stage & Seating",
    "Sound & Lighting",
    "Security",
    "Catering",
    "Photography",
    "Guest Transport",
  ],
  "Town hall / public outreach": [
    "Event Planner",
    "Venue",
    "AV & Presentation",
    "Sound & Lighting",
    "Stage & Seating",
    "Guest Seating & Rentals",
    "Security",
    "Catering",
    "Photography",
  ],
  Other: [
    "Catering",
    "Photography",
    "Decoration",
    "Music & DJ",
    "Venue",
    "Event Planner",
  ],
};

for (const [eventType, suggestionType] of Object.entries(eventSuggestionAliases)) {
  functionSuggestions[eventType] = functionSuggestions[suggestionType];
  commonServicesByEvent[eventType] = commonServicesByEvent[suggestionType];
}

const serviceCategories = [
  { name: "Food & treats", matches: /cater|food|cake|dessert|beverage|bakery/i },
  { name: "Photography & video", matches: /photo|video|cinema|film/i },
  { name: "Music & entertainment", matches: /music|dj|dance|entertain|anchor|band|perform/i },
  { name: "Ceremonial & religious services", matches: /pandit|priest|puja|purohit|havan|samagri|religious/i },
  { name: "Decor & venue", matches: /decor|flor|venue|stage|lighting|pandal|tent|rangoli|traditional art|rental|seating/i },
  { name: "Beauty & styling", matches: /makeup|make.up|mehndi|henna|hair|beauty|groom/i },
  { name: "Planning & coordination", matches: /plan|coordinat|organis|organiz|manage/i },
  { name: "Guest, travel & logistics", matches: /transport|accommodation|security|power backup|invitation|printing|gift|memento/i },
  { name: "Production & equipment", matches: /sound|av &|presentation|equipment|generator|led|screen/i },
];

function localDateInputValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function scheduleId(date: string) {
  return `${date}-${Math.random().toString(36).slice(2)}`;
}

function dateRange(start: string, end: string) {
  if (!start || !end || start > end) return [];
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function EventRequestPage({
  api,
  initialProviderId,
  eventId,
  onBrowse,
}: EventRequestPageProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [eventCategory, setEventCategory] = useState<EventCategory>("Personal & family");
  const [eventType, setEventType] = useState("Wedding");
  const [customEventType, setCustomEventType] = useState("");
  const [weddingStyle, setWeddingStyle] = useState("Not decided yet");
  const [customWeddingStyle, setCustomWeddingStyle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [schedule, setSchedule] = useState<ScheduledFunction[]>([]);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [venue, setVenue] = useState("");
  const [ceremonyPreferences, setCeremonyPreferences] = useState("");
  const [details, setDetails] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<number[]>(
    initialProviderId ? [initialProviderId] : [],
  );
  const [providerSearch, setProviderSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/providers"),
      api("/customer/events"),
    ])
      .then(([providerRows, eventRows]) => {
        if (!active) return;
        setProviders(providerRows);
        setEvents(eventRows);
        if (eventId) {
          const event = eventRows.find((item: any) => item.id === eventId);
          if (!event) {
            setError("This event plan could not be found.");
            return;
          }
          setEditingEvent(event);
          setEditForm({
            event_type: event.event_type,
            city: event.city,
            state: event.state,
            event_date: event.event_date,
            guests: String(event.guests),
            budget: String(event.budget ?? 0),
            services: (event.services || []).join(", "),
            details: event.details || "",
          });
        }
        const initialProvider = providerRows.find((provider: Provider) => provider.id === initialProviderId);
        if (initialProvider) {
          setState(initialProvider.state);
          setCity(initialProvider.city);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load event request details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, eventId, initialProviderId]);

  const availableCities = state ? indiaLocations[state] || [] : [];
  const eventTypes = eventCategories[eventCategory];
  const serviceOptions = useMemo(
    () => {
      const services = providers.flatMap((provider) => [
        provider.provider_type || provider.category,
        ...(provider.offerings || []).map((offering) => offering.category),
      ]);
      const unique = new Map<string, string>();
      [...(commonServicesByEvent[eventType] || commonServicesByEvent.Other), ...services]
        .filter((service) => service && service.toLowerCase() !== "service")
        .forEach((service) => {
          const key = service.trim().toLowerCase();
          if (!unique.has(key)) unique.set(key, service.trim());
        });
      return [...unique.values()];
    },
    [eventType, providers],
  );
  const groupedServices = useMemo(() => {
    const groups = new Map<string, string[]>();
    serviceOptions.forEach((service) => {
      const category = serviceCategories.find((item) => item.matches.test(service))?.name || "Other services";
      groups.set(category, [...(groups.get(category) || []), service]);
    });
    return [...groups.entries()]
      .sort(([left], [right]) => {
        const leftIndex = serviceCategories.findIndex((item) => item.name === left);
        const rightIndex = serviceCategories.findIndex((item) => item.name === right);
        return (leftIndex < 0 ? serviceCategories.length : leftIndex)
          - (rightIndex < 0 ? serviceCategories.length : rightIndex);
      })
      .map(([name, services]) => ({ name, services }));
  }, [serviceOptions]);
  const requestedServices = useMemo(
    () => [...new Set(schedule.flatMap((item) => item.services))],
    [schedule],
  );
  const pricingEstimate = useMemo(() => {
    const services = requestedServices.map((service) => {
      const days = new Set(
        schedule
          .filter((item) => item.services.includes(service))
          .map((item) => item.date),
      ).size;
      const localProviders = providers.filter((provider) =>
        state
        && providerRatesForService(provider, service, eventType).length > 0
        && provider.state.trim().toLowerCase() === state.trim().toLowerCase()
        && city
        && provider.city.trim().toLowerCase() === city.trim().toLowerCase(),
      );
      const unitGroups = new Map<string, number[]>();
      const estimatesByUnit = new Map<string, number[]>();
      localProviders.forEach((provider) => {
        const rates = providerRatesForService(provider, service, eventType)
          .map((rate) => ({
            rate,
            estimate: estimateProviderPrice(rate, days, Number(guests || 0)),
          }))
          .sort((left, right) =>
            (left.estimate.amount ?? Number.POSITIVE_INFINITY)
            - (right.estimate.amount ?? Number.POSITIVE_INFINITY)
            || left.rate.price - right.rate.price,
          );
        const selectedRate = rates[0];
        if (selectedRate) {
          const unit = selectedRate.rate.unit.trim().toLowerCase();
          unitGroups.set(unit, [
            ...(unitGroups.get(unit) || []),
            selectedRate.rate.price,
          ]);
          if (selectedRate.estimate.amount !== null) {
            estimatesByUnit.set(unit, [
              ...(estimatesByUnit.get(unit) || []),
              selectedRate.estimate.amount,
            ]);
          }
        }
      });
      const prices = [...unitGroups.entries()].map(([unit, values]) => ({
        unit,
        average: values.reduce((total, value) => total + value, 0) / values.length,
        providerCount: values.length,
      }));
      const predominantUnit = [...estimatesByUnit.entries()]
        .slice()
        .sort((left, right) => right[1].length - left[1].length)[0]?.[0];
      const predominantEstimates = predominantUnit
        ? estimatesByUnit.get(predominantUnit) || []
        : [];
      return {
        service,
        days,
        prices,
        estimate: predominantEstimates.length
          ? predominantEstimates.reduce((total, estimate) => total + estimate, 0) / predominantEstimates.length
          : null,
        estimatedProviderCount: predominantEstimates.length,
        unestimatedProviderCount: localProviders.length - predominantEstimates.length,
      };
    });
    const estimable = services.filter((item) => item.estimate !== null);
    return {
      services,
      total: estimable.reduce((total, item) => total + (item.estimate || 0), 0),
      estimableCount: estimable.length,
      unavailableCount: services.length - estimable.length,
    };
  }, [city, eventType, guests, providers, requestedServices, schedule, state]);
  const selectedProviderEstimates = useMemo(() => selectedProviders.flatMap((providerId) => {
    const provider = providers.find((item) => item.id === providerId);
    if (!provider) return [];
    const neededServices = requestedServices.filter((service) =>
      providerRatesForService(provider, service, eventType).length > 0,
    );
    if (!neededServices.length) {
      return [{
        provider,
        service: provider.provider_type || provider.category,
        amount: null,
        calculation: "No selected event service matches this provider",
      }];
    }
    return neededServices.map((service) => {
      const days = new Set(
        schedule
          .filter((item) => item.services.includes(service))
          .map((item) => item.date),
      ).size;
      const rates = providerRatesForService(provider, service, eventType)
        .map((rate) => ({
          rate,
          estimate: estimateProviderPrice(rate, days, Number(guests || 0)),
        }))
        .sort((left, right) =>
          (left.estimate.amount ?? Number.POSITIVE_INFINITY)
          - (right.estimate.amount ?? Number.POSITIVE_INFINITY),
        );
      return {
        provider,
        service,
        ...(rates[0]?.estimate || {
          amount: null,
          calculation: "No applicable published rate",
        }),
      };
    });
  }), [
    eventType,
    guests,
    providers,
    requestedServices,
    schedule,
    selectedProviders,
  ]);
  const selectedProviderTotal = selectedProviderEstimates.reduce(
    (total, item) => total + (item.amount || 0),
    0,
  );
  const unestimatedSelectedProviderCount = selectedProviderEstimates
    .filter((item) => item.amount === null).length;
  const budgetAmount = Number(budget);
  const remainingBudget = Number.isFinite(budgetAmount) && budgetAmount > 0
    ? budgetAmount - selectedProviderTotal
    : null;
  const matchingProviders = useMemo(() => {
    const search = providerSearch.trim().toLowerCase();
    return providers.filter((provider) => {
      const type = provider.provider_type || provider.category || "";
      const offeredServices = (provider.offerings || []).map((offering) => offering.category);
      const serviceNames = [type, ...offeredServices];
      const matchesLocation = (!state || provider.state === state)
        && (!city || provider.city.toLowerCase() === city.toLowerCase());
      const matchesFilters = matchesLocation
        && (!requestedServices.length || requestedServices.some((service) => serviceNames.some(
          (serviceName) => serviceName.toLowerCase() === service.toLowerCase(),
        )))
        && (!search || `${provider.business_name} ${serviceNames.join(" ")} ${provider.city}`.toLowerCase().includes(search));
      return selectedProviders.includes(provider.id) || matchesFilters;
    });
  }, [city, providerSearch, providers, requestedServices, selectedProviders, state]);

  function updateDateRange(nextStart: string, nextEnd: string) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    const dates = dateRange(nextStart, nextEnd);
    setSchedule((current) => {
      const currentByDate = new Map<string, ScheduledFunction[]>();
      current.forEach((item) => {
        const items = currentByDate.get(item.date) || [];
        items.push(item);
        currentByDate.set(item.date, items);
      });
      return dates.flatMap((date, index) => {
        const existing = currentByDate.get(date);
        return existing?.length
          ? existing
          : [{
              id: scheduleId(date),
              date,
              name: eventType === "Other"
                ? `Function ${index + 1}`
                : `${eventType}${dates.length > 1 ? ` · Day ${index + 1}` : ""}`,
              services: [],
            }];
      });
    });
  }

  function updateFunction(id: string, updates: Partial<ScheduledFunction>) {
    setSchedule((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  function addFunction(date: string, name = "Additional function") {
    setSchedule((current) => [
      ...current,
      { id: scheduleId(date), date, name, services: [] },
    ]);
  }

  function removeFunction(id: string) {
    setSchedule((current) => current.filter((item) => item.id !== id));
  }

  function updateFunctionService(id: string, service: string, checked: boolean) {
    setSchedule((current) => current.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        services: checked
          ? [...new Set([...item.services, service])]
          : item.services.filter((value) => value !== service),
      };
    }));
  }

  function toggleProvider(providerId: number, checked: boolean) {
    setError("");
    if (checked && selectedProviders.length >= 25) {
      setError("You can send an event request to up to 25 providers at a time.");
      return;
    }
    setSelectedProviders((current) => checked
      ? current.includes(providerId) ? current : [...current, providerId]
      : current.filter((id) => id !== providerId));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (selectedProviders.length === 0) {
      setError("Select at least one provider to receive this event request.");
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setError("Choose a valid event date range.");
      return;
    }
    if (schedule.length === 0 || requestedServices.length === 0) {
      setError("Add at least one function and choose at least one service.");
      return;
    }
    if (requestedServices.length > 20) {
      setError("Choose no more than 20 different services for one event request.");
      return;
    }
    const scheduleDetails = schedule.map((item) =>
      `${formatDate(item.date)} — ${item.name}: ${item.services.length
        ? item.services.join(", ")
        : "No services selected"}`,
    ).join("\n");
    const requestDetails = [
      eventType === "Wedding" && weddingStyle !== "Not decided yet"
        ? `Wedding style / traditions: ${weddingStyle === "Other" ? customWeddingStyle.trim() : weddingStyle}`
        : "",
      ceremonyPreferences.trim()
        ? `Ceremony, rituals, or tradition requirements: ${ceremonyPreferences.trim()}`
        : "",
      `Event schedule:\n${scheduleDetails}`,
      venue.trim() ? `Venue / location details: ${venue.trim()}` : "",
      details.trim() ? `Additional event details: ${details.trim()}` : "",
    ].filter(Boolean).join("\n\n");
    if (requestDetails.length > 4000) {
      setError("The schedule and notes are too long to send. Shorten the notes or event range.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api("/customer/events", {
        method: "POST",
        body: JSON.stringify({
          event_type: eventType === "Other" ? customEventType.trim() : eventType,
          city,
          state,
          event_date: startDate,
          guests: Number(guests),
          budget: Number(budget || 0),
          provider_ids: selectedProviders,
          services: requestedServices,
          venue: "",
          details: requestDetails,
        }),
      });
      setSuccess(result.message || "Your event request was sent to the selected providers.");
      setSelectedProviders([]);
      setSchedule([]);
      setStartDate("");
      setEndDate("");
      setEvents(await api("/customer/events"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your event request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEventChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eventId || !editForm) return;
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api(`/customer/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editForm,
          guests: Number(editForm.guests),
          budget: Number(editForm.budget || 0),
          services: editForm.services
            .split(",")
            .map((service: string) => service.trim())
            .filter(Boolean),
        }),
      });
      setEvents(await api("/customer/events"));
      setSuccess("Your event plan was updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your event plan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (eventId) {
    return (
      <Box component="main" className="event-planning-page">
        <Box className="event-planning-hero">
          <Stack spacing={1} className="event-planning-hero-copy">
            <Typography variant="overline" className="event-planning-eyebrow">YOUR EVENT PLAN</Typography>
            <Typography variant="h3">Edit event plan</Typography>
            <Typography>Update the event details and services sent to your selected providers.</Typography>
          </Stack>
        </Box>
        {error && <Alert severity="error" className="event-planning-alert">{error}</Alert>}
        {success && <Alert severity="success" className="event-planning-alert">{success}</Alert>}
        {loading || !editForm ? (
          <Typography>{error || "Loading your event plan..."}</Typography>
        ) : (
          <Paper component="form" onSubmit={saveEventChanges} elevation={0} className="event-planning-form">
            <Stack spacing={2}>
              <TextField
                label="Event type"
                required
                value={editForm.event_type}
                onChange={(event) => setEditForm({ ...editForm, event_type: event.target.value })}
              />
              <TextField
                label="State"
                required
                value={editForm.state}
                onChange={(event) => setEditForm({ ...editForm, state: event.target.value })}
              />
              <TextField
                label="City"
                required
                value={editForm.city}
                onChange={(event) => setEditForm({ ...editForm, city: event.target.value })}
              />
              <TextField
                label="Event date"
                type="date"
                required
                value={editForm.event_date}
                onChange={(event) => setEditForm({ ...editForm, event_date: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Number of guests"
                type="number"
                required
                inputProps={{ min: 1, max: 100000 }}
                value={editForm.guests}
                onChange={(event) => setEditForm({ ...editForm, guests: event.target.value })}
              />
              <TextField
                label="Budget (₹)"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={editForm.budget}
                onChange={(event) => setEditForm({ ...editForm, budget: event.target.value })}
              />
              <TextField
                label="Requested services"
                value={editForm.services}
                onChange={(event) => setEditForm({ ...editForm, services: event.target.value })}
                helperText="Separate services with commas."
              />
              <TextField
                label="Event schedule, venue, and additional details"
                multiline
                minRows={5}
                maxRows={12}
                inputProps={{ maxLength: 4000 }}
                value={editForm.details}
                onChange={(event) => setEditForm({ ...editForm, details: event.target.value })}
              />
              <Box>
                <Typography variant="subtitle2">Providers already receiving this plan</Typography>
                {editingEvent?.providers?.length ? editingEvent.providers.map((provider: any) => (
                  <Typography key={provider.provider_id} variant="body2">
                    {provider.business_name} · {provider.quote ? `Quote ${provider.quote.status}` : provider.status}
                  </Typography>
                )) : <Typography variant="body2">No provider requests are linked to this plan.</Typography>}
                <Typography variant="caption" color="text.secondary">
                  Editing keeps the current provider recipients and their quote responses.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? "Saving..." : "Save event plan"}
                </Button>
                <Button type="button" onClick={onBrowse}>Back to my planner</Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <Box component="main" className="event-planning-page">
      <Box className="event-planning-hero">
        <Stack spacing={1} className="event-planning-hero-copy">
          <Typography variant="overline" className="event-planning-eyebrow">LET'S CELEBRATE SOMETHING SPECIAL</Typography>
          <Typography variant="h3">Build your event plan</Typography>
          <Typography>
            Add your event dates, create a function for each day, and choose the services you need. We’ll send the plan to the providers you select.
          </Typography>
          <Typography variant="body2">
            Requests appear in each provider&apos;s Enquiries dashboard; email notifications are not enabled yet.
          </Typography>
        </Stack>
        <div className="event-planning-decoration" aria-hidden="true">
          <span className="event-planning-ring" />
          <span className="event-planning-flower">✿</span>
          <span className="event-planning-sparkle">✦</span>
          <span className="event-planning-decoration-label">YOUR DAY, YOUR WAY</span>
        </div>
      </Box>

      {error && <Alert severity="error" className="event-planning-alert">{error}</Alert>}
      {success && <Alert severity="success" className="event-planning-alert">{success}</Alert>}

      <Paper component="form" onSubmit={submit} elevation={0} className="event-planning-form">
        <Stack spacing={2.5}>
          <Box className="event-form-section event-details-section">
            <Typography className="event-form-step">01 <span>EVENT BASICS</span></Typography>
            <Typography variant="h6" className="event-form-section-title">Start with the essentials</Typography>
            <Box className="event-details-grid">
            <TextField
              select
              label="Event category"
              required
              value={eventCategory}
              onChange={(event) => {
                const nextCategory = event.target.value as EventCategory;
                setEventCategory(nextCategory);
                setEventType(eventCategories[nextCategory][0]);
                setCustomEventType("");
              }}
              helperText="Choose the broad event group first to narrow the list."
            >
              {eventCategoryNames.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Event type"
              required
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            >
              {eventTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
            {eventType === "Other" && <TextField label="Describe your event" required value={customEventType} onChange={(event) => setCustomEventType(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />}
            {eventType === "Wedding" && (
              <>
                <TextField
                  select
                  label="Wedding style / traditions"
                  value={weddingStyle}
                  onChange={(event) => setWeddingStyle(event.target.value)}
                  helperText="Helps providers tailor food, music, decor, and ceremonies."
                >
                  {weddingStyles.map((style) => <MenuItem key={style} value={style}>{style}</MenuItem>)}
                </TextField>
                {weddingStyle === "Other" && (
                  <TextField
                    label="Describe your wedding traditions"
                    required
                    value={customWeddingStyle}
                    onChange={(event) => setCustomWeddingStyle(event.target.value)}
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                )}
              </>
            )}
            <TextField label="From" type="date" required value={startDate} onChange={(event) => updateDateRange(event.target.value, endDate || event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: localDateInputValue(), max: endDate || undefined } }} />
            <TextField label="To" type="date" required value={endDate} onChange={(event) => updateDateRange(startDate || event.target.value, event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: startDate || localDateInputValue() } }} />
            <TextField select label="State / Union Territory" required value={state} onChange={(event) => { setState(event.target.value); setCity(""); }}>
              {indianStates.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField select label="City" required disabled={!state} value={city} onChange={(event) => setCity(event.target.value)}>
              {availableCities.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField label="Number of guests" type="number" required value={guests} onChange={(event) => setGuests(event.target.value)} slotProps={{ htmlInput: { min: 1, max: 100000 } }} />
            <TextField label="Target event budget (₹)" type="number" helperText="Optional. Providers you select will see this target and can suggest a suitable quote." value={budget} onChange={(event) => setBudget(event.target.value)} slotProps={{ htmlInput: { min: 0, step: 500 } }} />
            <TextField label="Venue or area (optional)" value={venue} onChange={(event) => setVenue(event.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} />
            </Box>
          </Box>

          <Box className="event-form-section">
            <Typography className="event-form-step">02 <span>YOUR SCHEDULE</span></Typography>
            <Typography variant="h6" className="event-form-section-title">Build each day of your event</Typography>
            <Typography variant="body2" color="text.secondary">
              Your date range creates a day for each date. Add suggested functions for your event, then choose services under each category. Common service suggestions are tailored to the event type; provider availability depends on your city. Add a custom function when needed.
            </Typography>
            {!startDate || !endDate || startDate > endDate ? (
              <Alert severity="info" sx={{ mt: 2 }}>Choose your event dates above to build the day-by-day plan.</Alert>
            ) : (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {dateRange(startDate, endDate).map((date) => {
                  const functions = schedule.filter((item) => item.date === date);
                  return (
                    <Paper key={date} elevation={0} className="event-day-card">
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                        <Box>
                          <Typography className="event-day-date">{formatDate(date)}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {functions.length} {functions.length === 1 ? "function" : "functions"}
                          </Typography>
                        </Box>
                        <Button type="button" size="small" onClick={() => addFunction(date)}>
                          + Add a function
                        </Button>
                      </Stack>
                      {(functionSuggestions[eventType] || []).length > 0 && (
                        <Box className="event-function-suggestions" aria-label="Suggested functions">
                          <Typography variant="caption">Suggested for {eventType}:</Typography>
                          {(functionSuggestions[eventType] || []).map((suggestion) => (
                            <Button
                              key={suggestion}
                              type="button"
                              size="small"
                              disabled={functions.some((item) => item.name.toLowerCase() === suggestion.toLowerCase())}
                              onClick={() => addFunction(date, suggestion)}
                            >
                              + {suggestion}
                            </Button>
                          ))}
                        </Box>
                      )}
                      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                        {functions.map((item, index) => (
                          <Box className="event-function-card" key={item.id}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                label={`Function ${index + 1}`}
                                value={item.name}
                                onChange={(event) => updateFunction(item.id, { name: event.target.value })}
                                required
                                size="small"
                                sx={{ flex: 1 }}
                                slotProps={{ htmlInput: { maxLength: 100 } }}
                              />
                              <IconButton
                                type="button"
                                aria-label={`Remove ${item.name || "function"}`}
                                disabled={functions.length === 1}
                                onClick={() => removeFunction(item.id)}
                                size="small"
                              >
                                ×
                              </IconButton>
                            </Stack>
                            {loading ? <Typography sx={{ mt: 1 }}>Loading services...</Typography> : (
                              <Box
                                className="event-service-tree"
                                role="group"
                                aria-label={`${item.name} services`}
                              >
                                <Typography className="event-tree-parent-label">
                                  Services for this function
                                </Typography>
                                {groupedServices.map(({ name, services: categoryServices }) => {
                                  const selectedCount = categoryServices.filter((service) =>
                                    item.services.includes(service),
                                  ).length;
                                  return (
                                    <Box className="event-service-branch" key={name}>
                                      <label className="event-service-category">
                                        <Checkbox
                                          size="small"
                                          checked={selectedCount === categoryServices.length}
                                          indeterminate={selectedCount > 0 && selectedCount < categoryServices.length}
                                          onChange={(event) => categoryServices.forEach((service) =>
                                            updateFunctionService(item.id, service, event.target.checked),
                                          )}
                                        />
                                        <span>{name}</span>
                                        <small>{selectedCount}/{categoryServices.length}</small>
                                      </label>
                                      <Box className="event-function-services">
                                        {categoryServices.map((service) => (
                                          <label className="event-function-service" key={service}>
                                            <Checkbox
                                              size="small"
                                              checked={item.services.includes(service)}
                                              onChange={(event) => updateFunctionService(item.id, service, event.target.checked)}
                                            />
                                            <span>{service}</span>
                                          </label>
                                        ))}
                                      </Box>
                                    </Box>
                                  );
                                })}
                                {groupedServices.length === 0 && (
                                  <Typography color="text.secondary">
                                    No provider services are available yet.
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box className="event-form-section event-notes-section">
          <Typography className="event-form-step">03 <span>PERSONAL TOUCHES</span></Typography>
          <TextField
            label="Ceremony, rituals, or traditions (optional)"
            multiline
            minRows={2}
            value={ceremonyPreferences}
            onChange={(event) => setCeremonyPreferences(event.target.value)}
            helperText="Describe any event-specific requirements providers should know. You do not need to share your religion."
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
          <TextField
            label="Notes for providers (optional)"
            multiline
            minRows={3}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            helperText="Share your theme, preferences, timings, or anything else providers should know."
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          </Box>

          <Box className="event-estimate-card">
            <Box>
              <Typography className="event-form-step">04 <span>EARLY ESTIMATE</span></Typography>
              <Typography variant="h6" className="event-form-section-title">Your city-based service budget</Typography>
              <Typography variant="body2" color="text.secondary">
                City averages are a planning benchmark. Selected providers use their own starting prices, and those estimates are deducted from your budget below.
              </Typography>
            </Box>
            {requestedServices.length === 0 ? (
              <Typography className="event-estimate-unavailable">
                Choose services in your event schedule to see a budget estimate.
              </Typography>
            ) : !city ? (
              <Typography className="event-estimate-unavailable">
                Choose your city to calculate estimates from local provider prices.
              </Typography>
            ) : (
              <Box className="event-estimate-details">
                <Box className="event-estimate-lines">
                  {pricingEstimate.services.map((item) => (
                    <Box className="event-estimate-line" key={item.service}>
                      <Box>
                        <Typography className="event-estimate-service">{item.service}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Needed on {item.days} {item.days === 1 ? "day" : "days"}
                        </Typography>
                      </Box>
                      {item.prices.length === 0 ? (
                        <Typography className="event-estimate-missing">
                          No local price data
                        </Typography>
                      ) : (
                        <Box className="event-estimate-price">
                          <Typography>
                            {item.estimate === null
                              ? "Estimate unavailable"
                              : `${formatRupees(item.estimate)} avg. estimate`}
                          </Typography>
                          <small>
                            {item.prices.map((price) =>
                              `₹${Math.round(price.average).toLocaleString("en-IN")} / ${price.unit} · ${price.providerCount} ${price.providerCount === 1 ? "provider" : "providers"}`,
                            ).join("  |  ")}
                            {item.estimatedProviderCount > 0
                              ? ` · Based on ${item.estimatedProviderCount} priced ${item.estimatedProviderCount === 1 ? "provider" : "providers"}`
                              : ""}
                            {item.unestimatedProviderCount > 0
                              ? ` · ${item.unestimatedProviderCount} hourly or unsupported rate${item.unestimatedProviderCount === 1 ? "" : "s"} excluded`
                              : ""}
                          </small>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
                <Box className="event-estimate-total">
                  <Box>
                    <Typography variant="overline">Indicative total</Typography>
                    <Typography variant="h5">
                      {pricingEstimate.estimableCount > 0
                        ? formatRupees(pricingEstimate.total)
                        : "Not available"}
                    </Typography>
                  </Box>
                  <Typography variant="caption">
                    {pricingEstimate.unavailableCount > 0
                      ? `${pricingEstimate.unavailableCount} service${pricingEstimate.unavailableCount === 1 ? "" : "s"} could not be estimated due to missing local prices or unsupported units. `
                      : ""}
                    Based on synthetic or provider-listed starting prices in {city}; these are not verified market rates. Per-plate/person rates use guests × service days; day rates use service days; event/package rates count once. Providers confirm final quotes.
                  </Typography>
                </Box>
              </Box>
            )}
            <Box className="event-selected-budget">
              <Box>
                <Typography variant="overline">SELECTED PROVIDERS</Typography>
                <Typography variant="h6">{formatRupees(selectedProviderTotal)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Estimated using each selected provider's starting price. Multiple selected providers are all counted.
                </Typography>
              </Box>
              <Box className={`event-budget-remaining${remainingBudget !== null && remainingBudget < 0 ? " over-budget" : ""}`}>
                <Typography variant="overline">
                  {remainingBudget !== null && remainingBudget < 0 ? "OVER BUDGET BY" : "REMAINING BUDGET"}
                </Typography>
                <Typography variant="h5">
                  {remainingBudget === null
                    ? "Add a budget"
                    : formatRupees(Math.abs(remainingBudget))}
                </Typography>
                {remainingBudget !== null && (
                  <Typography variant="caption">
                    {formatRupees(budgetAmount)} budget − {formatRupees(selectedProviderTotal)} selected estimates
                  </Typography>
                )}
              </Box>
              {unestimatedSelectedProviderCount > 0 && (
                <Alert severity="info" className="event-budget-note">
                  {unestimatedSelectedProviderCount} selected provider{unestimatedSelectedProviderCount === 1 ? "" : "s"} {unestimatedSelectedProviderCount === 1 ? "is" : "are"} not included yet because a service date, guest count, or supported pricing unit is missing.
                </Alert>
              )}
              {selectedProviderEstimates.length > 0 && (
                <Box className="event-selected-budget-lines">
                  {selectedProviderEstimates.map((item) => (
                    <Box className="event-selected-budget-line" key={`${item.provider.id}-${item.service}`}>
                      <Typography variant="body2">{item.provider.business_name} · {item.service}</Typography>
                      <Typography variant="body2">
                        {item.amount === null ? "Not included" : formatRupees(item.amount)}
                        <small>{item.calculation}</small>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          <Box className="event-form-section event-provider-section">
            <Stack spacing={1} className="event-provider-heading">
              <Box>
                <Typography className="event-form-step">05 <span>YOUR EVENT TEAM</span></Typography>
                <Typography variant="h6" className="event-form-section-title">Choose providers</Typography>
                <Typography variant="body2" color="text.secondary">Select one or more providers to receive this event plan, including its dates, functions, chosen services, and any notes for providers. Choose a state and city above to narrow the list.</Typography>
              </Box>
            </Stack>
            <Chip className="event-selected-count" label={`${selectedProviders.length} selected`} color={selectedProviders.length ? "primary" : "default"} />
            <TextField fullWidth label="Search providers" value={providerSearch} onChange={(event) => setProviderSearch(event.target.value)} sx={{ mb: 1.5 }} />
            {loading ? <Typography>Loading providers...</Typography> : matchingProviders.length === 0 ? (
              <Alert severity="info">No providers match these filters. Try another city or service type.</Alert>
            ) : (
              <Box className="event-provider-grid">
                {matchingProviders.map((provider) => {
                  const selectedEstimate = selectedProviderEstimates.find(
                    (item) => item.provider.id === provider.id,
                  );
                  return (
                  <Paper
                    key={provider.id}
                    component="label"
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      cursor: "pointer",
                      borderColor: selectedProviders.includes(provider.id) ? "#9b315a" : "#f0dfd5",
                      backgroundColor: selectedProviders.includes(provider.id) ? "#fff0f3" : "#fffdf9",
                      transition: "border-color .2s ease, background-color .2s ease, transform .2s ease",
                      "&:hover": { borderColor: "#c78935", backgroundColor: "#fff8ef", transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <Checkbox
                        checked={selectedProviders.includes(provider.id)}
                        onChange={(event) => toggleProvider(provider.id, event.target.checked)}
                        sx={{ mt: -0.5, ml: -0.5 }}
                      />
                      <Box sx={{ pt: 0.75 }}>
                        <Typography variant="subtitle2" className="event-provider-name">{provider.business_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{provider.provider_type || provider.category} · {provider.city}, {provider.state}</Typography>
                        {[...new Set((provider.offerings || [])
                          .map((offering) => offering.category)
                          .filter((category) => category && category.toLowerCase() !== (provider.provider_type || provider.category).toLowerCase()))]
                          .map((category) => (
                            <Typography key={category} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Also offers: {category}
                            </Typography>
                          ))}
                        <Typography variant="body2" className="event-provider-price">
                          {Number(provider.starting_price) > 0
                            ? `From ${formatRupees(Number(provider.starting_price))} / ${provider.price_unit}`
                            : "Contact for price"}
                        </Typography>
                        {selectedProviders.includes(provider.id) && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            {selectedEstimate?.amount === null || !selectedEstimate
                              ? selectedEstimate?.calculation || "Not included in estimate"
                              : `Estimated addition: ${formatRupees(selectedEstimate.amount)}`}
                          </Typography>
                        )}
                        {selectedProviders.includes(provider.id) && <Chip size="small" label="Selected" color="primary" sx={{ mt: 0.75 }} />}
                        {selectedProviders.includes(provider.id) && state && (provider.state !== state || (city && provider.city.toLowerCase() !== city.toLowerCase())) && (
                          <Typography
                            variant="caption"
                            color="warning.main"
                            sx={{ display: "block" }}
                          >
                            Outside the selected event location
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                  );
                })}
              </Box>
            )}
          </Box>

          <Stack spacing={1} className="event-planning-actions">
            <Button type="submit" variant="contained" disabled={submitting || loading} className="event-submit-button">
              {submitting ? "Sending event request..." : `Send to ${selectedProviders.length || "selected"} provider${selectedProviders.length === 1 ? "" : "s"}`}
            </Button>
            <Button type="button" onClick={onBrowse} sx={{ borderRadius: 2, textTransform: "none" }}>Browse providers</Button>
          </Stack>
        </Stack>
      </Paper>

      <Box className="event-sent-requests">
        <div className="event-sent-requests-heading">
          <Typography variant="h5">Your sent event requests</Typography>
          <span>{events.length} {events.length === 1 ? "request" : "requests"}</span>
        </div>
        {events.length === 0 ? <div className="event-requests-empty"><span aria-hidden="true">✦</span><Typography color="text.secondary">Your submitted event requests will appear here.</Typography></div> : (
          <Stack spacing={1.5}>
            {events.map((item) => (
              <Paper key={item.id} elevation={0} className="event-sent-request-card">
                <Typography variant="h6">{item.event_type} · {item.city}{item.state ? `, ${item.state}` : ""}</Typography>
                <Typography color="text.secondary">{item.event_date} · {item.guests} guests · Target budget {item.budget ? `₹${Number(item.budget).toLocaleString("en-IN")}` : "Not provided"}</Typography>
                {item.services?.length > 0 && <Typography sx={{ mt: 1 }}>Services: {item.services.join(", ")}</Typography>}
                {item.details && <Typography sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{item.details}</Typography>}
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {item.providers.map((provider: any) => (
                    <Box key={provider.provider_id} className="event-provider-quote-response">
                      <Typography variant="body2">
                        <strong>{provider.business_name}:</strong> {provider.quote
                          ? `Total ₹${Number(provider.quote.amount).toLocaleString("en-IN")} (${provider.quote.status})`
                          : provider.status}
                      </Typography>
                      {provider.quote?.service_items?.length > 0 && (
                        <ul>
                          {provider.quote.service_items.map((quoteItem: any, index: number) => (
                            <li key={`${quoteItem.service}-${index}`}>
                              <span>{quoteItem.service}</span>
                              <span>₹{Number(quoteItem.amount).toLocaleString("en-IN")}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {provider.quote?.notes && <Typography variant="body2">{provider.quote.notes}</Typography>}
                      {provider.request_id && (
                        <QuoteConversation
                          requestId={provider.request_id}
                          viewerRole="CUSTOMER"
                          onUpdated={() => {
                            api("/customer/events").then(setEvents).catch((cause: any) =>
                              setError(cause.message || "Unable to refresh your event quote."),
                            );
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
