"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      setMessage("Compte cree avec succes.");
      setEmail("");
      setPassword("");
      setConfirm("");
    } else {
      setMessage(data.error || "Une erreur est survenue.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h1>Creer un compte</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div>
          <label>Mot de passe</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div>
          <label>Confirmer le mot de passe</label>
          <input 
            type="password" 
            value={confirm} 
            onChange={(e) => setConfirm(e.target.value)} 
            required 
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button type="submit" style={{ padding: "0.5rem", cursor: "pointer" }}>S&apos;inscrire</button>
      </form>
      {message && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}