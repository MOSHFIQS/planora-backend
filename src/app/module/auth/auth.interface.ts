

export interface IRegisterUserPayload {
     name: string;
     email: string;
     password: string;
     image: string;
     role?: "USER" | "ORGANIZER";
}

export interface IChangePasswordPayload {
     currentPassword: string;
     newPassword: string;
}
