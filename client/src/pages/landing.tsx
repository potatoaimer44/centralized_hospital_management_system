import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Shield, 
  Stethoscope, 
  Building2, 
  FileText, 
  Activity, 
  Lock,
  Users,
  ClipboardCheck
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure access control for admins, doctors, nurses, and patients with granular permissions.",
  },
  {
    icon: Building2,
    title: "Multi-Hospital Support",
    description: "Centralized records accessible across all Kathmandu Valley hospitals.",
  },
  {
    icon: FileText,
    title: "Complete Medical Records",
    description: "Comprehensive patient records including diagnoses, prescriptions, and lab results.",
  },
  {
    icon: Activity,
    title: "Vital Signs Tracking",
    description: "Real-time monitoring and recording of patient vital signs.",
  },
  {
    icon: Lock,
    title: "Audit Logging",
    description: "Complete audit trail of all system activities for compliance and security.",
  },
  {
    icon: ClipboardCheck,
    title: "Access Requests",
    description: "Controlled cross-hospital record access with approval workflows.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-md">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">MedRecord</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login" variant="outline">
              <a href="#roles">Select Role</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section id="roles" className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
              <Shield className="h-4 w-4" />
              Secure Medical Records Management
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Centralized Healthcare for{" "}
              <span className="text-primary">Kathmandu Valley</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A secure, AI-integrated medical records management system connecting hospitals, 
              doctors, nurses, and patients across Kathmandu Valley.
            </p>
            <div className="flex flex-col items-center gap-6 pt-4">
              <p className="text-sm text-muted-foreground">Select your role to login:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button size="lg" asChild className="bg-purple-600 hover:bg-purple-700" data-testid="button-login-admin">
                  <a href="/api/login/admin">
                    <Users className="mr-2 h-4 w-4" />
                    Admin
                  </a>
                </Button>
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700" data-testid="button-login-doctor">
                  <a href="/api/login/doctor">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Doctor
                  </a>
                </Button>
                <Button size="lg" asChild className="bg-green-600 hover:bg-green-700" data-testid="button-login-nurse">
                  <a href="/api/login/nurse">
                    <Activity className="mr-2 h-4 w-4" />
                    Nurse
                  </a>
                </Button>
                <Button size="lg" asChild className="bg-gray-600 hover:bg-gray-700" data-testid="button-login-patient">
                  <a href="/api/login/patient">
                    <FileText className="mr-2 h-4 w-4" />
                    Patient
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built with security and efficiency in mind for modern healthcare management
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="overflow-visible" data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader>
                    <div className="p-2 bg-primary/10 rounded-md w-fit mb-2">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">For Every Role</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tailored dashboards and workflows for each user type
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="overflow-visible text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="mx-auto p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Administrators</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage users, hospitals, and system security
                  </p>
                </CardContent>
              </Card>
              <Card className="overflow-visible text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="mx-auto p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit">
                    <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Doctors</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage patient medical records
                  </p>
                </CardContent>
              </Card>
              <Card className="overflow-visible text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="mx-auto p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Nurses</h3>
                  <p className="text-sm text-muted-foreground">
                    Record vital signs and assist with patient care
                  </p>
                </CardContent>
              </Card>
              <Card className="overflow-visible text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="mx-auto p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                    <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="font-semibold">Patients</h3>
                  <p className="text-sm text-muted-foreground">
                    View medical history and vital signs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              MedRecord - Kathmandu Valley Healthcare
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Secure, centralized medical records for teenagers
          </p>
        </div>
      </footer>
    </div>
  );
}
