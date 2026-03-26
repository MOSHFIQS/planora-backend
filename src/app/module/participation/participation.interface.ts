import { InvitationStatus, ParticipationStatus } from "../../../generated/prisma/enums";

export interface IJoinEventPayload {
  eventId: string;
}

export interface IUpdateParticipationStatusPayload {
  status: ParticipationStatus;
}


export type EventParticipation = {
  user: { id: string; name: string; email: string; image?: string | null };
  status: ParticipationStatus | null;
};

export type EventInvitation = {
  user: { id: string; name: string; email: string; image?: string | null };
  status: InvitationStatus | null;
};

export type EventData = {
  id: string;
  title: string;
  dateTime: Date;
  participations: EventParticipation[];
  invitations: EventInvitation[];
};

export type UserEvent = {
  eventId: string;
  title: string;
  dateTime: Date;
  invited: boolean;
  participationStatus: ParticipationStatus | null;
  invitationStatus: InvitationStatus | null;
};

export type UserWithEvents = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  events: UserEvent[];
};