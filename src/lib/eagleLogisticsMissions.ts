import type { EagleLogisticsMissionId } from "@/types/logisticsExtraction";

export const EAGLE_LOGISTICS_MISSION_OPTIONS: ReadonlyArray<{
  id: EagleLogisticsMissionId;
  title: string;
  description: string;
}> = [
  {
    id: "bill_of_lading",
    title: "Bill of Lading",
    description: "Ocean or multimodal BOL: parties, routing, containers, cargo, and freight terms.",
  },
  {
    id: "packing_list",
    title: "Packing list",
    description: "Cartons, SKUs, quantities, weights, dimensions, and shipping marks.",
  },
  {
    id: "freight_quotation",
    title: "Freight quotation",
    description: "Lanes, rates, surcharges, validity, equipment, and transit or service terms.",
  },
];

export function isEagleLogisticsMissionId(v: string): v is EagleLogisticsMissionId {
  return v === "bill_of_lading" || v === "packing_list" || v === "freight_quotation";
}
