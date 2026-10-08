"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { BadgeAlert, Pencil, Save, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { loadJSON, saveJSON } from "@/lib/storage";

export type Passport = {
  name: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  contact1: string;
  contact2: string;
};

// Clearly fictional sample values; the family replaces them with their own.
export const SAMPLE_PASSPORT: Passport = {
  name: "Demo Patient (sample)",
  bloodType: "B+",
  allergies: "Penicillin (severe rash), peanuts",
  conditions: "Type 2 diabetes, high blood pressure",
  contact1: "Son: +91 00000 00001",
  contact2: "Daughter: +91 00000 00002",
};

const STORAGE_KEY = "passport";

export function passportText(p: Passport): string {
  return [
    "EMERGENCY HEALTH PASSPORT",
    `Name: ${p.name}`,
    `Blood type: ${p.bloodType}`,
    `Severe allergies: ${p.allergies || "None known"}`,
    `Chronic conditions: ${p.conditions || "None known"}`,
    `Emergency contact: ${p.contact1}`,
    p.contact2 ? `Emergency contact: ${p.contact2}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function EmergencyPassport() {
  const [passport, setPassport] = useState<Passport>(SAMPLE_PASSPORT);
  const [editing, setEditing] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    // Read saved details after mount (localStorage is not available during prerender).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPassport(loadJSON(STORAGE_KEY, SAMPLE_PASSPORT));
  }, []);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(passportText(passport), { errorCorrectionLevel: "M", margin: 1, width: 360, color: { dark: "#0F2A33", light: "#FFFFFF" } })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [passport]);

  const field = (key: keyof Passport, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pp-${key}`}>{label}</Label>
      <Input
        id={`pp-${key}`}
        value={passport[key]}
        placeholder={placeholder}
        onChange={(e) => setPassport((p) => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Smartphone className="size-6 text-primary" aria-hidden /> Emergency health passport
        </CardTitle>
        <CardDescription>
          Preview of a lock-screen badge that responders can read without unlocking the phone. A web page cannot set your real lock
          screen, so this is a preview. Details are saved only on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="mx-auto w-full max-w-[22rem] rounded-[2rem] bg-ink p-5 text-white shadow-lift">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span className="tabular-nums">Lock screen</span>
            <span>Preview</span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#B42318]">
            <BadgeAlert className="size-5" aria-hidden />
            <span className="font-display text-sm font-extrabold uppercase tracking-wider">Emergency medical info</span>
          </div>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2">
              <dt className="text-white/75">Name</dt>
              <dd className="text-right font-semibold">{passport.name || "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-white/15 pb-2">
              <dt className="text-white/75">Blood type</dt>
              <dd className="font-display text-3xl font-extrabold">{passport.bloodType || "—"}</dd>
            </div>
            <div className="border-b border-white/15 pb-2">
              <dt className="text-white/75">Severe allergies</dt>
              <dd className="mt-0.5 font-semibold">{passport.allergies || "None known"}</dd>
            </div>
            <div className="border-b border-white/15 pb-2">
              <dt className="text-white/75">Chronic conditions</dt>
              <dd className="mt-0.5 font-semibold">{passport.conditions || "None known"}</dd>
            </div>
            <div>
              <dt className="text-white/75">Emergency contacts</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {passport.contact1}
                {passport.contact2 && <span className="block">{passport.contact2}</span>}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 text-ink">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL generated on the device
              <img src={qr} alt="QR code containing the same details as plain text" className="size-28 shrink-0" />
            ) : (
              <div className="size-28 shrink-0 rounded bg-page" />
            )}
            <p className="text-xs leading-snug text-muted">Scan for the same details as plain text. No internet or app needed.</p>
          </div>
        </div>

        <div>
          {editing ? (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveJSON(STORAGE_KEY, passport);
                setEditing(false);
                setSavedNote(true);
                setTimeout(() => setSavedNote(false), 2000);
              }}
            >
              {field("name", "Name")}
              {field("bloodType", "Blood type", "e.g. O+")}
              <div className="sm:col-span-2">{field("allergies", "Severe allergies", "e.g. Penicillin")}</div>
              <div className="sm:col-span-2">{field("conditions", "Chronic conditions", "e.g. Asthma")}</div>
              {field("contact1", "Emergency contact 1")}
              {field("contact2", "Emergency contact 2")}
              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit">
                  <Save aria-hidden /> Save on this device
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPassport(loadJSON(STORAGE_KEY, SAMPLE_PASSPORT));
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-[16px] leading-relaxed text-ink">
                In an emergency, paramedics and hospital staff check the phone&rsquo;s lock screen for medical details. PatientShield keeps
                the essentials there, so the family does not have to remember them in a panic.
              </p>
              <p className="rounded-xl bg-page p-3 text-sm text-muted">
                Shown with fictional sample values. Edit them to see the card and QR code update.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil aria-hidden /> Edit details
                </Button>
                {savedNote && (
                  <span role="status" className="text-sm font-semibold text-primary-ink">
                    Saved on this device
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
