import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const navLinks = [
    { href: "/superadmin", label: "Dashboard", icon: "📊" },
    { href: "/superadmin/plans", label: "Plan", icon: "💎" },
    { href: "/superadmin/families", label: "Keluarga", icon: "👨‍👩‍👧" },
    { href: "/superadmin/payments", label: "Pembayaran", icon: "💳" },
    { href: "/superadmin/analytics", label: "Analitik", icon: "📈" },
    { href: "/superadmin/audit", label: "Audit Log", icon: "📋" },
    { href: "/superadmin/security/login-attempts", label: "Keamanan", icon: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <p className="font-bold text-sm text-white">Misi Pintar</p>
              <p className="text-xs text-red-400 font-semibold">SUPER ADMIN</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-2 px-3">{session.user.email}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
            >
              <span>🚪</span>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-56">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
