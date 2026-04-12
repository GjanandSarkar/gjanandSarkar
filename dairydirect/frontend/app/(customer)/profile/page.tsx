"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import {
  ChevronRight,
  Bell,
  ShoppingCart,
  User2,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  HelpCircle,
  Headphones,
  LogOut,
  CheckCircle2,
  Star,
  Loader,
} from "lucide-react";
import { useAppContext } from "@/lib/context";

const C = {
  green: "#3f6530",
  greenPale: "#c2efac",
  brown: "#8a5025",
  surfaceLow: "#f4f4ed",
  surfaceHi: "#e8e9e2",
  surfaceMid: "#eeeee7",
  greenMint: "#bfedce",
  white: "#ffffff",
  text: "#1a1c18",
  muted: "#43493e",
  faint: "#73796d",
  error: "#ba1a1a",
};

type UserProfile = {
  id: string;
  phone: string;
  name: string;
  role: string;
};

type SettingItem = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  badge?: string;
  danger?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const { subscriptions } = useAppContext();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Fetch fresh profile data from API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else if (response.status === 401) {
        // Token expired
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/auth/login");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const activeCount = subscriptions.filter((s) => s.status === "Active").length;

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Account Settings",
      items: [
        { icon: User2, label: "Edit Profile" },
        { icon: MapPin, label: "Saved Addresses" },
        { icon: CreditCard, label: "Payment Methods" },
      ],
    },
    {
      title: "Orders & Subscriptions",
      items: [
        { icon: Truck, label: "My Orders" },
        {
          icon: Calendar,
          label: "My Subscriptions",
          badge: `${activeCount} ACTIVE`,
        },
      ],
    },
    {
      title: "Help & Support",
      items: [
        { icon: HelpCircle, label: "FAQs" },
        { icon: Headphones, label: "Contact Support" },
        { icon: LogOut, label: "Logout", danger: true },
      ],
    },
  ];

  if (loading) {
    return (
      <MobileLayout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Loader
            size={40}
            style={{ color: C.green }}
            className="animate-spin"
          />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
          }}
        >
          <p style={{ color: C.error, marginBottom: "16px" }}>
            {error || "Failed to load profile"}
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            style={{
              padding: "12px 24px",
              backgroundColor: C.green,
              color: C.white,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <header
        className="mobile-only-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          background: "rgba(250,250,243,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(195,201,187,0.3)",
        }}
      >
        <span style={{ fontSize: "22px", fontWeight: 800, color: C.text }}>
          Profile
        </span>
        <div style={{ display: "flex", gap: "18px" }}>
          <Bell size={22} color={C.faint} />
          <ShoppingCart size={22} color={C.faint} />
        </div>
      </header>

      <div style={{ padding: "20px" }}>
        {/* Avatar Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "28px",
            paddingTop: "12px",
          }}
        >
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <div
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid #fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: C.greenPale,
                  fontSize: "40px",
                  fontWeight: "bold",
                  color: C.green,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <button
              style={{
                position: "absolute",
                bottom: "4px",
                right: "0",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                backgroundColor: C.green,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(63,101,48,0.4)",
              }}
            >
              <User2 size={14} />
            </button>
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: C.text,
              marginBottom: "4px",
            }}
          >
            {user.name}
          </h2>
          <p style={{ fontSize: "14px", color: C.muted, fontWeight: 500 }}>
            +91 {user.phone}
          </p>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(140px, 1fr) minmax(140px, 1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: "16px",
              padding: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 12px rgba(63,101,48,0.06)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: C.green,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                Role
              </p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>
                {user.role}
              </p>
            </div>
            <CheckCircle2 size={28} color={C.green} />
          </div>
          <div
            style={{
              backgroundColor: C.white,
              borderRadius: "16px",
              padding: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 12px rgba(63,101,48,0.06)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: C.brown,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                Active Plans
              </p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>
                {activeCount}
              </p>
            </div>
            <Star size={28} color="#f59e0b" fill="#f59e0b" />
          </div>
        </div>

        {/* Settings Sections */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          {settingSections.map((section) => (
            <div key={section.title}>
              <h3
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: C.faint,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "10px",
                  paddingLeft: "4px",
                }}
              >
                {section.title}
              </h3>
              <div
                style={{
                  backgroundColor: C.surfaceLow,
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                {section.items.map(
                  ({ icon: Icon, label, badge, danger }, idx) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (danger) {
                          handleLogout();
                        }
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "15px 16px",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        backgroundColor: "transparent",
                        borderTop:
                          idx > 0 ? "1px solid rgba(195,201,187,0.2)" : "none",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = C.surfaceHi)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                        }}
                      >
                        <Icon size={20} color={danger ? C.error : C.green} />
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: danger ? C.error : C.text,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {badge && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              backgroundColor: C.greenMint,
                              color: "#002111",
                            }}
                          >
                            {badge}
                          </span>
                        )}
                        {!danger && <ChevronRight size={18} color={C.faint} />}
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", paddingBottom: "10px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: C.muted }}>
            DairyDirect v4.2.1
          </p>
          <p style={{ fontSize: "12px", color: C.faint, marginTop: "2px" }}>
            Farm-to-table since 2018
          </p>
        </div>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .mobile-only-header { display: none !important; }
        }
      `}</style>
    </MobileLayout>
  );
}
