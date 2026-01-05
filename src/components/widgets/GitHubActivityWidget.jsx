import BaseWidget from "./BaseWidget";
import { useEffect, useRef, useState } from "react";

// GitHub username - CHANGE THIS to your actual GitHub username
// TODO: Make this configurable via props or environment variable
const GITHUB_USERNAME = "blazittx"; // ⚠️ Update this with your GitHub username

export default function GitHubActivityWidget() {
  const containerRef = useRef(null);
  const [sizeClass, setSizeClass] = useState("");
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const updateSizeClass = () => {
      if (!containerRef.current) return;
      const { height } = containerRef.current.getBoundingClientRect();
      const isShort = height < 200;
      const isVeryShort = height < 150;
      let classes = [];
      if (isShort) classes.push("short");
      if (isVeryShort) classes.push("very-short");
      setSizeClass(classes.join(" "));
    };
    updateSizeClass();
    const resizeObserver = new ResizeObserver(updateSizeClass);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const profileResponse = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}`
        );

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            throw new Error(`User "${GITHUB_USERNAME}" not found`);
          }
          throw new Error(`GitHub API error: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch repositories
        const reposResponse = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6&type=all`
        );

        if (!reposResponse.ok) {
          throw new Error(`Failed to fetch repositories`);
        }

        const reposData = await reposResponse.json();
        
        // Calculate language statistics from repositories
        const languageMap = new Map();
        let totalBytes = 0;

        // Fetch language data for each repo (limited to avoid rate limits)
        const reposWithLanguages = await Promise.all(
          reposData.slice(0, 10).map(async (repo) => {
            try {
              const langResponse = await fetch(repo.languages_url);
              if (langResponse.ok) {
                const langData = await langResponse.json();
                
                Object.entries(langData).forEach(([lang, bytes]) => {
                  const current = languageMap.get(lang) || 0;
                  languageMap.set(lang, current + bytes);
                  totalBytes += bytes;
                });

                return { ...repo, languages: langData };
              }
              return repo;
            } catch {
              return repo;
            }
          })
        );

        // Sort languages by usage
        const sortedLanguages = Array.from(languageMap.entries())
          .map(([name, bytes]) => ({
            name,
            bytes,
            percentage: (bytes / totalBytes) * 100,
          }))
          .sort((a, b) => b.bytes - a.bytes)
          .slice(0, 5); // Top 5 languages

        setLanguages(sortedLanguages);
        setRepos(reposWithLanguages.slice(0, 6));
      } catch (err) {
        console.error("Error fetching GitHub data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchGitHubData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      Python: "#3572A5",
      Java: "#b07219",
      "C++": "#f34b7d",
      C: "#555555",
      "C#": "#239120",
      Go: "#00ADD8",
      Rust: "#dea584",
      PHP: "#4F5D95",
      Ruby: "#701516",
      Swift: "#FA7343",
      Kotlin: "#A97BFF",
      HTML: "#e34c26",
      CSS: "#563d7c",
      Vue: "#4fc08d",
      React: "#61dafb",
      Angular: "#dd0031",
      Shell: "#89e051",
      Dockerfile: "#384d54",
      R: "#198CE7",
      Scala: "#c22d40",
      Dart: "#00b4ab",
    };
    return colors[language] || "#586e75";
  };

  const getHeaderStyle = () => ({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
    flexShrink: 0,
  });

  const getH3Style = () => ({
    fontSize: sizeClass.includes("very-short") ? "0.875rem" : "1rem",
    fontWeight: 600,
    margin: 0,
    letterSpacing: "-0.01em",
    color: "canvasText",
    display: sizeClass.includes("very-short") ? "none" : "block",
  });

  const getLinkIconStyle = () => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: sizeClass.includes("very-short") ? "14px" : "16px",
    height: sizeClass.includes("very-short") ? "14px" : "16px",
    opacity: 0.7,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textDecoration: "none",
  });

  const getStatsStyle = () => ({
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
    padding: "0.75rem",
    borderRadius: "6px",
    background: "color-mix(in hsl, canvasText, transparent 96%)",
    border: "1px solid color-mix(in hsl, canvasText, transparent 92%)",
  });

  const getStatItemStyle = () => ({
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  });

  const getStatValueStyle = () => ({
    fontWeight: 700,
    fontSize: sizeClass.includes("very-short") ? "1rem" : "1.25rem",
    color: "canvasText",
    lineHeight: 1.2,
  });

  const getStatLabelStyle = () => ({
    fontSize: sizeClass.includes("very-short") ? "0.6875rem" : "0.75rem",
    opacity: 0.65,
    color: "canvasText",
  });

  const getLanguagesContainerStyle = () => ({
    marginBottom: "1rem",
    padding: "0.75rem",
    borderRadius: "6px",
    background: "color-mix(in hsl, canvasText, transparent 96%)",
    border: "1px solid color-mix(in hsl, canvasText, transparent 92%)",
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
  });

  const getLanguageItemStyle = () => ({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  });

  const getLanguageNameStyle = () => ({
    fontSize: sizeClass.includes("very-short") ? "0.75rem" : "0.8125rem",
    color: "canvasText",
    minWidth: sizeClass.includes("very-short") ? "60px" : "80px",
    opacity: 0.9,
  });

  const getLanguageBarStyle = () => ({
    flex: 1,
    height: sizeClass.includes("very-short") ? "8px" : "10px",
    borderRadius: "6px",
    overflow: "hidden",
    background: "color-mix(in hsl, canvasText, transparent 92%)",
    boxShadow: "inset 0 1px 2px color-mix(in hsl, canvasText, transparent 95%)",
  });

  const getLanguageFillStyle = (language, percentage) => ({
    height: "100%",
    width: `${percentage}%`,
    backgroundColor: getLanguageColor(language),
    borderRadius: "4px",
    transition: "width 0.3s ease",
  });

  const getLanguagePercentStyle = () => ({
    fontSize: sizeClass.includes("very-short") ? "0.625rem" : "0.6875rem",
    color: "canvasText",
    opacity: 0.6,
    minWidth: "35px",
    textAlign: "right",
  });

  const getReposContainerStyle = () => ({
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    paddingRight: "4px",
  });

  const getRepoItemStyle = () => ({
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    padding: "0.75rem",
    borderRadius: "6px",
    background: "color-mix(in hsl, canvasText, transparent 96%)",
    border: "1px solid color-mix(in hsl, canvasText, transparent 92%)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px color-mix(in hsl, canvasText, transparent 98%)",
  });

  const getRepoNameStyle = () => ({
    fontSize: sizeClass.includes("very-short") ? "0.75rem" : "0.8125rem",
    fontWeight: 600,
    color: "canvasText",
    opacity: 0.9,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  });

  const getRepoDescStyle = () => ({
    fontSize: sizeClass.includes("very-short") ? "0.625rem" : "0.6875rem",
    color: "canvasText",
    opacity: 0.7,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  });

  const getRepoMetaStyle = () => ({
    display: "flex",
    gap: "0.75rem",
    fontSize: sizeClass.includes("very-short") ? "0.625rem" : "0.6875rem",
    color: "canvasText",
    opacity: 0.6,
    marginTop: "0.25rem",
  });

  const getLoadingStyle = () => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "canvasText",
    opacity: 0.6,
    fontSize: "0.875rem",
  });

  const getErrorStyle = () => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "canvasText",
    opacity: 0.6,
    fontSize: "0.875rem",
    textAlign: "center",
    padding: "0.5rem",
  });

  return (
    <BaseWidget
      padding="0.875rem 0.5rem 0.875rem 0.875rem"
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <div ref={containerRef} style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.75rem" }}>
        <div style={getHeaderStyle()}>
          <h3 style={getH3Style()}>GitHub Profile</h3>
          {profile && (
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={getLinkIconStyle()}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.7";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <img 
                src="/followLink.svg" 
                alt="Open GitHub Profile" 
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                style={{ 
                  width: "100%", 
                  height: "100%",
                  filter: "brightness(0) invert(1)"
                }}
              />
            </a>
          )}
        </div>
        {loading ? (
          <div style={getLoadingStyle()}>Loading...</div>
        ) : error ? (
          <div style={getErrorStyle()}>
            {error.includes("not found") 
              ? `User "${GITHUB_USERNAME}" not found` 
              : "Failed to load GitHub data"}
          </div>
        ) : (
          <>
            {/* Profile Stats */}
            {profile && !sizeClass.includes("very-short") && (
              <div style={getStatsStyle()}>
                <div style={getStatItemStyle()}>
                  <span style={getStatValueStyle()}>{profile.public_repos}</span>
                  <span style={getStatLabelStyle()}>Public Repositories</span>
                </div>
              </div>
            )}

            {/* Top Languages */}
            {languages.length > 0 && (
              <div style={getLanguagesContainerStyle()}>
                {!sizeClass.includes("very-short") && (
                  <div style={{ 
                    fontSize: "0.8125rem", 
                    fontWeight: 600,
                    color: "canvasText", 
                    opacity: 0.85, 
                    marginBottom: "0.125rem" 
                  }}>
                    Top Languages
                  </div>
                )}
                {languages.map((lang) => (
                  <div key={lang.name} style={getLanguageItemStyle()}>
                    <span style={getLanguageNameStyle()}>{lang.name}</span>
                    <div style={getLanguageBarStyle()}>
                      <div style={getLanguageFillStyle(lang.name, lang.percentage)} />
                    </div>
                    <span style={getLanguagePercentStyle()}>
                      {lang.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Repositories */}
            {repos.length > 0 && (
              <div style={getReposContainerStyle()}>
                {!sizeClass.includes("very-short") && (
                  <div style={{ 
                    fontSize: "0.8125rem", 
                    fontWeight: 600,
                    color: "canvasText", 
                    opacity: 0.85, 
                    marginBottom: "0.5rem" 
                  }}>
                    Recent Repositories
                  </div>
                )}
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    style={getRepoItemStyle()}
                    onClick={() => window.open(repo.html_url, "_blank")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "color-mix(in hsl, canvasText, transparent 94%)";
                      e.currentTarget.style.borderColor = "color-mix(in hsl, canvasText, transparent 85%)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 2px 4px color-mix(in hsl, canvasText, transparent 96%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "color-mix(in hsl, canvasText, transparent 96%)";
                      e.currentTarget.style.borderColor = "color-mix(in hsl, canvasText, transparent 92%)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 2px color-mix(in hsl, canvasText, transparent 98%)";
                    }}
                  >
                    <div style={getRepoNameStyle()}>
                      <span>📦</span>
                      <span>{repo.name}</span>
                    </div>
                    {repo.description && (
                      <div style={getRepoDescStyle()}>{repo.description}</div>
                    )}
                    <div style={getRepoMetaStyle()}>
                      {repo.language && (
                        <span>
                          <span style={{ color: getLanguageColor(repo.language) }}>●</span> {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && (
                        <span>⭐ {repo.stargazers_count}</span>
                      )}
                      {repo.forks_count > 0 && (
                        <span>🍴 {repo.forks_count}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </BaseWidget>
  );
}
