import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dumbbell, Droplet, Shield, Zap, Flame, Plus, X, ChevronLeft, ChevronRight,
  Search, Trash2, Pencil, Check, ShoppingCart, BookOpen, CalendarDays,
  ChevronDown, ChevronUp, Utensils, ArrowLeft, ListPlus,
} from "lucide-react";

/* ---------------------------------- data ---------------------------------- */

const MEAL_TYPES = ["Breakfast", "Lunch", "Snack", "Dinner"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TAGS = [
  { key: "protein", label: "Protein", Icon: Dumbbell, color: "#B85C3E" },
  { key: "healthyFats", label: "Healthy fats", Icon: Droplet, color: "#C99A3E" },
  { key: "liver", label: "Liver support", Icon: Shield, color: "#838966" },
  { key: "thyroid", label: "Thyroid support", Icon: Zap, color: "#96677A" },
  { key: "metabolic", label: "Metabolic", Icon: Flame, color: "#5E7A6C" },
];
const TAG_MAP = Object.fromEntries(TAGS.map((t) => [t.key, t]));

// Lightweight keyword assist — not nutrition data, just common ingredient
// words that often accompany each category. Meant to save a few taps, not
// to make a factual claim about any specific dish.
const TAG_KEYWORDS = {
  protein: [
    "chicken", "turkey", "beef", "steak", "pork", "salmon", "tuna", "fish",
    "shrimp", "prawn", "egg", "eggs", "yogurt", "yoghurt", "cottage cheese",
    "tofu", "tempeh", "lentil", "beans", "chickpea", "quinoa", "protein",
    "whey", "edamame", "bison", "lamb", "sardine", "cod", "turkey bacon",
  ],
  healthyFats: [
    "avocado", "olive oil", "walnut", "almond", "nuts", "nut butter",
    "peanut butter", "chia", "flax", "seeds", "coconut", "ghee", "salmon",
    "mackerel", "sardine", "tahini", "dark chocolate", "cheese",
  ],
  liver: [
    "beet", "garlic", "turmeric", "spinach", "kale", "leafy greens",
    "broccoli", "cabbage", "brussels sprout", "cruciferous", "artichoke",
    "lemon", "grapefruit", "green tea", "dandelion", "asparagus",
  ],
  thyroid: [
    "seaweed", "kelp", "nori", "brazil nut", "selenium", "iodine", "fish",
    "shellfish", "egg", "dairy", "yogurt", "zinc", "pumpkin seed",
    "sunflower seed",
  ],
  metabolic: [
    "chili", "chilli", "cayenne", "pepper", "green tea", "ginger",
    "cinnamon", "apple cider vinegar", "vinegar", "fiber", "whole grain",
    "oats", "berries", "leafy greens", "matcha",
  ],
};

function suggestTagsFromText(text) {
  const lower = (text || "").toLowerCase();
  const hits = [];
  TAGS.forEach(({ key }) => {
    if (TAG_KEYWORDS[key].some((kw) => lower.includes(kw))) hits.push(key);
  });
  return hits;
}

const SAMPLE_MEALS = [
  {
    id: "sample_1",
    title: "Greek Yogurt Bowl",
    description: "Full-fat Greek yogurt, berries, walnuts, a drizzle of honey.",
    mealType: "Breakfast",
    tags: ["protein", "healthyFats", "metabolic"],
  },
  {
    id: "sample_2",
    title: "Salmon & Greens",
    description: "Pan-seared salmon over sautéed greens with lemon and olive oil.",
    mealType: "Dinner",
    tags: ["protein", "healthyFats", "liver", "thyroid"],
  },
  {
    id: "sample_3",
    title: "Walnuts & Sea Salt",
    description: "A small handful of raw walnuts with a pinch of sea salt.",
    mealType: "Snack",
    tags: ["healthyFats", "metabolic"],
  },
];

/* --------------------------------- utils ---------------------------------- */

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function mondayOf(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function weekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const start = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = sunday.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
  return `${start} – ${end}, ${sunday.getFullYear()}`;
}

async function storageGet(key) {
  try {
    const r = await window.storage.get(key, false);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function storageSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("storage set failed", key, e);
  }
}

/* ------------------------------- small bits -------------------------------- */

function TagBadge({ tagKey, size = 18, iconSize = 11 }) {
  const tag = TAG_MAP[tagKey];
  if (!tag) return null;
  const { Icon, color, label } = tag;
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, background: `${color}22` }}
    >
      <Icon size={iconSize} color={color} strokeWidth={1.75} />
    </span>
  );
}

function TagChipToggle({ tagKey, active, auto, onClick }) {
  const tag = TAG_MAP[tagKey];
  const { Icon, color, label } = tag;
  return (
    <button
      type="button"
      onClick={onClick}
      title={auto && active ? `${label} — guessed from your text` : label}
      className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
      style={{
        background: active ? color : "#FCF8F0",
        border: `1.5px solid ${active ? color : "#D9CBAE"}`,
      }}
    >
      <Icon size={13} color={active ? "#FCF8F0" : color} strokeWidth={1.75} />
      <span
        className="text-sm"
        style={{ color: active ? "#FCF8F0" : "#3E362C", fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
      >
        {label}
      </span>
      {auto && active && (
        <span
          className="absolute rounded-full"
          style={{ top: -2, right: -2, width: 8, height: 8, background: "#F8F2E8", border: "1.5px solid #B85C3E" }}
        />
      )}
    </button>
  );
}

function PillButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap shrink-0 transition-colors"
      style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 500,
        background: active ? "#838966" : "transparent",
        color: active ? "#F8F2E8" : "#838966",
        border: "1.5px solid #838966",
      }}
    >
      {children}
    </button>
  );
}

/* ----------------------------- café vector art ------------------------------ */
/* Thin line-art motifs — kept spare and quiet: a couple of small accents plus
   very faint oversized watermarks, never more than one per screen. */

function CafeCup({ size = 22, color = "#B85C3E", strokeWidth = 1.6, style }) {
  return (
    <svg width={size} height={size * (28 / 34)} viewBox="0 0 34 28" fill="none" style={style}>
      <path d="M5 9h16l-1.1 10.2A4.5 4.5 0 0 1 15.4 23h-4.8a4.5 4.5 0 0 1-4.5-3.8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 11.5c2.8-.2 4.6 1.2 4.6 3.3s-1.8 3.6-4.9 3.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="13" cy="24.5" rx="10.5" ry="2.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M9 6.5c-1-1.4.4-2 .2-3.4C9 1.7 8.3 1.4 8.6 0" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinecap="round" />
      <path d="M13.5 6.5c-1-1.4.4-2 .2-3.4-.2-1.4-.9-1.7-.6-3.1" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinecap="round" />
    </svg>
  );
}

function Croissant({ size = 22, color = "#B85C3E", strokeWidth = 1.6, style }) {
  return (
    <svg width={size} height={size * (24 / 34)} viewBox="0 0 34 24" fill="none" style={style}>
      <path
        d="M3 17C4 8 12 2 21 2c4 0 8 1.6 10 4-3 .6-6.6 2.6-7.6 6.4-1 4 1.6 6.8 6 7.4-6 5-17.6 5.6-26.4-2.8Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M10 13.5 13.5 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M14 9 17.5 12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M19 6 22.5 9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

function Baguette({ size = 22, color = "#B85C3E", strokeWidth = 1.6, style }) {
  return (
    <svg width={size} height={size * (18 / 46)} viewBox="0 0 46 18" fill="none" style={style}>
      <path
        d="M4 13.5C2 8 6 2.5 13 2.5h20c5.5 0 9 3.6 9 7.5s-3.5 7.5-9 7.5H13C7.5 17.5 3 16.6 4 13.5Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M13 6.5 16.5 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M20 5.5 23.5 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M27 5.5 30.5 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M34 6.5 37 11.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

function Watermark({ children, position = "top-right", opacity = 0.07 }) {
  const pos =
    position === "top-right" ? { top: -20, right: -20 } :
    position === "bottom-right" ? { bottom: -20, right: -30 } :
    { bottom: -20, left: -30 };
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{ ...pos, opacity, transform: position === "top-right" ? "rotate(6deg)" : "rotate(-4deg)" }}
    >
      {children}
    </div>
  );
}

/* --------------------------------- header ---------------------------------- */

function Header({ view, setView }) {
  const NAV = [
    { key: "week", label: "This week", Icon: CalendarDays },
    { key: "meals", label: "Saved meals", Icon: BookOpen },
    { key: "grocery", label: "Grocery", Icon: ShoppingCart },
  ];
  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3"
      style={{ background: "#F8F2E8", borderBottom: "1px solid #E6DAC5" }}
    >
      <div className="flex items-center gap-2">
        <CafeCup size={19} color="#B85C3E" strokeWidth={1.6} />
        <span
          style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 21, color: "#3E362C" }}
        >
          Bon Appétit
        </span>
      </div>
      <div className="flex items-center gap-1">
        {NAV.map(({ key, label, Icon }) => {
          const active = view === key;
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5 transition-colors"
              style={{
                background: active ? "#EFE6D4" : "transparent",
                color: active ? "#B85C3E" : "#8C8370",
              }}
            >
              <Icon size={15} strokeWidth={1.6} />
              <span
                className="hidden sm:inline text-sm"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- week grid --------------------------------- */

function MealCell({ meal, onClick, isToday }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-full text-left rounded-lg p-2.5 flex flex-col justify-between transition-transform active:scale-95"
      style={{
        minHeight: 76,
        background: meal ? "#FCF8F0" : "transparent",
        border: meal ? "1px solid #E6DAC5" : `1px dashed ${isToday ? "#C7A98F" : "#D9CBAE"}`,
      }}
    >
      {meal ? (
        <>
          <span
            className="text-sm leading-snug"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 600,
              color: "#3E362C",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {meal.title}
          </span>
          {meal.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {meal.tags.map((t) => (
                <TagBadge key={t} tagKey={t} size={16} iconSize={9} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full opacity-30">
          <Plus size={16} color="#838966" />
        </div>
      )}
    </button>
  );
}

function WeekGrid({ weekStart, setWeekStart, weekSlots, meals, openSlot }) {
  const today = new Date();
  const days = DAY_SHORT.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const isCurrentWeek = toKey(mondayOf(today)) === toKey(weekStart);

  return (
    <div className="relative overflow-hidden px-3 sm:px-6 py-4">
      <Watermark position="top-right" opacity={0.06}>
        <CafeCup size={230} color="#838966" strokeWidth={1} />
      </Watermark>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })}
            className="p-1.5 rounded-full hover:bg-black/5"
          >
            <ChevronLeft size={18} color="#3E362C" />
          </button>
          <button
            onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })}
            className="p-1.5 rounded-full hover:bg-black/5"
          >
            <ChevronRight size={18} color="#3E362C" />
          </button>
          <span
            className="ml-1 text-base"
            style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, color: "#3E362C" }}
          >
            {weekLabel(weekStart)}
          </span>
        </div>
        {!isCurrentWeek && (
          <button
            onClick={() => setWeekStart(mondayOf(new Date()))}
            className="text-sm rounded-full px-3 py-1"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, background: "#838966", color: "#F8F2E8" }}
          >
            Today
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "grid", gridTemplateColumns: "76px repeat(7, minmax(118px, 1fr))", minWidth: 720, gap: 6 }}>
          <div />
          {days.map((d, i) => {
            const todayCol = isSameDay(d, today);
            return (
              <div key={i} className="text-center pb-1">
                <div
                  className="text-xs"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: todayCol ? "#B85C3E" : "#8C8370" }}
                >
                  {DAY_SHORT[i].toUpperCase()}
                </div>
                <div
                  className="text-sm"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: todayCol ? 700 : 500, color: todayCol ? "#B85C3E" : "#3E362C" }}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}

          {MEAL_TYPES.map((mealType) => (
            <React.Fragment key={mealType}>
              <div className="flex items-center pr-1">
                <span
                  className="text-xs leading-tight"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#8C8370" }}
                >
                  {mealType}
                </span>
              </div>
              {days.map((d, dayIdx) => {
                const slotKey = `${dayIdx}_${mealType}`;
                const mealId = weekSlots[slotKey];
                const meal = mealId ? meals.find((m) => m.id === mealId) : null;
                return (
                  <MealCell
                    key={slotKey}
                    meal={meal}
                    isToday={isSameDay(d, today)}
                    onClick={() => openSlot(dayIdx, mealType)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- slot modal --------------------------------- */

function SlotModal({ slot, weekStart, weekSlots, meals, onAssign, onRemove, onClose, onCreateNew, onQuickAdd }) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const listRef = useRef(null);
  const quickInputRef = useRef(null);
  const dayIdx = slot.dayIdx;
  const mealType = slot.mealType;
  const slotKey = `${dayIdx}_${mealType}`;
  const currentMealId = weekSlots[slotKey];
  const currentMeal = currentMealId ? meals.find((m) => m.id === currentMealId) : null;

  const dayDate = new Date(weekStart);
  dayDate.setDate(dayDate.getDate() + dayIdx);

  const filtered = meals
    .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.mealType === mealType ? -1 : 0) - (b.mealType === mealType ? -1 : 0));

  const searchMatches = search.trim()
    ? meals.filter((m) => m.title.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : [];

  const showPicker = !currentMeal || changing;

  function submitQuickAdd() {
    const title = quickTitle.trim();
    if (!title) return;
    onQuickAdd(title, mealType, slotKey);
    setQuickTitle("");
  }

  function jumpToQuickAdd() {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    quickInputRef.current?.focus();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(42,39,33,0.4)" }} onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md flex flex-col"
        style={{ background: "#F8F2E8", borderRadius: "36px 36px 0 0", maxHeight: "85vh" }}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <div>
            <div className="text-xs" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: "#8C8370", letterSpacing: "0.02em" }}>
              {DAY_LONG[dayIdx]} {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 21, color: "#3E362C" }}>
              {mealType}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
            <X size={20} color="#3E362C" />
          </button>
        </div>

        {!showPicker && currentMeal && (
          <div className="px-5 pb-5 overflow-y-auto">
            <div className="p-5" style={{ background: "#FCF8F0", border: "1px solid #E6DAC5", borderRadius: "22px 22px 8px 8px" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 18, color: "#3E362C" }}>
                {currentMeal.title}
              </div>
              {currentMeal.description && (
                <p className="text-sm mt-1.5" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
                  {currentMeal.description}
                </p>
              )}
              {currentMeal.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {currentMeal.tags.map((t) => (
                    <TagBadge key={t} tagKey={t} size={22} iconSize={13} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setChanging(true)}
                className="flex-1 rounded-full py-2.5 text-sm"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, background: "#3E362C", color: "#F8F2E8" }}
              >
                Change meal
              </button>
              <button
                onClick={() => { onRemove(slotKey); onClose(); }}
                className="flex-1 rounded-full py-2.5 text-sm"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, background: "transparent", color: "#B85C3E", border: "1.5px solid #B85C3E" }}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {showPicker && (
          <div ref={listRef} className="overflow-y-auto px-5 pb-24 flex flex-col" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <div className="flex items-center gap-2 mb-3 pt-0.5">
              <input
                ref={quickInputRef}
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitQuickAdd(); }}
                placeholder={`Type a ${mealType.toLowerCase()} and add it straight to the plan`}
                className="flex-1 min-w-0 rounded-full px-4 py-2.5 outline-none text-sm"
                style={{ fontFamily: "'Jost', sans-serif", background: "#FCF8F0", border: "1px solid #E6DAC5", color: "#3E362C" }}
              />
              <button
                onClick={submitQuickAdd}
                disabled={!quickTitle.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: quickTitle.trim() ? "#838966" : "#D9CBAE" }}
              >
                <Plus size={18} strokeWidth={1.8} color="#F8F2E8" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: "#E6DAC5" }} />
              <span className="text-xs" style={{ fontFamily: "'Jost', sans-serif", color: "#B0A78F" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#E6DAC5" }} />
            </div>
            <button
              onClick={() => onCreateNew(mealType, slotKey)}
              className="w-full flex items-center justify-center gap-1.5 text-sm mb-3"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: "#838966" }}
            >
              <Pencil size={13} strokeWidth={1.8} /> Add with description &amp; tags
            </button>
            <div className="relative mb-3">
              <div className="flex items-center gap-2 rounded-full px-3.5 py-2" style={{ background: "#FCF8F0", border: "1px solid #E6DAC5" }}>
                <Search size={15} color="#8C8370" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setSearchOpen(false)}
                  placeholder="Search saved meals"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ fontFamily: "'Jost', sans-serif", color: "#3E362C" }}
                />
                {search && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setSearch("")}
                    className="shrink-0 opacity-50 hover:opacity-100"
                  >
                    <X size={14} color="#3E362C" />
                  </button>
                )}
              </div>
              {searchOpen && search.trim() && (
                <div
                  className="absolute left-0 right-0 mt-1.5 overflow-hidden z-10"
                  style={{ background: "#FCF8F0", border: "1px solid #E6DAC5", borderRadius: 16, boxShadow: "0 10px 24px rgba(62,54,44,0.14)" }}
                >
                  {searchMatches.length === 0 ? (
                    <p className="text-sm px-4 py-3" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
                      No matches. Try "Add with description &amp; tags" above to save it as new.
                    </p>
                  ) : (
                    searchMatches.map((m, i) => (
                      <button
                        key={m.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { onAssign(slotKey, m.id); onClose(); }}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
                        style={{ borderBottom: i < searchMatches.length - 1 ? "1px solid #E6DAC5" : "none" }}
                      >
                        <div className="min-w-0">
                          <div className="text-sm truncate" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#3E362C" }}>
                            {m.title}
                          </div>
                          <div className="text-xs mt-0.5" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
                            {m.mealType}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {m.tags?.slice(0, 3).map((t) => <TagBadge key={t} tagKey={t} size={15} iconSize={9} />)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {filtered.length === 0 && (
                <p className="text-sm text-center py-6" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
                  No saved meals yet. Add your first one above.
                </p>
              )}
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onAssign(slotKey, m.id); onClose(); }}
                  className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-left"
                  style={{ background: "#FCF8F0", border: "1px solid #E6DAC5" }}
                >
                  <div className="min-w-0">
                    <div
                      className="text-sm truncate"
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#3E362C" }}
                    >
                      {m.title}
                    </div>
                    <div className="text-xs mt-0.5" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
                      {m.mealType}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {m.tags?.slice(0, 4).map((t) => <TagBadge key={t} tagKey={t} size={16} iconSize={9} />)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showPicker && (
          <button
            onClick={jumpToQuickAdd}
            title="Add a new meal"
            className="absolute flex items-center justify-center rounded-full"
            style={{
              bottom: 20,
              right: 20,
              width: 52,
              height: 52,
              background: "#3E362C",
              boxShadow: "0 6px 16px rgba(62,54,44,0.28)",
            }}
          >
            <Plus size={22} strokeWidth={1.8} color="#F8F2E8" />
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- meal editor --------------------------------- */

function MealEditor({ initial, defaultMealType, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [mealType, setMealType] = useState(initial?.mealType || defaultMealType || "Breakfast");
  const [tags, setTags] = useState(initial?.tags || []);
  const dismissedRef = useRef(new Set());
  const autoTags = suggestTagsFromText(`${title} ${description}`);

  useEffect(() => {
    const suggested = suggestTagsFromText(`${title} ${description}`);
    setTags((prev) => {
      const additions = suggested.filter((k) => !prev.includes(k) && !dismissedRef.current.has(k));
      return additions.length ? [...prev, ...additions] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  function toggleTag(key) {
    setTags((prev) => {
      if (prev.includes(key)) {
        if (autoTags.includes(key)) dismissedRef.current.add(key);
        return prev.filter((t) => t !== key);
      }
      dismissedRef.current.delete(key);
      return [...prev, key];
    });
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: initial?.id || uid("meal"),
      title: title.trim(),
      description: description.trim(),
      mealType,
      tags,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(42,39,33,0.4)" }} onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md overflow-y-auto"
        style={{ background: "#F8F2E8", borderRadius: "36px 36px 0 0", maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 21, color: "#3E362C" }}>
            {initial ? "Edit meal" : "New meal"}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
            <X size={20} color="#3E362C" />
          </button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-4">
          <div>
            <label className="text-xs" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#8C8370" }}>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Salmon & Greens"
              autoFocus
              className="w-full mt-1 rounded-xl px-3.5 py-2.5 outline-none text-sm"
              style={{ fontFamily: "'Jost', sans-serif", background: "#FCF8F0", border: "1px solid #E6DAC5", color: "#3E362C" }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#8C8370" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in it, how you make it..."
              rows={3}
              className="w-full mt-1 rounded-xl px-3.5 py-2.5 outline-none text-sm resize-none"
              style={{ fontFamily: "'Jost', sans-serif", background: "#FCF8F0", border: "1px solid #E6DAC5", color: "#3E362C" }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#8C8370" }}>
              Meal type
            </label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {MEAL_TYPES.map((mt) => (
                <PillButton key={mt} active={mealType === mt} onClick={() => setMealType(mt)}>
                  {mt}
                </PillButton>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#8C8370" }}>
              Good source of
            </label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {TAGS.map((t) => (
                <TagChipToggle
                  key={t.key}
                  tagKey={t.key}
                  active={tags.includes(t.key)}
                  auto={autoTags.includes(t.key)}
                  onClick={() => toggleTag(t.key)}
                />
              ))}
            </div>
            {tags.some((k) => autoTags.includes(k)) && (
              <p className="text-xs mt-2" style={{ fontFamily: "'Jost', sans-serif", color: "#B0A78F" }}>
                Tags with a dot were guessed from your title and description — tap any tag to adjust.
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full rounded-full py-3 text-sm mt-2"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 600,
              background: title.trim() ? "#3E362C" : "#D9CBAE",
              color: "#F8F2E8",
            }}
          >
            Save meal
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- meal dump --------------------------------- */

function MealDumpModal({ onSave, onClose }) {
  const [dump, setDump] = useState("");

  function submit() {
    const parts = dump.split("\n").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    onSave(parts);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(62,54,44,0.4)" }} onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md overflow-y-auto"
        style={{ background: "#F8F2E8", borderRadius: "36px 36px 0 0", maxHeight: "85vh" }}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 21, color: "#3E362C" }}>
            Meal dump
          </span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
            <X size={20} color="#3E362C" />
          </button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-3">
          <p className="text-sm" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
            Type out meal ideas, one per line. They'll land in your saved meals so you can add details and place them on the calendar whenever you're ready.
          </p>
          <div className="p-4" style={{ background: "#FCF8F0", border: "1px solid #E6DAC5", borderRadius: "22px 22px 10px 10px" }}>
            <textarea
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              placeholder={"Lemon herb chicken\nChickpea salad\nSheet pan veggies\nOvernight oats"}
              rows={6}
              autoFocus
              className="w-full outline-none resize-none text-sm bg-transparent"
              style={{ fontFamily: "'Jost', sans-serif", color: "#3E362C" }}
            />
          </div>
          <button
            onClick={submit}
            disabled={!dump.trim()}
            className="w-full rounded-full py-3 text-sm"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 600,
              background: dump.trim() ? "#3E362C" : "#D9CBAE",
              color: "#F8F2E8",
            }}
          >
            Save to meal list
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- saved meals --------------------------------- */

function MealCard({ meal, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="p-5 flex flex-col gap-2" style={{ background: "#FCF8F0", border: "1px solid #E6DAC5", borderRadius: "24px 24px 8px 8px" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {meal.mealType === "Unsorted" ? (
            <span
              className="text-xs"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: "#B85C3E" }}
            >
              Needs details
            </span>
          ) : (
            <span
              className="text-xs"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: "#B0A78F" }}
            >
              {meal.mealType}
            </span>
          )}
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 18, color: "#3E362C" }}>
            {meal.title}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(meal)} className="p-1.5 rounded-full hover:bg-black/5">
            <Pencil size={14} color="#8C8370" />
          </button>
          <button
            onClick={() => (confirming ? onDelete(meal.id) : setConfirming(true))}
            onBlur={() => setConfirming(false)}
            className="p-1.5 rounded-full hover:bg-black/5"
          >
            <Trash2 size={14} color={confirming ? "#B85C3E" : "#8C8370"} />
          </button>
        </div>
      </div>
      {meal.description && (
        <p
          className="text-sm"
          style={{
            fontFamily: "'Jost', sans-serif",
            color: "#8C8370",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {meal.description}
        </p>
      )}
      {confirming && (
        <span className="text-xs" style={{ fontFamily: "'Jost', sans-serif", color: "#B85C3E" }}>
          Tap trash again to delete
        </span>
      )}
      {meal.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {meal.tags.map((t) => <TagBadge key={t} tagKey={t} size={22} iconSize={13} />)}
        </div>
      )}
    </div>
  );
}

function SavedMealsView({ meals, onNew, onDump, onEdit, onDelete }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? meals : meals.filter((m) => m.mealType === filter);
  const hasUnsorted = meals.some((m) => m.mealType === "Unsorted");

  return (
    <div className="relative overflow-hidden px-4 sm:px-6 py-4">
      <Watermark position="bottom-right" opacity={0.06}>
        <Croissant size={210} color="#838966" strokeWidth={1} />
      </Watermark>
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 23, color: "#3E362C" }}>
          <Croissant size={22} color="#B85C3E" strokeWidth={1.6} />
          Saved meals
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onDump}
            title="Bulk list new meals"
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ border: "1.4px solid #838966", background: "transparent" }}
          >
            <ListPlus size={17} strokeWidth={1.8} color="#838966" />
          </button>
          <button
            onClick={onNew}
            title="New meal"
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ border: "1.4px solid #838966", background: "transparent" }}
          >
            <Plus size={18} strokeWidth={1.8} color="#838966" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-4">
        {["All", ...MEAL_TYPES, ...(hasUnsorted ? ["Unsorted"] : [])].map((f) => (
          <PillButton key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </PillButton>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Utensils size={28} color="#B7AE8E" />
          <p className="text-sm" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
            {meals.length === 0 ? "No meals saved yet." : `No ${filter.toLowerCase()} meals yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <MealCard key={m.id} meal={m} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- grocery list --------------------------------- */

function GroceryRow({ item, onToggle, onDelete }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const maxDrag = 120;
  const threshold = 80;

  function onPointerDown(e) {
    startX.current = e.clientX;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    setDx(Math.max(0, Math.min(maxDrag, delta)));
  }
  function finish() {
    if (!dragging) return;
    setDragging(false);
    if (dx > threshold) onToggle();
    setDx(0);
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 flex items-center pl-2"
        style={{ background: "#EFE6D4", opacity: dx > 4 ? 1 : 0 }}
      >
        <Check size={17} color="#838966" strokeWidth={1.8} style={{ opacity: Math.min(1, dx / threshold) }} />
      </div>
      <div
        className="relative flex items-center gap-3 px-2 py-3.5"
        style={{
          background: "#F8F2E8",
          borderBottom: "1px solid #E6DAC5",
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <button
          onClick={onToggle}
          className="shrink-0 w-4 h-4 rounded-full"
          style={{ border: "1.4px solid #838966" }}
        />
        <span
          className="flex-1 leading-snug"
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, color: "#3E362C", fontSize: 15 }}
        >
          {item.text}
        </span>
        <button onClick={onDelete} className="shrink-0 p-1 opacity-40 hover:opacity-100">
          <Trash2 size={14} strokeWidth={1.6} color="#3E362C" />
        </button>
      </div>
    </div>
  );
}

function CheckedRow({ item, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-2 py-3" style={{ borderBottom: "1px solid #E6DAC5" }}>
      <button
        onClick={onToggle}
        className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: "#838966" }}
      >
        <Check size={10} color="#F8F2E8" strokeWidth={2.5} />
      </button>
      <span
        className="flex-1 leading-snug line-through"
        style={{ fontFamily: "'Jost', sans-serif", color: "#B0A78F", fontSize: 15 }}
      >
        {item.text}
      </span>
      <button onClick={onDelete} className="shrink-0 p-1 opacity-40 hover:opacity-100">
        <Trash2 size={14} strokeWidth={1.6} color="#3E362C" />
      </button>
    </div>
  );
}

function GroceryView({ items, onAdd, onToggle, onDelete, onClearChecked }) {
  const [dump, setDump] = useState("");
  const [showChecked, setShowChecked] = useState(false);

  const active = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  function submitDump() {
    const parts = dump.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    onAdd(parts);
    setDump("");
  }

  return (
    <div className="relative overflow-hidden px-4 sm:px-6 py-4 max-w-xl mx-auto">
      <Watermark position="bottom-left" opacity={0.06}>
        <Baguette size={240} color="#838966" strokeWidth={1} />
      </Watermark>
      <span className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 23, color: "#3E362C" }}>
        <Baguette size={24} color="#B85C3E" strokeWidth={1.6} />
        Grocery list
      </span>

      <div className="mt-4 p-4" style={{ background: "#FCF8F0", border: "1px solid #E6DAC5", borderRadius: "22px 22px 10px 10px" }}>
        <textarea
          value={dump}
          onChange={(e) => setDump(e.target.value)}
          placeholder="Dump everything you need — one item per line, or comma-separated. Eggs, spinach, 2 avocados, salmon..."
          rows={3}
          className="w-full outline-none resize-none text-sm bg-transparent"
          style={{ fontFamily: "'Jost', sans-serif", color: "#3E362C" }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={submitDump}
            disabled={!dump.trim()}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 600,
              background: dump.trim() ? "#838966" : "#D9CBAE",
              color: "#F8F2E8",
            }}
          >
            <Plus size={14} /> Add to list
          </button>
        </div>
      </div>

      <p className="text-xs mt-4 mb-2" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
        Swipe an item right to check it off.
      </p>

      <div className="mt-1">
        {active.length === 0 && checked.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <ShoppingCart size={26} color="#B7AE8E" />
            <p className="text-sm" style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>
              Your list is empty. Brain dump above to get started.
            </p>
          </div>
        )}
        {active.map((item) => (
          <GroceryRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onDelete={() => onDelete(item.id)} />
        ))}
      </div>

      {checked.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowChecked((s) => !s)}
            className="flex items-center gap-1.5 text-sm mb-2"
            style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#8C8370" }}
          >
            {showChecked ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            Checked off ({checked.length})
          </button>
          {showChecked && (
            <>
              {checked.map((item) => (
                <CheckedRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onDelete={() => onDelete(item.id)} />
              ))}
              <button
                onClick={onClearChecked}
                className="text-xs mt-1"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, color: "#B85C3E" }}
              >
                Clear checked items
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------- app ----------------------------------- */

export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("week");
  const [meals, setMeals] = useState([]);
  const [groceryItems, setGroceryItems] = useState([]);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [weekSlots, setWeekSlots] = useState({});
  const [slot, setSlot] = useState(null);
  const [editor, setEditor] = useState(null); // { initial, defaultMealType, forSlotKey }
  const [showMealDump, setShowMealDump] = useState(false);
  const weekCache = useRef({});

  useEffect(() => {
    (async () => {
      const [m, g] = await Promise.all([storageGet("meals"), storageGet("grocery")]);
      if (m && m.length) {
        setMeals(m);
      } else {
        setMeals(SAMPLE_MEALS);
        storageSet("meals", SAMPLE_MEALS);
      }
      setGroceryItems(g || []);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const key = toKey(weekStart);
    if (weekCache.current[key]) {
      setWeekSlots(weekCache.current[key]);
      return;
    }
    (async () => {
      const val = (await storageGet(`week-${key}`)) || {};
      weekCache.current[key] = val;
      setWeekSlots(val);
    })();
  }, [weekStart]);

  const saveMeals = useCallback((next) => {
    setMeals(next);
    storageSet("meals", next);
  }, []);

  const saveGrocery = useCallback((next) => {
    setGroceryItems(next);
    storageSet("grocery", next);
  }, []);

  const saveWeekSlots = useCallback((next) => {
    const key = toKey(weekStart);
    weekCache.current[key] = next;
    setWeekSlots(next);
    storageSet(`week-${key}`, next);
  }, [weekStart]);

  function openSlot(dayIdx, mealType) {
    setSlot({ dayIdx, mealType });
  }

  function assignMeal(slotKey, mealId) {
    saveWeekSlots({ ...weekSlots, [slotKey]: mealId });
  }
  function removeMeal(slotKey) {
    const next = { ...weekSlots };
    delete next[slotKey];
    saveWeekSlots(next);
  }

  function handleSaveMeal(meal) {
    const exists = meals.some((m) => m.id === meal.id);
    const next = exists ? meals.map((m) => (m.id === meal.id ? meal : m)) : [meal, ...meals];
    saveMeals(next);
    if (editor?.forSlotKey) {
      assignMeal(editor.forSlotKey, meal.id);
      setSlot(null);
    }
    setEditor(null);
  }

  function handleDeleteMeal(mealId) {
    saveMeals(meals.filter((m) => m.id !== mealId));
    const nextSlots = { ...weekSlots };
    let changed = false;
    Object.keys(nextSlots).forEach((k) => {
      if (nextSlots[k] === mealId) { delete nextSlots[k]; changed = true; }
    });
    if (changed) saveWeekSlots(nextSlots);
  }

  function handleDumpMeals(titles) {
    const newMeals = titles.map((title) => ({
      id: uid("meal"),
      title,
      description: "",
      mealType: "Unsorted",
      tags: suggestTagsFromText(title),
    }));
    saveMeals([...newMeals, ...meals]);
    setShowMealDump(false);
  }

  function handleQuickAddMeal(title, mealType, slotKey) {
    const meal = { id: uid("meal"), title, description: "", mealType, tags: suggestTagsFromText(title) };
    const nextMeals = [meal, ...meals];
    saveMeals(nextMeals);
    saveWeekSlots({ ...weekSlots, [slotKey]: meal.id });
    setSlot(null);
  }

  function handleAddGrocery(parts) {
    const items = parts.map((text) => ({ id: uid("item"), text, checked: false }));
    saveGrocery([...items, ...groceryItems]);
  }
  function toggleGrocery(id) {
    saveGrocery(groceryItems.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }
  function deleteGrocery(id) {
    saveGrocery(groceryItems.filter((i) => i.id !== id));
  }
  function clearChecked() {
    saveGrocery(groceryItems.filter((i) => !i.checked));
  }

  return (
    <div style={{ minHeight: "100%", background: "#F8F2E8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500;1,9..144,600&family=Jost:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body, html { background: #F8F2E8; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #D9CBAE; border-radius: 4px; }
      `}</style>

      <Header view={view} setView={setView} />

      {!ready ? (
        <div className="flex items-center justify-center py-24">
          <span style={{ fontFamily: "'Jost', sans-serif", color: "#8C8370" }}>Loading Bon Appétit…</span>
        </div>
      ) : (
        <>
          {view === "week" && (
            <WeekGrid
              weekStart={weekStart}
              setWeekStart={setWeekStart}
              weekSlots={weekSlots}
              meals={meals}
              openSlot={openSlot}
            />
          )}
          {view === "meals" && (
            <SavedMealsView
              meals={meals}
              onNew={() => setEditor({ initial: null, defaultMealType: "Breakfast", forSlotKey: null })}
              onDump={() => setShowMealDump(true)}
              onEdit={(meal) => setEditor({ initial: meal, defaultMealType: meal.mealType, forSlotKey: null })}
              onDelete={handleDeleteMeal}
            />
          )}
          {view === "grocery" && (
            <GroceryView
              items={groceryItems}
              onAdd={handleAddGrocery}
              onToggle={toggleGrocery}
              onDelete={deleteGrocery}
              onClearChecked={clearChecked}
            />
          )}
        </>
      )}

      {slot && (
        <SlotModal
          slot={slot}
          weekStart={weekStart}
          weekSlots={weekSlots}
          meals={meals}
          onAssign={assignMeal}
          onRemove={removeMeal}
          onClose={() => setSlot(null)}
          onCreateNew={(mealType, slotKey) => setEditor({ initial: null, defaultMealType: mealType, forSlotKey: slotKey })}
          onQuickAdd={handleQuickAddMeal}
        />
      )}

      {editor && (
        <MealEditor
          initial={editor.initial}
          defaultMealType={editor.defaultMealType}
          onSave={handleSaveMeal}
          onClose={() => setEditor(null)}
        />
      )}

      {showMealDump && (
        <MealDumpModal onSave={handleDumpMeals} onClose={() => setShowMealDump(false)} />
      )}
    </div>
  );
}
