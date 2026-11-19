import { LayoutDashboard, BookOpen, BookMarked, CalendarDays, LayoutGrid } from "lucide-react";
import "./bottom-nav.css";

const TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "courses", label: "Course", icon: BookOpen },
  { id: "materials", label: "Materials", icon: BookMarked },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
];

export default function BottomNav({ page, setPage, onMore }) {
  const go = (id) => {
    if (id !== page) setPage(id);
    requestAnimationFrame(() =>
      window.scrollTo(0, id === "courses" ? document.documentElement.scrollHeight : 0),
    );
  };
  const pastelTheme = page !== "dashboard" && page !== "courses";

  return (
    <nav
      className={`bottom-nav${pastelTheme ? " pastel-nav" : ""}`}
      aria-label="Important sections"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = page === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bn-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={tab.id === "materials" ? "Study Materials" : undefined}
            title={tab.id === "materials" ? "Study Materials" : undefined}
            onClick={() => go(tab.id)}
          >
            <span className="bn-ico">
              <Icon size={19} />
            </span>
            <span className="bn-label">{tab.label}</span>
          </button>
        );
      })}
      <button type="button" className="bn-item" onClick={onMore} aria-label="Open the full menu">
        <span className="bn-ico">
          <LayoutGrid size={19} />
        </span>
        <span className="bn-label">More</span>
      </button>
    </nav>
  );
}
