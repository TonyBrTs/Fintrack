export function SubNavbar() {
  const navItems = [
    { name: "Resumen", active: true },
    { name: "Gastos", active: false },
    { name: "Ingresos", active: false },
    { name: "Metas", active: false },
  ];

  return (
    <div className="bg-white dark:bg-card border-b border-gray-100 dark:border-border flex items-center px-4 md:px-20 overflow-x-auto whitespace-nowrap transition-colors duration-300 scrollbar-hide">
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
  );
}
