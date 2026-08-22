import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "../api/health";

export function HomePage() {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getHealth()
            .then(setHealth)
            .catch(() => {
                setError("Unable to connect to the Waymates API.");
            });
    }, []);

    return (
        <main className="home-page">
        <section className="hero">
            <p className="eyebrow">WAYMATES</p>

            <h1>Plan together.<br />Explore together.<br />Settle up together.</h1>

            <p className="description">
            Your collaborative travel companion for planning trips,
            sharing expenses, and exploring together.
            </p>

            <div className="api-status">
            <span
                className={`status-dot ${
                health ? "healthy" : error ? "error" : "loading"
                }`}
            />

            {health
                ? `${health.service} — ${health.status}`
                : error ?? "Connecting to API..."}
            </div>
        </section>
        </main>
    );
}