import type { ComponentType, ReactNode, SVGProps } from "react";

export type SidebarNavItem = {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  end?: boolean;
};

export type SidebarSection = {
  label: string;
  items: SidebarNavItem[];
};

export type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  title: string;
  collapsedTitle?: string;
  logoSrc?: string;
  collapsedLogoSrc?: string;
  sections: SidebarSection[];
  footer?: ReactNode;
};
