import React, { memo } from 'react';

const Header = memo(function Header({ title }) {

  return (
    <header style={{
      padding: 20,
      borderBottom: "1px solid #e5e7eb",
      background: "transparent",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <h2 style={{
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700",
        margin: 0
      }}>
        {title}
      </h2>
    </header>
  );
});

export default Header;
