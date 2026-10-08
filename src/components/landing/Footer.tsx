import { Disclaimer } from "@/components/Disclaimer";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <Logo />
          <p className="text-sm text-muted">
            The independent, offline-first health transparency and emergency shield for patients and caregivers.
          </p>
        </div>
        <div className="max-w-xl rounded-2xl border border-line bg-page p-4">
          <Disclaimer />
          <p className="mt-2 pl-6 text-sm text-muted">All hospital, doctor and patient names in the sample data are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
