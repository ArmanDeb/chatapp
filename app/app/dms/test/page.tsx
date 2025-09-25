export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>Si vous voyez cette page, la navigation fonctionne !</p>
      <a href="/app/dms" className="text-blue-500 underline">Retour aux messages privés</a>
    </div>
  )
}
