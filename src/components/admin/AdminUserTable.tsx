import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Shield, ShieldCheck, UserCog, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_property_owner: boolean | null;
  is_suspended?: boolean;
  suspended_reason?: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

type AppRole = 'admin' | 'moderator' | 'user';

interface AdminUserTableProps {
  users: Profile[] | undefined;
  userRoles: UserRole[] | undefined;
  onUpdateUser: (params: { userId: string; updates: Record<string, unknown> }) => void;
  onAssignRole: (params: { userId: string; role: AppRole }) => void;
  onRemoveRole: (params: { userId: string; role: AppRole }) => void;
}

export function AdminUserTable({ users, userRoles, onUpdateUser, onAssignRole, onRemoveRole }: AdminUserTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const getUserRoles = (userId: string) => {
    return userRoles?.filter(r => r.user_id === userId).map(r => r.role) || [];
  };

  const filteredUsers = users?.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) ||
      user.user_id.toLowerCase().includes(search.toLowerCase());
    
    const roles = getUserRoles(user.user_id);
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin" && roles.includes('admin')) ||
      (roleFilter === "moderator" && roles.includes('moderator')) ||
      (roleFilter === "owner" && user.is_property_owner);
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadges = (userId: string) => {
    const roles = getUserRoles(userId);
    return roles.map(role => (
      <Badge 
        key={role} 
        variant={role === 'admin' ? 'destructive' : role === 'moderator' ? 'default' : 'secondary'}
        className="mr-1"
      >
        {role}
      </Badge>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="moderator">Moderators</SelectItem>
            <SelectItem value="owner">Property Owners</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Property Owner</TableHead>
              <TableHead>Suspended</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => {
              const roles = getUserRoles(user.user_id);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name || user.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : 'No name'}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[150px] truncate">
                    {user.user_id}
                  </TableCell>
                  <TableCell>
                    {getRoleBadges(user.user_id)}
                    {roles.length === 0 && (
                      <Badge variant="outline">user</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_property_owner ? (
                      <Badge variant="secondary">Owner</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_suspended ?? false}
                      onCheckedChange={(checked) => onUpdateUser({
                        userId: user.user_id,
                        updates: { is_suspended: checked }
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!roles.includes('admin') && (
                          <DropdownMenuItem onClick={() => onAssignRole({ userId: user.user_id, role: 'admin' })}>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {roles.includes('admin') && (
                          <DropdownMenuItem onClick={() => onRemoveRole({ userId: user.user_id, role: 'admin' })}>
                            <Shield className="h-4 w-4 mr-2" />
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        {!roles.includes('moderator') && (
                          <DropdownMenuItem onClick={() => onAssignRole({ userId: user.user_id, role: 'moderator' })}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                        )}
                        {roles.includes('moderator') && (
                          <DropdownMenuItem onClick={() => onRemoveRole({ userId: user.user_id, role: 'moderator' })}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Remove Moderator
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onUpdateUser({
                          userId: user.user_id,
                          updates: { is_property_owner: !user.is_property_owner }
                        })}>
                          <UserCog className="h-4 w-4 mr-2" />
                          Toggle Property Owner
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredUsers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
