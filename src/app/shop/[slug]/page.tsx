export default async function Shop({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main style={{ padding: 24 }}>
      <h1>{slug}</h1>
      <p>Vitrin Faz 4'te burada oluşacak.</p>
    </main>
  );
}
