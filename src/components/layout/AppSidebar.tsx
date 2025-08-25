import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Scan, 
  Bot, 
  Users, 
  FileText, 
  Settings, 
  Shield,
  LogOut
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
import { useAuth } from '@/hooks/useAuth';

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
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const canAccessAdmin = usePermission('accessAdminPanel');
  
  const isCollapsed = state === 'collapsed';
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  const getNavClassName = (active: boolean) => 
    active 
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

  return (
    <Sidebar 
      className="border-sidebar-border"
      role="complementary"
      aria-label="Main navigation sidebar"
    >
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel 
            className="text-sidebar-foreground font-semibold px-3 py-2"
            id="sidebar-navigation"
          >
            FindableAI
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu 
              className="space-y-1"
              role="navigation"
              aria-labelledby="sidebar-navigation"
            >
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="min-h-[44px] w-full">
                    <NavLink 
                      to={item.url}
                      aria-label={`Navigate to ${item.title}`}
                      className={(navData) => `
                        flex items-center gap-3 px-3 py-3 rounded-md transition-colors
                        btn-focus
                        ${navData?.isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <item.icon 
                        className="h-5 w-5 flex-shrink-0" 
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span className="flex-1 text-left">{item.title}</span>}
                      {isCollapsed && <span className="sr-only">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {canAccessAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="min-h-[44px] w-full">
                    <NavLink 
                       to="/admin"
                       aria-label="Navigate to Admin panel"
                       className={(navData) => `
                         flex items-center gap-3 px-3 py-3 rounded-md transition-colors
                         btn-focus
                         ${navData?.isActive 
                           ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                           : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                         }
                       `}
                    >
                      <Shield 
                        className="h-5 w-5 flex-shrink-0" 
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span className="flex-1 text-left">Admin</span>}
                      {isCollapsed && <span className="sr-only">Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Logout Section at bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="min-h-[44px] w-full hover:bg-destructive hover:text-destructive-foreground"
                >
                  <div className="flex items-center gap-3 px-3 py-3 rounded-md transition-colors">
                    <LogOut 
                      className="h-5 w-5 flex-shrink-0" 
                      aria-hidden="true"
                    />
                    {!isCollapsed && <span className="flex-1 text-left">Log Out</span>}
                    {isCollapsed && <span className="sr-only">Log Out</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}