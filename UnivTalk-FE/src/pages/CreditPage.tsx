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
    github: "https://github.com/aikokaii"
  },
];

const CreditPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Credits</h1>
      <p style={styles.subtitle}>Meet the developers behind this website</p>
      <div style={styles.Grid}>
        {developers.map((dev, index) => (
            <DeveloperCard key={index} dev={dev} />
            ))}
      </div>
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
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
    padding: "40px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "2.5rem",
    marginBottom: "10px",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: "40px",
  },


Grid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "24px",
},

card: {
  padding: "24px",
  borderRadius: "100px",
  border: "1px solid #e0e0e0",
  backgroundColor: "#fff",
  minHeight: "165px",
  maxWidth: "380px",
  margin: "0 auto",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",     
  justifyContent: "center", 
  textAlign: "center",      
},

  nameWrapper: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    width: "100%",
    marginBottom: "6px",
  },

  name: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },

  role: {
    fontSize: "1.2rem",
    color: "#555",
    marginBottom: "12px",
  },

  links: {
    display: "flex",
    gap: "12px",
    marginTop:"auto",
  },

  link: {
  fontSize: "0.95rem",
  fontWeight: 500,
  textDecoration: "none",
  transition: "transform 0.2s ease, color 0.2s ease",
},
};

export default CreditPage;
