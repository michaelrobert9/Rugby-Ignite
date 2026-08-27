import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "./firebase";

// Small demo screen that proves the Firebase/Firestore connection is live.
// Replace this with your real app once you've confirmed it works.
export default function App() {
  const [status, setStatus] = useState("Connecting to Firestore…");

  useEffect(() => {
    async function checkConnection() {
      try {
        // Reads up to one doc from a "matches" collection. It's fine if the
        // collection doesn't exist yet — an empty result still means the
        // connection succeeded.
        const snap = await getDocs(query(collection(db, "matches"), limit(1)));
        setStatus(
          `✅ Connected to Firestore (project: match-pulse-4560e). ` +
            `Found ${snap.size} doc(s) in "matches".`
        );
      } catch (err) {
        setStatus(`❌ Firestore error: ${err.message}`);
      }
    }
    checkConnection();
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>🏉 Rugby-Ignite</h1>
      <p>{status}</p>
    </main>
  );
}
