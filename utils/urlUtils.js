// utils/urlUtils.js
export const isHostMatching = (hostname, domain) => {
  const cleanHost = hostname.replace(/^www\./, "");
  return cleanHost === domain || cleanHost.endsWith(`.${domain}`);
};
