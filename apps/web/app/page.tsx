export default function HomePage(): JSX.Element {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>HRMS</h1>
      <p>Phase 1.0 monorepo bootstrap is live. Web shell will be filled out in Phase 7.</p>
      <ul>
        <li>
          API health: <a href="http://localhost:3001/health">localhost:3001/health</a>
        </li>
        <li>
          Admin: <a href="http://localhost:3002">localhost:3002</a>
        </li>
      </ul>
    </main>
  );
}
