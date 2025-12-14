import { useQuery } from "@tanstack/react-query";
import { AllergyBadge } from "@/components/allergy-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Users,
  Search,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Patient, User } from "@shared/schema";

interface PatientWithUser extends Patient {
  user?: User;
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients, isLoading } = useQuery<PatientWithUser[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter((patient) => {
    const search = searchQuery.toLowerCase();
    const fullName = `${patient.user?.firstName || ""} ${patient.user?.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(search) ||
      patient.user?.email?.toLowerCase().includes(search) ||
      patient.bloodGroup?.toLowerCase().includes(search)
    );
  });

  const getPatientName = (patient: PatientWithUser) => {
    if (!patient?.user) return "Unknown Patient";
    return patient.user.firstName && patient.user.lastName
      ? `${patient.user.firstName} ${patient.user.lastName}`
      : patient.user.email || "Unknown";
  };

  const getPatientInitials = (patient: PatientWithUser) => {
    if (!patient?.user) return "?";
    return patient.user.firstName?.[0] || patient.user.email?.[0]?.toUpperCase() || "?";
  };

  const getAge = (dateOfBirth: string | Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">View and manage patient records</p>
        </div>
        <Button data-testid="button-add-patient">
          <UserPlus className="h-4 w-4 mr-2" />
          Register Patient
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name, email, or blood group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-patients"
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
      ) : filteredPatients?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No patients found</p>
          {searchQuery ? (
            <p className="text-sm mt-1">Try a different search term</p>
          ) : (
            <Button variant="outline" className="mt-4">
              <UserPlus className="h-4 w-4 mr-2" />
              Register First Patient
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients?.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="overflow-visible hover-elevate cursor-pointer h-full" data-testid={`patient-card-${patient.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">{getPatientInitials(patient)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{getPatientName(patient)}</CardTitle>
                        <CardDescription>
                          {getAge(patient.dateOfBirth)} years | {patient.gender}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {patient.bloodGroup && (
                      <Badge variant="outline">{patient.bloodGroup}</Badge>
                    )}
                    {patient.allergies && (
                      <AllergyBadge allergies={patient.allergies} compact />
                    )}
                  </div>
                  
                  {patient.guardianName && (
                    <p className="text-sm text-muted-foreground">
                      Guardian: {patient.guardianName}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-end pt-2">
                    <Button variant="ghost" size="sm">
                      View Records
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
