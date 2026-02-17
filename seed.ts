import "dotenv/config";
import { storage } from "./server/storage";
import { db } from "./server/db";
import { users, hospitals } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking database state...");

    // Check Hospital
    let hospital = await storage.getHospital(1);
    if (!hospital) {
        console.log("Hospital 1 not found. Creating default hospital...");
        hospital = await storage.createHospital({
            name: "City General Hospital",
            address: "123 Health St, Kathmandu",
            district: "Kathmandu",
            phone: "01-4422333",
            email: "info@citygeneral.com",
        });
        console.log("Created hospital:", hospital);
    } else {
        console.log("Hospital 1 exists:", hospital.name);
    }

    // Check Users
    const allUsers = await storage.getUsers();
    if (allUsers.length === 0) {
        console.log("No users found. Creating default admin...");
        await storage.upsertUser({
            email: "admin@example.com",
            firstName: "System",
            lastName: "Admin",
            role: "admin",
            hospitalId: hospital.id,
        });
    }

    // Create a Patient
    const patientUser = await storage.getUserByEmail("patient@example.com");
    if (!patientUser) {
        console.log("Creating default patient...");
        const user = await storage.upsertUser({
            email: "patient@example.com",
            firstName: "John",
            lastName: "Doe",
            role: "patient",
            hospitalId: hospital.id,
        });

        await storage.createPatient({
            userId: user.id! as string, // Cast to string if needed, depending on schema types, actually user.id is serial number likely
            dateOfBirth: "1990-01-01",
            address: "Kathmandu",
            emergencyContactName: "Jane Doe",
            emergencyContactPhone: "9800000000",
            bloodType: "O+",
            allergies: "None",
        });
        console.log("Created patient John Doe");
    }

    // Create a Doctor
    const doctorUser = await storage.getUserByEmail("doctor@example.com");
    if (!doctorUser) {
        console.log("Creating default doctor...");
        await storage.upsertUser({
            email: "doctor@example.com",
            firstName: "Ramesh",
            lastName: "Sharma",
            role: "doctor",
            hospitalId: hospital.id,
        });
        console.log("Created doctor Ramesh Sharma");
    }

    console.log("Seed check complete.");
    process.exit(0);
}

main().catch(console.error);
