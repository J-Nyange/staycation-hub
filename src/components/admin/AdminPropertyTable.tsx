import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  owner_id: string | null;
  is_active: boolean | null;
  is_featured?: boolean;
  moderation_status?: string;
  category: string;
  created_at: string;
}

interface AdminPropertyTableProps {
  properties: Property[] | undefined;
  onUpdateProperty: (params: { id: string; updates: Record<string, unknown> }) => void;
}

export function AdminPropertyTable({ properties, onUpdateProperty }: AdminPropertyTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProperties = properties?.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && property.is_active) ||
      (statusFilter === "inactive" && !property.is_active) ||
      (statusFilter === "featured" && property.is_featured);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties?.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {property.title}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {property.location}
                </TableCell>
                <TableCell>KES {property.price_per_night}/night</TableCell>
                <TableCell>
                  <Badge variant="outline">{property.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={property.moderation_status === 'approved' ? 'default' : 'secondary'}
                  >
                    {property.moderation_status || 'approved'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateProperty({
                      id: property.id,
                      updates: { is_featured: !property.is_featured }
                    })}
                  >
                    <Star 
                      className={`h-4 w-4 ${property.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={property.is_active ?? true}
                    onCheckedChange={(checked) => onUpdateProperty({
                      id: property.id,
                      updates: { is_active: checked }
                    })}
                  />
                </TableCell>
                <TableCell>
                  <Link to={`/properties/${property.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredProperties?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No properties found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
