import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
          Blueprint
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Kelola proyek, cashflow, dan RAB konstruksi Anda dalam satu platform
          terintegrasi.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link
            href="https://example.com/payment"
            target="_blank"
            rel="noopener noreferrer"
          >
            Akses Sekarang
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <Link href="/login">Masuk</Link>
        </Button>
      </div>
    </div>
  );
}
