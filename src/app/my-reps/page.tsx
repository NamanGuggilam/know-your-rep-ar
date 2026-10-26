import type { Metadata } from "next";
import { Lineup } from "@/components/Lineup";

export const metadata: Metadata = { title: "Your representatives" };

export default function MyRepsPage() {
  return <Lineup />;
}
