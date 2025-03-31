export const isHostMatching = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
