// scripts/migrateUsers.js
import mongoose from "mongoose";
import User from "../models/user.model.js"; // adjust path if needed
// import adaloUsers from "../adaloUsers.json"; // exported Adalo data
import fs from "fs";

const adaloUsers = JSON.parse(fs.readFileSync("./adaloUsers.json", "utf-8"));


async function migrateUsers() {
  const uniqueUsers = [];
  const seen = new Set();

  for (const user of adaloUsers) {
    if (!seen.has(user.email)) {
      seen.add(user.email);
      uniqueUsers.push(user);
    }
  }
  try {
    await mongoose.connect("mongodb+srv://NIHI:Nihidonation2025@nihi-cluster.afnxizh.mongodb.net/?retryWrites=true&w=majority&appName=NIHI-CLUSTER");

    for (const adaloUser of adaloUsers) {
      const newUser = new User({
        name: adaloUser["Full Name"] || "Unknown",
        email: adaloUser.Email,
        password: "TEMP_PASSWORD", // 🔑 Adalo passwords won’t migrate, set/reset later
        phone: adaloUser.phone || "",
        bio: adaloUser.bio || "",
        state: adaloUser.state || "",
        lga: adaloUser.lga || "",
        logo: adaloUser.logo || "",
        role: "user",
        accountType: "individual",
        amountDonated: adaloUser.amountDonated || 0,
        emailVerified: false,
        verificationStatus: "unverified",
        createdAt: new Date(adaloUser.Created),
        updatedAt: new Date(adaloUser.Created),
      });

      await newUser.save();
      console.log(`✅ Migrated user: ${newUser.email}`);
    }

    console.log("🎉 Migration complete!");
    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Migration error:", error);
    mongoose.disconnect();
  }
}

// migrateUsers();

//to migrate users to mongodb database run this script
//  node scripts/migrateUsers.js