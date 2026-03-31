export const formatNumber = (value, options = {}) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", options).format(numericValue);
};
