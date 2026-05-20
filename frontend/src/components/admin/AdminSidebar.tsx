import AppSidebar from "../layout/AppSidebar";
import { adminSidebarSections } from "./adminSidebarConfig";

type AdminSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  return (
    <AppSidebar
      collapsed={collapsed}
      onToggle={onToggle}
      title="Admin Panel"
      collapsedTitle="A"
      sections={adminSidebarSections}
    />
  );
}
