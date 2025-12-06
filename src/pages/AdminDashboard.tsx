import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AdminGuard } from "@/components/AdminGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminPropertyTable } from "@/components/admin/AdminPropertyTable";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { AdminBlogTable } from "@/components/admin/AdminBlogTable";
import { useAdminData } from "@/hooks/useAdminData";
import { Building2, Users, FileText, BarChart3 } from "lucide-react";
import { Helmet } from "react-helmet-async";

function AdminDashboardContent() {
  const {
    properties,
    users,
    blogPosts,
    userRoles,
    stats,
    isLoading,
    updateProperty,
    updateUser,
    updateBlogPost,
    assignRole,
    removeRole,
    deleteBlogPost,
  } = useAdminData();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Admin Dashboard | Lukemanbnb</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage properties, users, and content
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Properties</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Blog</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStats stats={stats} />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Properties</h3>
              <div className="rounded-lg border p-4 space-y-3">
                {properties?.slice(0, 5).map(property => (
                  <div key={property.id} className="flex justify-between items-center">
                    <span className="truncate max-w-[200px]">{property.title}</span>
                    <span className="text-sm text-muted-foreground">
                      KES {property.price_per_night}/night
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Users</h3>
              <div className="rounded-lg border p-4 space-y-3">
                {users?.slice(0, 5).map(user => (
                  <div key={user.id} className="flex justify-between items-center">
                    <span className="truncate max-w-[200px]">
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : 'Unnamed User'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {user.is_property_owner ? 'Owner' : 'User'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <AdminPropertyTable 
            properties={properties}
            onUpdateProperty={(params) => updateProperty.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="users">
          <AdminUserTable 
            users={users}
            userRoles={userRoles}
            onUpdateUser={(params) => updateUser.mutate(params)}
            onAssignRole={(params) => assignRole.mutate(params)}
            onRemoveRole={(params) => removeRole.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="blog">
          <AdminBlogTable 
            blogPosts={blogPosts}
            onUpdateBlogPost={(params) => updateBlogPost.mutate(params)}
            onDeleteBlogPost={(id) => deleteBlogPost.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AdminDashboardContent />
        </main>
        <Footer />
      </div>
    </AdminGuard>
  );
}
