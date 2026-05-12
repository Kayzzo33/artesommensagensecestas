import { z } from "zod";

export const checkoutSchema = z.object({
  customer_name: z.string().min(3, "Nome completo é obrigatório"),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  neighborhood_id: z.string().min(1, "Bairro é obrigatório"),
  address_street: z.string().min(3, "Rua é obrigatória"),
  address_number: z.string().min(1, "Número é obrigatório"),
  address_complement: z.string().optional(),
  sound_car_message_enabled: z.boolean().default(false),
  personal_message: z.string().max(300, "Mensagem muito longa (max 300)").optional(),
  notes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
