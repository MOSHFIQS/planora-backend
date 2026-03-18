import { ParticipationStatus } from "../../../generated/prisma/enums";

export interface IJoinEventPayload {
  eventId: string;
}

export interface IUpdateParticipationStatusPayload {
  status: ParticipationStatus;
}