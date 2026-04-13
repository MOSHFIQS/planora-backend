import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
     try {
          const isSuperAdminExist = await prisma.user.findFirst({
               where: {
                    role: Role.SUPERADMIN,
               },
          });

          if (isSuperAdminExist) {
               return;
          }

          const superAdminUser = await auth.api.signUpEmail({
               body: {
                    email: envVars.SUPER_ADMIN_EMAIL,
                    password: envVars.SUPER_ADMIN_PASSWORD,
                    name: "Super Admin",
                    role: Role.SUPERADMIN,
                    rememberMe: false,
               },
          });

          await prisma.user.update({
               where: {
                    id: superAdminUser.user.id,
               },
               data: {
                    emailVerified: true,
               },
          });

          console.log("Super Admin Created successfully");
     } catch (error) {
          console.error("Error seeding super admin: ", error);
     }
};