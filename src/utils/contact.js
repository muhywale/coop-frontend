// Nigerian local numbers (0803...) become the international form WhatsApp needs (234803...)
export const whatsappLink = (number, text) => {
  let digits = String(number || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export const telLink = (number) => {
  const cleaned = String(number || "").replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
};
