import Header from './Header.jsx';

export default function PageShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell max-w-[1100px] flex-1 py-10">{children}</main>
    </div>
  );
}
