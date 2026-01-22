interface ItineraryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Itinerary View</h1>
        <p className="text-muted-foreground">
          Viewing itinerary: <code className="bg-muted px-2 py-1 rounded">{id}</code>
        </p>
        <p className="text-muted-foreground mt-2">Drag-drop itinerary editor coming soon...</p>
      </div>
    </div>
  );
}
