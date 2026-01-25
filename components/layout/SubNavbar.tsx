import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";

export function SubNavbar() {
  const navItems = [
    { name: "Resumen", active: true, icon: <LayoutDashboard size={20} /> },
    { name: "Gastos", active: false, icon: <TrendingDown size={20} /> },
    { name: "Ingresos", active: false, icon: <TrendingUp size={20} /> },
    { name: "Metas", active: false, icon: <Target size={20} /> },
  ];

  return (
    <>
      {/* Desktop/Tablet View (Top Bar) */}
      <div className="hidden md:flex bg-white dark:bg-card border-b border-gray-100 dark:border-border items-center px-4 md:px-20 overflow-x-auto whitespace-nowrap transition-colors duration-300 scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`
              relative px-4 py-4 font-medium transition-colors cursor-pointer
              ${
                item.active
                  ? "text-[var(--color-action)] dark:text-blue-400"
                  : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
              }
            `}
          >
            {item.name}
            {item.active && (
              <span className="absolute bottom-0 left-0 w-full h-0.75 bg-[var(--color-action)] dark:bg-blue-400 rounded-t-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Mobile View (Bottom Bar - WhatsApp Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-200 dark:border-border flex justify-between items-center px-6 py-2 z-50 transition-colors duration-300">
        {navItems.map((item) => (
          <button
            key={item.name}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div
              className={`
                px-5 py-1 rounded-full transition-colors
                ${
                  item.active
                    ? "bg-action/10 dark:bg-blue-400/20 text-action dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }
              `}
            >
              {item.icon}
            </div>
            <span
              className={`
                text-[10px] font-medium
                ${
                  item.active
                    ? "text-action dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }
              `}
            >
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
