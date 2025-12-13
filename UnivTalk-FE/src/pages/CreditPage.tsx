import React from "react";

type Developer = {
  name: string;
  role: string;
  github?: string;
  linkedin?: string;
};

const developers: Developer[] = [
  {
    name: "arpthef",
    role: "Backend Developer",
    github: "https://github.com/Ariffansyah",
  },
  {
    name: "Hafiz/Sabar",
    role: "Frontend Developer",
    github: "https://github.com/haffrs",
  },
  {
    name: "Niel",
    role: "Frontend Developer",
    github: "https://github.com/Hexkrofon",
  },
  {
    name: "Kai",
    role: "Frontend Developer",
    github: "https://github.com/aikokaii",
  },
];

const CreditPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Credits</h1>
      <p style={styles.subtitle}>Meet the developers behind this website</p>
      <div style={styles.Grid as any} className="credit-grid">
        {developers.map((dev, index) => (
          <DeveloperCard key={index} dev={dev} />
        ))}
      </div>
      <style>
        {`
        @media (max-width: 850px) {
          .credit-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 500px) {
          .credit-grid {
            gap: 14px !important;
            padding: 0 2vw;
          }
        }
        `}
      </style>
    </div>
  );
};

const DeveloperCard = ({ dev }: { dev: Developer }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoveredLink, setHoveredLink] = React.useState<
    "github" | "linkedin" | null
  >(null);

  return (
    <div
      style={{
        ...styles.card,
        backgroundColor: isHovered ? "#000" : "#fff",
        color: isHovered ? "#fff" : "#000",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
        boxShadow: isHovered
          ? "0 12px 30px rgba(0,0,0,0.4)"
          : "0 4px 10px rgba(0,0,0,0.05)",
        transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
    >
      <h2 style={styles.name}>{dev.name}</h2>
      <p
        style={{
          ...styles.role,
          color: isHovered ? "#ccc" : "#555",
        }}
      >
        {dev.role}
      </p>
      <div style={styles.links}>
        {dev.github && (
          <a
            href={dev.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...styles.link,
              color:
                hoveredLink === "github"
                  ? "#bce4eeff"
                  : isHovered
                    ? "#4ea8ff"
                    : "#0077cc",
              transform:
                hoveredLink === "github"
                  ? "translateY(-2px) scale(1.05)"
                  : "none",
            }}
            onMouseEnter={() => setHoveredLink("github")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            GitHub
          </a>
        )}
        {dev.linkedin && (
          <a
            href={dev.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...styles.link,
              color:
                hoveredLink === "linkedin"
                  ? "#ffffff"
                  : isHovered
                    ? "#4ea8ff"
                    : "#0077cc",
              transform:
                hoveredLink === "linkedin"
                  ? "translateY(-2px) scale(1.05)"
                  : "none",
            }}
            onMouseEnter={() => setHoveredLink("linkedin")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "40px 0",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "2.7rem",
    marginBottom: "10px",
    letterSpacing: ".01em",
    fontWeight: 700,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: "40px",
  },
  Grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(250px, 1fr))",
    gap: "28px",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: "28px",
    borderRadius: "64px",
    border: "1px solid #e0e0e0",
    backgroundColor: "#fff",
    minHeight: "170px",
    maxWidth: "400px",
    margin: "0 auto",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    outline: "none",
  },
  name: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  role: {
    fontSize: "1.13rem",
    color: "#555",
    marginBottom: "12px",
  },
  links: {
    display: "flex",
    gap: "16px",
    marginTop: "auto",
  },
  link: {
    fontSize: "1rem",
    fontWeight: 500,
    textDecoration: "none",
    transition: "transform 0.2s ease, color 0.2s ease",
  },
};

export default CreditPage;
