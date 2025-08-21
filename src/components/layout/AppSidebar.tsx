import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Scan, 
  Bot, 
  Users, 
  FileText, 
  Settings, 
  Shield 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/usePermission';

const navigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Scans', url: '/scans', icon: Scan },
  { title: 'AI Tests', url: '/ai-tests', icon: Bot },
  { title: 'Competitors', url: '/competitors', icon: Users },
  { title: 'Reports', url: '/reports', icon: FileText },
  { title: 'Account', url: '/account', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const canAccessAdmin = usePermission('accessAdminPanel');
  
  const isCollapsed = state === 'collapsed';
  
  const isActive = (path: string) => location.pathname === path;
  
  const getNavClassName = (active: boolean) => 
    active 
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-semibold px-3 py-2">
            FindableAI
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="min-h-[44px] w-full">
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-3 rounded-md transition-colors
                        btn-focus
                        ${isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {canAccessAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="min-h-[44px] w-full">
                    <NavLink 
                      to="/admin" 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-3 rounded-md transition-colors
                        btn-focus
                        ${isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <Shield className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left">Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}