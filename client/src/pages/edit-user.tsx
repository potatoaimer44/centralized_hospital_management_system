import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { User, UserRole } from "@shared/schema";

const formSchema = z.object({
  role: z.enum(["admin", "doctor", "nurse", "patient"]),
});

export default function EditUserPage() {
  const [, params] = useRoute("/users/:id/edit");
  const [, setLocation] = useLocation();
  const id = params?.id ?? "";
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/users", id],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const users: User[] = await res.json();
      return users.find((u) => u.id === id) ?? null;
    },
    enabled: !!id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: user ? { role: (user.role as UserRole) || "patient" } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("PATCH", `/api/users/${id}/role`, { role: values.role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated. Only admins can assign roles.",
      });
      setLocation("/users");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate(values);
  }

  if (!id || (user === undefined && !isLoading)) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="link" asChild>
          <Link href="/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/users">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <CardTitle>Edit User Role</CardTitle>
          </div>
          <p className="text-muted-foreground text-sm">
            {user
              ? `${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email}). Only admins can change roles.`
              : "Loading..."}
          </p>
        </CardHeader>
        <CardContent>
          {user && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="patient">Patient</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Role
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/users">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
