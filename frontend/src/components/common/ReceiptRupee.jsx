import React from "react";

const ReceiptRupee = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Receipt shape */}
    <path d="M4 21v-18l2 2 2-2 2 2 2-2 2 2 2-2 2 2v18l-2-2-2 2-2-2-2 2-2-2-2 2z" />
    
    {/* Rupee symbol moved slightly left */}
    <text
      x="11"
      y="17"
      fontSize="14"
      fontWeight="900"
      textAnchor="middle"
      fill={color}
      fontFamily="Arial, Helvetica, sans-serif"
      stroke="none"
      paintOrder="stroke"
    >
      ₹
    </text>
  </svg>
);

export default ReceiptRupee;
