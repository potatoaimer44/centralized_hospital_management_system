import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { useState } from "react";
import type { Hospital } from "@shared/schema";

export default function HospitalsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: hospitals, isLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const filteredHospitals = hospitals?.filter((hospital) => {
    const search = searchQuery.toLowerCase();
    return (
      hospital.name?.toLowerCase().includes(search) ||
      hospital.district?.toLowerCase().includes(search) ||
      hospital.address?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Hospitals</h1>
          <p className="text-muted-foreground">Manage healthcare facilities in Kathmandu Valley</p>
        </div>
        <Button data-testid="button-add-hospital">
          <Plus className="h-4 w-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search hospitals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-hospitals"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredHospitals?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hospitals found</p>
          {searchQuery ? (
            <p className="text-sm mt-1">Try a different search term</p>
          ) : (
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Hospital
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals?.map((hospital) => (
            <Card key={hospital.id} className="overflow-visible hover-elevate cursor-pointer" data-testid={`hospital-card-${hospital.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{hospital.name}</CardTitle>
                <CardDescription>{hospital.district}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {hospital.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{hospital.address}</span>
                  </div>
                )}
                {hospital.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{hospital.phone}</span>
                  </div>
                )}
                {hospital.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{hospital.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
