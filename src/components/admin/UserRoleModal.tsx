import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Star, Crown } from 'lucide-react';

const roles = ['user', 'manager', 'admin'] as const;
const plans = ['free', 'pro', 'growth', 'enterprise'] as const;

type Role = typeof roles[number];
type Plan = typeof plans[number];

interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  plan: Plan;
  created_at: string;
}

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (id: string, updates: { role?: Role; plan?: Plan }) => Promise<void>;
  isSaving: boolean;
}

const getRoleIcon = (role: Role) => {
  switch (role) {
    case 'admin': return <Crown className="w-4 h-4" />;
    case 'manager': return <Shield className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

const getPlanIcon = (plan: Plan) => {
  switch (plan) {
    case 'enterprise': return <Crown className="w-4 h-4" />;
    case 'growth': return <Star className="w-4 h-4" />;
    case 'pro': return <Shield className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

const getRoleBadgeVariant = (role: Role) => {
  switch (role) {
    case 'admin': return 'destructive';
    case 'manager': return 'default';
    default: return 'secondary';
  }
};

const getPlanBadgeVariant = (plan: Plan) => {
  switch (plan) {
    case 'enterprise': return 'destructive';
    case 'growth': return 'default';
    case 'pro': return 'outline';
    default: return 'secondary';
  }
};

export function UserRoleModal({ isOpen, onClose, user, onSave, isSaving }: UserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(user?.role || 'user');
  const [selectedPlan, setSelectedPlan] = useState<Plan>(user?.plan || 'free');

  const handleSave = async () => {
    if (!user) return;
    
    const updates: { role?: Role; plan?: Plan } = {};
    if (selectedRole !== user.role) updates.role = selectedRole;
    if (selectedPlan !== user.plan) updates.plan = selectedPlan;
    
    if (Object.keys(updates).length > 0) {
      await onSave(user.id, updates);
    }
    onClose();
  };

  const hasChanges = user && (selectedRole !== user.role || selectedPlan !== user.plan);

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit User Permissions
          </DialogTitle>
          <DialogDescription>
            Modify the role and plan for <span className="font-medium text-foreground">{user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User:</span>
              <span className="text-sm">{user.name || 'No name'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm font-mono">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Member since:</span>
              <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Current Role</p>
              <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                {getRoleIcon(user.role)}
                {user.role}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
              <Badge variant={getPlanBadgeVariant(user.plan)} className="gap-1">
                {getPlanIcon(user.plan)}
                {user.plan}
              </Badge>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={(value: Role) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role)}
                      <span className="capitalize">{role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan</label>
            <Select value={selectedPlan} onValueChange={(value: Plan) => setSelectedPlan(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    <div className="flex items-center gap-2">
                      {getPlanIcon(plan)}
                      <span className="capitalize">{plan}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change Preview */}
          {hasChanges && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-medium text-primary mb-2">Pending Changes:</p>
              <div className="flex gap-2 text-xs">
                {selectedRole !== user.role && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                    Role: {user.role} → {selectedRole}
                  </span>
                )}
                {selectedPlan !== user.plan && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                    Plan: {user.plan} → {selectedPlan}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}