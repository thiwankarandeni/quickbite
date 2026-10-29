export default function AboutLayout({ children }: LayoutProps<"/about">) {
  return (
    <div className="rounded-2xl border-4 border-dashed border-orange-400 p-6">
      <p className="mb-4 text-sm text-orange-600">I am the about layout</p>
      {children}
    </div>
  );
}
