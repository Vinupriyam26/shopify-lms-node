import { BrowserRouter, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";

function CustomTopNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  // test
  return (
    <div style={{
      background: "#000000",
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      marginBottom: "20px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <span style={{ fontSize: "18px", fontWeight: "700", color: "#96bf48", letterSpacing: "0.5px", marginRight: "15px" }}>
          Shopify LMS
        </span>
        <Link
          to="/"
          style={{
            color: currentPath === "/" ? "#ffffff" : "#b0b0b0",
            textDecoration: "none",
            fontWeight: currentPath === "/" ? "600" : "400",
            padding: "8px 16px",
            borderRadius: "6px",
            background: currentPath === "/" ? "#333333" : "transparent",
            transition: "all 0.2s ease"
          }}
        >
          Dashboard
        </Link>
        <Link
          to="/courses"
          style={{
            color: currentPath === "/courses" ? "#ffffff" : "#b0b0b0",
            textDecoration: "none",
            fontWeight: currentPath === "/courses" ? "600" : "400",
            padding: "8px 16px",
            borderRadius: "6px",
            background: currentPath === "/courses" ? "#333333" : "transparent",
            transition: "all 0.2s ease"
          }}
        >
          Courses
        </Link>
        <Link
          to="/students"
          style={{
            color: currentPath === "/students" ? "#ffffff" : "#b0b0b0",
            textDecoration: "none",
            fontWeight: currentPath === "/students" ? "600" : "400",
            padding: "8px 16px",
            borderRadius: "6px",
            background: currentPath === "/students" ? "#333333" : "transparent",
            transition: "all 0.2s ease"
          }}
        >
          Students & Enrollments
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <CustomTopNav />
          <Routes pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
