import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Stethoscope, Loader2, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Account fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Patient profile fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("");

  // Guardian / Emergency
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password || !dateOfBirth) {
      setError("First name, last name, email, password, and date of birth are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          dateOfBirth,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
          address: address || undefined,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          guardianRelation: guardianRelation || undefined,
          emergencyContact: emergencyContact || undefined,
          allergies: allergies || undefined,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Registration failed");
        return;
      }

      // Registration successful — auto-logged in, redirect to dashboard
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto p-3 bg-primary rounded-lg w-fit">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Sign up for MedRecord. Fill in your account and patient details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Account Information ── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Account Information</h3>
              <p className="text-xs text-muted-foreground">Your login credentials</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="firstName"
                  placeholder="Amit"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                  data-testid="input-signup-firstname"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="lastName"
                  placeholder="Gurung"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                  data-testid="input-signup-lastname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                data-testid="input-signup-email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  data-testid="input-signup-password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  data-testid="input-signup-confirm-password"
                />
              </div>
            </div>

            <Separator />

            {/* ── Patient Details ── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Patient Details</h3>
              <p className="text-xs text-muted-foreground">Your medical profile information</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">
                  Date of Birth <span className="text-destructive">*</span>
                </label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  data-testid="input-signup-dob"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium">
                  Gender
                </label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" data-testid="select-signup-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="bloodGroup" className="text-sm font-medium">
                  Blood Group
                </label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger id="bloodGroup" data-testid="select-signup-blood-group">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="emergencyContact" className="text-sm font-medium">
                  Emergency Contact
                </label>
                <Input
                  id="emergencyContact"
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  data-testid="input-signup-emergency"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                placeholder="Kathmandu, Nepal"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-testid="input-signup-address"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="allergies" className="text-sm font-medium">
                Known Allergies
              </label>
              <Textarea
                id="allergies"
                placeholder="List any known allergies, or write 'None'"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                data-testid="input-signup-allergies"
              />
            </div>

            <Separator />

            {/* ── Guardian Information ── */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Guardian Information</h3>
              <p className="text-xs text-muted-foreground">Required for minors; optional for adults</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="guardianName" className="text-sm font-medium">
                  Guardian Name
                </label>
                <Input
                  id="guardianName"
                  placeholder="Full name"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  data-testid="input-signup-guardian-name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="guardianRelation" className="text-sm font-medium">
                  Relation
                </label>
                <Input
                  id="guardianRelation"
                  placeholder="e.g. Father, Mother"
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  data-testid="input-signup-guardian-relation"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="guardianPhone" className="text-sm font-medium">
                Guardian Phone
              </label>
              <Input
                id="guardianPhone"
                type="tel"
                placeholder="98XXXXXXXX"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                data-testid="input-signup-guardian-phone"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-signup-submit"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline font-medium"
                onClick={() => setLocation("/login")}
              >
                Sign in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
