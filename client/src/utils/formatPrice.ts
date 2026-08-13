export const formatPrice = (price: number): string => {
  return price.toLocaleString("vi-VN") + "đ";
};