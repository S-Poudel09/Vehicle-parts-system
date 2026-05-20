import AppSidebar from "../layout/AppSidebar";
import { staffSidebarSections } from "./staffSidebarConfig";

type StaffSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function StaffSidebar({ collapsed, onToggle }: StaffSidebarProps) {
  return (
    <AppSidebar
      collapsed={collapsed}
      onToggle={onToggle}
      title="Staff Panel"
      collapsedTitle="S"
      sections={staffSidebarSections}
    />
  );
}
