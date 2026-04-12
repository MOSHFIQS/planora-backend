import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedAdmin = async () => {
    try {
        const isAdminExist = await prisma.user.findFirst({
            where:{
                role : Role.ADMIN
            }
        })

        if(isAdminExist) {
            // console.log("Admin already exists. Skipping seeding admin.");
            return;
        }

        const superAdminUser = await auth.api.signUpEmail({
            body:{
                email : envVars.SUPER_ADMIN_EMAIL,
                password : envVars.SUPER_ADMIN_PASSWORD,
                name : "Admin",
                role : Role.ADMIN,
                rememberMe : false,
            }
        })

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where : {
                    id : superAdminUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });

            
        });

        const admin = await prisma.user.findFirst({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            }
        })

        console.log("Admin Created ", admin);
    } catch (error) {
        console.error("Error seeding admin: ", error);
        await prisma.user.delete({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            }
        })
    }
}