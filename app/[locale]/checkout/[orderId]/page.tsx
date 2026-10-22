import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthSession } from "@/lib/auth";
import { getBillingOrderForUser } from "@/lib/billing-server";
import { CheckoutClient } from "@/components/billing/CheckoutClient";

interface Props {
  params: { locale: string; orderId: string };
}

const CheckoutPage = async ({ params }: Props) => {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect(`/${params.locale}/sign-in`);
  }

  let order;
  try {
    order = await getBillingOrderForUser(params.orderId, session.user.id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1040px] items-center justify-between px-5 sm:px-8">
          <Link
            href={`/${params.locale}/upgrade`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Plans
          </Link>
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center border border-foreground/70 font-mono text-[10px]">
              TF
            </span>
            <span className="font-display text-xl leading-none">TaskFlow</span>
          </span>
        </div>
      </header>

      <main>
        <CheckoutClient
          order={order}
          locale={params.locale}
          customer={{
            name: session.user.name || session.user.username || "",
            email: session.user.email || "",
          }}
        />
      </main>
    </div>
  );
};

export default CheckoutPage;
