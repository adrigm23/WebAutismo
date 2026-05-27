export type PrivateNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type PrivateNavSection = "courses" | "account";

export function getPrivateNavItems(activeSection: PrivateNavSection): PrivateNavItem[] {
  return [
    {
      label: "Mis cursos",
      href: "/mis-cursos",
      active: activeSection === "courses",
    },
    {
      label: "Mi cuenta",
      href: "/mi-cuenta",
      active: activeSection === "account",
    },
  ];
}
