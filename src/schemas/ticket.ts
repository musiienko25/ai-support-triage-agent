import { z } from "zod";

export const ticketSchema = z.object({
  ticketId: z.string().min(3),
  customerId: z.string().min(2),
  channel: z.enum(["email", "chat", "web", "phone"]),
  subject: z.string().min(3),
  message: z.string().min(10),
  createdAt: z.string().datetime(),
  metadata: z
    .object({
      locale: z.string().optional(),
      product: z.string().optional()
    })
    .optional()
});

export type TicketInput = z.infer<typeof ticketSchema>;
