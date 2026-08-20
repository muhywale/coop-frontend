// Maps account/product categories and common names to a consistent color theme
export function getAccountTheme(label = "") {
  const l = label.toLowerCase();

  if (l.includes("share"))
    return {
      header: "bg-emerald-100 text-emerald-800",
      accent: "border-emerald-300",
      bal: "text-emerald-700",
    };
  if (l.includes("saving"))
    return {
      header: "bg-amber-100 text-amber-800",
      accent: "border-amber-300",
      bal: "text-amber-700",
    };
  if (l.includes("build"))
    return {
      header: "bg-sky-100 text-sky-800",
      accent: "border-sky-300",
      bal: "text-sky-700",
    };
  if (l.includes("loan"))
    return {
      header: "bg-rose-100 text-rose-800",
      accent: "border-rose-300",
      bal: "text-rose-700",
    };
  if (l.includes("commodity") || l.includes("other"))
    return {
      header: "bg-indigo-100 text-indigo-800",
      accent: "border-indigo-300",
      bal: "text-indigo-700",
    };
  if (l.includes("deposit"))
    return {
      header: "bg-purple-100 text-purple-800",
      accent: "border-purple-300",
      bal: "text-purple-700",
    };
  if (
    l.includes("income") ||
    l.includes("fee") ||
    l.includes("interest") ||
    l.includes("fine")
  )
    return {
      header: "bg-teal-100 text-teal-800",
      accent: "border-teal-300",
      bal: "text-teal-700",
    };
  if (l.includes("expense") || l.includes("paid") || l.includes("charge"))
    return {
      header: "bg-orange-100 text-orange-800",
      accent: "border-orange-300",
      bal: "text-orange-700",
    };
  if (l.includes("cash") || l.includes("bank"))
    return {
      header: "bg-cyan-100 text-cyan-800",
      accent: "border-cyan-300",
      bal: "text-cyan-700",
    };

  return {
    header: "bg-gray-100 text-gray-700",
    accent: "border-gray-300",
    bal: "text-gray-700",
  };
}
