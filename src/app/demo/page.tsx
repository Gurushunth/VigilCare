import type { Metadata } from "next";
import { DemoShell } from "@/components/demo/DemoShell";

export const metadata: Metadata = {
  title: "Live demo · PatientShield",
  description: "Three PatientShield screens that run entirely on this device: emergency triage, bedside translator and bill auditor.",
};

export default function DemoPage() {
  return <DemoShell />;
}
