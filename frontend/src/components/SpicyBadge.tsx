// A tiny reusable component: the 🌶️ badge shown on spicy menu items.
// Used by MenuItemCard and the menu item detail page.
export function SpicyBadge() {
  return (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      🌶️ Spicy
    </span>
  );
}
