export default async function HelloPage({ params }: PageProps<"/about/[name]">) {
  const { name } = await params;
  return <h1 className="text-2xl font-bold">Hello, {name}! 👋</h1>;
}
